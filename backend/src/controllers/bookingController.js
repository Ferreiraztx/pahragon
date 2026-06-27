const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function validarFuncionamento(dataAgendamentoString, horaAgendamentoStr) {
  const [ano, mes, dia] = dataAgendamentoString.split('-').map(Number);
  const diaSemana = new Date(Date.UTC(ano, mes - 1, dia, 12)).getUTCDay();

  const horario = await prisma.horarioFuncionamento.findUnique({
    where: { diaSemana }
  });

  if (!horario || !horario.ativo) {
    return { liberado: false, motivo: 'A arena está fechada neste dia da semana.' };
  }

  if (horaAgendamentoStr < horario.horaAbertura || horaAgendamentoStr >= horario.horaFechamento) {
    return { liberado: false, motivo: `Fora do horário de funcionamento (${horario.horaAbertura} às ${horario.horaFechamento}).` };
  }

  return { liberado: true };
}

// Criar reserva (Versão Corrigida com Validação Local e Lógica de Conflito Blindada + Trava de Bloqueios)
async function criar(req, res) {
  const { courtId, data, horaInicio, horaFim } = req.body;
  
  const rawUserId = req.user?.id || req.userId;
  const userId = isNaN(Number(rawUserId)) ? rawUserId : Number(rawUserId);

  try {
    // ==========================================================
    // TRAVA DE SEGURANÇA: Validação usando Strings Locais
    // ==========================================================
    const agoraBR = new Date(new Date().getTime() - (3 * 60 * 60 * 1000));
    const ano = agoraBR.getUTCFullYear();
    const mes = String(agoraBR.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(agoraBR.getUTCDate()).padStart(2, '0');
    const hojeString = `${ano}-${mes}-${dia}`;
    
    const horaAtualStr = `${String(agoraBR.getUTCHours()).padStart(2, '0')}:${String(agoraBR.getUTCMinutes()).padStart(2, '0')}`;

    const dataAgendamentoString = data.split('T')[0]; 
    const horaAgendamentoStr = horaInicio.split('T')[1].substring(0, 5); // "20:30"

    if (dataAgendamentoString < hojeString) {
      return res.status(400).json({ error: 'Não é possível agendar em um dia que já passou.' });
    }

    if (dataAgendamentoString === hojeString && horaAgendamentoStr <= horaAtualStr) {
      return res.status(400).json({ error: 'Não é possível agendar em um horário que já passou hoje.' });
    }
    // ==========================================================

    const checkFuncionamento = await validarFuncionamento(dataAgendamentoString, horaAgendamentoStr);
    if (!checkFuncionamento.liberado) {
      return res.status(400).json({ error: checkFuncionamento.motivo });
    }

    // ==========================================================
    // TRAVA COMPLEMENTAR: Verifica se o horário escolhido não está bloqueado
    // ==========================================================
    const bloqueiosAtivos = await prisma.bloqueioQuadra.findMany({
      where: {
        quadraId: Number(courtId),
        data: dataAgendamentoString
      }
    });

    const estaNoBloqueio = bloqueiosAtivos.some(bloqueio => {
      return horaAgendamentoStr >= bloqueio.horaInicio && horaAgendamentoStr < bloqueio.horaFim;
    });

    if (estaNoBloqueio) {
      return res.status(400).json({ error: 'Este horário está indisponível ou bloqueado para manutenção.' });
    }
    // ==========================================================

    const booking = await prisma.$transaction(async (tx) => {
      const lockKey = `${courtId}-${dataAgendamentoString}-${horaInicio}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`;

      const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000);

      const [anoStr, mesStr, diaStr] = dataAgendamentoString.split('-');
      const [hInicioStr, mInicioStr] = horaAgendamentoStr.split(':');
      const [hFimStr, mFimStr] = horaFim.split('T')[1].substring(0, 5).split(':');

      const dataFormatada = new Date(Date.UTC(Number(anoStr), Number(mesStr) - 1, Number(diaStr), 12, 0, 0));

      const inicioFormatado = new Date(Date.UTC(Number(anoStr), Number(mesStr) - 1, Number(diaStr), Number(hInicioStr) + 3, Number(mInicioStr), 0));
      const fimFormatado = new Date(Date.UTC(Number(anoStr), Number(mesStr) - 1, Number(diaStr), Number(hFimStr) + 3, Number(mFimStr), 0));

      const conflito = await tx.booking.findFirst({
        where: {
          courtId: Number(courtId),
          data: dataFormatada,
          OR: [
            { status: 'pago' },
            { status: 'confirmado' },
            {
              status: 'pendente',
              createdAt: { gte: dezMinutosAtras }
            }
          ],
          AND: [
            {
              OR: [
                {
                  horaInicio: { lte: inicioFormatado },
                  horaFim: { gt: inicioFormatado }
                },
                {
                  horaInicio: { lt: fimFormatado },
                  horaFim: { gte: fimFormatado }
                },
                {
                  horaInicio: { gte: inicioFormatado },
                  horaFim: { lte: fimFormatado }
                }
              ]
            }
          ]
        }
      });

      if (conflito) {
        throw new Error('SLOT_TAKEN');
      }

      return tx.booking.create({
        data: {
          userId, 
          courtId: Number(courtId),
          data: dataFormatada,
          horaInicio: inicioFormatado,
          horaFim: fimFormatado,
          status: 'pendente'
        },
        include: { court: true, user: true }
      });
    });

    return res.status(201).json(booking);
  } catch (err) {
    if (err.message === 'SLOT_TAKEN') {
      return res.status(409).json({ error: 'Horário já reservado' });
    }
    console.error('ERRO AO CRIAR RESERVA:', err);
    return res.status(500).json({ error: 'Erro ao criar reserva' });
  }
}

// 💡 FUNÇÃO ATUALIZADA: Com travas para não permitir agendamentos no passado
// 💡 FUNÇÃO CORRIGIDA: Usa o horário de término do formulário e resolve o bug de escopo
// 💡 FUNÇÃO ATUALIZADA: Alimenta a tabela de agendamentos E o fluxo de caixa (Payment)
async function criarManual(req, res) {
  const { nomeAtleta, data, horarioInicio, horarioFim, courtId, statusPagamento } = req.body;

  const rawAdminId = req.user?.id || req.userId;
  const adminId = isNaN(Number(rawAdminId)) ? rawAdminId : Number(rawAdminId);

  try {
    const dataAgendamentoString = data.split('T')[0];

    // Trava de fuso horário retroativo
    const agoraBR = new Date(new Date().getTime() - (3 * 60 * 60 * 1000));
    const ano = agoraBR.getUTCFullYear();
    const mes = String(agoraBR.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(agoraBR.getUTCDate()).padStart(2, '0');
    const hojeString = `${ano}-${mes}-${dia}`;
    const horaAtualStr = `${String(agoraBR.getUTCHours()).padStart(2, '0')}:${String(agoraBR.getUTCMinutes()).padStart(2, '0')}`;

    if (dataAgendamentoString < hojeString) {
      return res.status(400).json({ error: 'Não é possível agendar em um dia que já passou.' });
    }
    if (dataAgendamentoString === hojeString && horarioInicio <= horaAtualStr) {
      return res.status(400).json({ error: 'Não é possível agendar em um horário que já passou hoje.' });
    }

    const checkFuncionamento = await validarFuncionamento(dataAgendamentoString, horarioInicio);
    if (!checkFuncionamento.liberado) {
      return res.status(400).json({ error: checkFuncionamento.motivo });
    }

    // Executa a transação criando o agendamento e o lançamento financeiro juntos
    const booking = await prisma.$transaction(async (tx) => {
      const lockKey = `${courtId}-${dataAgendamentoString}-${horarioInicio}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`;

      const [anoStr, mesStr, diaStr] = dataAgendamentoString.split('-');
      const dataFormatada = new Date(Date.UTC(Number(anoStr), Number(mesStr) - 1, Number(diaStr), 12, 0, 0));

      const [hInicio, mInicio] = horarioInicio.split(':');
      const [hFim, mFim] = horarioFim.split(':');

      const inicioFormatado = new Date(Date.UTC(Number(anoStr), Number(mesStr) - 1, Number(diaStr), Number(hInicio) + 3, Number(mInicio), 0));
      const fimFormatado = new Date(Date.UTC(Number(anoStr), Number(mesStr) - 1, Number(diaStr), Number(hFim) + 3, Number(mFim), 0));

      const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000);

      const conflito = await tx.booking.findFirst({
        where: {
          courtId: Number(courtId),
          data: dataFormatada,
          OR: [
            { status: 'confirmado' },
            { status: 'pendente' }
          ],
          AND: [
            {
              OR: [
                { horaInicio: { lte: inicioFormatado }, horaFim: { gt: inicioFormatado } },
                { horaInicio: { lt: fimFormatado }, horaFim: { gte: fimFormatado } },
                { horaInicio: { gte: inicioFormatado }, horaFim: { lte: fimFormatado } }
              ]
            }
          ]
        }
      });

      if (conflito) {
        throw new Error('SLOT_TAKEN');
      }

      // 1. Puxa os dados da quadra para calcular o valor dinamicamente baseado nas horas
      const quadra = await tx.court.findUnique({ where: { id: Number(courtId) } });
      const totalHoras = (fimFormatado - inicioFormatado) / (1000 * 60 * 60);
      const valorCalculado = (quadra?.precoPorHora || 0) * totalHoras;

      // 2. Cria o registro do agendamento
      const novoBooking = await tx.booking.create({
        data: {
          userId: null, 
          courtId: Number(courtId),
          data: dataFormatada,
          horaInicio: inicioFormatado,
          horaFim: fimFormatado,
          status: statusPagamento === 'pago' ? 'confirmado' : 'pendente',
          nomeAvulso: nomeAtleta 
        },
        include: { court: true, user: true }
      });

      // 3. 💡 INJETADO: Se foi pago no balcão, cria o lançamento aprovado na tabela de fluxo de caixa (Payment)
      if (statusPagamento === 'pago') {
        await tx.payment.create({
          data: {
            bookingId: novoBooking.id,
            valor: valorCalculado,
            metodo: 'dinheiro_balcao', // Identifica que entrou fisicamente
            status: 'aprovado'         // 🖥️ Status que o seu fluxo de caixa lê!
          }
        });
      }

      return novoBooking;
    });

    return res.status(201).json(booking);
  } catch (err) {
    if (err.message === 'SLOT_TAKEN') {
      return res.status(409).json({ error: 'Este horário já está reservado.' });
    }
    console.error('ERRO AO CRIAR RESERVA MANUAL:', err);
    return res.status(500).json({ error: 'Erro ao criar reserva no balcão.' });
  }
}

// 💡 FUNÇÃO ATUALIZADA: Sincroniza as alterações de valores e status também na tabela de pagamentos
async function atualizarManual(req, res) {
  const { id } = req.params;
  const { nomeAtleta, data, horarioInicio, horarioFim, courtId, statusPagamento } = req.body;

  try {
    const dataAgendamentoString = data.split('T')[0];
    const [anoStr, mesStr, diaStr] = dataAgendamentoString.split('-');
    
    const [hInicio, mInicio] = horarioInicio.split(':');
    const [hFim, mFim] = horarioFim.split(':');

    const dataFormatada = new Date(Date.UTC(Number(anoStr), Number(mesStr) - 1, Number(diaStr), 12, 0, 0));
    const inicioFormatado = new Date(Date.UTC(Number(anoStr), Number(mesStr) - 1, Number(diaStr), Number(hInicio) + 3, Number(mInicio), 0));
    const fimFormatado = new Date(Date.UTC(Number(anoStr), Number(mesStr) - 1, Number(diaStr), Number(hFim) + 3, Number(mFim), 0));

    const novoStatus = statusPagamento === 'pago' ? 'confirmado' : 'pendente';

    // Executa a atualização do agendamento e sincroniza o caixa em lote
    const reservaAtualizada = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id: Number(id) },
        data: {
          courtId: Number(courtId),
          data: dataFormatada,
          horaInicio: inicioFormatado,
          horaFim: fimFormatado,
          status: novoStatus,
          nomeAvulso: nomeAtleta
        },
        include: { court: true }
      });

      const totalHoras = (fimFormatado - inicioFormatado) / (1000 * 60 * 60);
      const valorCalculado = (booking.court?.precoPorHora || 0) * totalHoras;

      if (statusPagamento === 'pago') {
        // 💡 Atualiza ou cria o pagamento como aprovado no fluxo financeiro
        await tx.payment.upsert({
          where: { bookingId: booking.id },
          update: { status: 'aprovado', valor: valorCalculado },
          create: {
            bookingId: booking.id,
            valor: valorCalculado,
            metodo: 'dinheiro_balcao',
            status: 'aprovado'
          }
        });
      } else {
        // Se mudou de pago para pendente, remove ou muda o status do pagamento para não somar no caixa
        await tx.payment.upsert({
          where: { bookingId: booking.id },
          update: { status: 'pendente' },
          create: {
            bookingId: booking.id,
            valor: valorCalculado,
            metodo: 'dinheiro_balcao',
            status: 'pendente'
          }
        });
      }

      return booking;
    });

    return res.json(reservaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar reserva manual:", error);
    return res.status(500).json({ error: "Erro ao atualizar reserva." });
  }
}

async function deletarManual(req, res) {
  const { id } = req.params;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. 💡 Remove primeiro o registro do fluxo de caixa (se existir)
      await tx.payment.deleteMany({
        where: { bookingId: Number(id) }
      });

      // 2. Depois deleta a reserva com segurança
      await tx.booking.delete({
        where: { id: Number(id) }
      });
    });

    return res.json({ message: 'Reserva e fluxo financeiro removidos com sucesso.' });
  } catch (error) {
    console.error("Erro ao deletar reserva manual:", error);
    return res.status(500).json({ error: "Erro ao deletar reserva." });
  }
}

// Listar reservas do usuário logado
async function minhasReservas(req, res) {
  const rawUserId = req.user?.id || req.userId;
  const userId = isNaN(Number(rawUserId)) ? rawUserId : Number(rawUserId);

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: { court: true },
      orderBy: [
        { data: 'desc' },
        { horaInicio: 'desc' }
      ]
    });
    return res.json(bookings);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar reservas' });
  }
}

// Cancelar reserva
async function cancelar(req, res) {
  const { id } = req.params;
  const rawUserId = req.user?.id || req.userId;
  const userId = isNaN(Number(rawUserId)) ? rawUserId : Number(rawUserId);

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Sem permissão para cancelar esta reserva' });
    }

    const updated = await prisma.booking.update({
      where: { id: Number(id) },
      data: { status: 'cancelado' }
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao cancelar reserva' });
  }
}

// Listar horários disponíveis de uma quadra em uma data (Injetada lógica de bloqueios)
async function horariosDisponiveis(req, res) {
  const { courtId, data } = req.query;

  const horariosBase = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', 
    '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00',
  ];

  try {
    const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000);
    
    await prisma.booking.updateMany({
      where: {
        status: 'pendente',
        createdAt: { lt: dezMinutosAtras }
      },
      data: { status: 'cancelado' }
    });

    const dataSelecionadaString = data.split('T')[0];
    const [anoD, mesD, diaD] = dataSelecionadaString.split('-');
    const dataBusca = new Date(Date.UTC(Number(anoD), Number(mesD) - 1, Number(diaD), 12, 0, 0));

    const reservas = await prisma.booking.findMany({
      where: {
        courtId: Number(courtId),
        data: dataBusca,
        OR: [
          { status: 'pago' },
          { status: 'confirmado' },
          {
            status: 'pendente',
            createdAt: { gte: dezMinutosAtras }
          }
        ]
      }
    });

    const agoraUTC = new Date();
    const agoraBrasilia = new Date(agoraUTC.getTime() - (3 * 60 * 60 * 1000));
    
    const ano = agoraBrasilia.getUTCFullYear();
    const mes = String(agoraBrasilia.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(agoraBrasilia.getUTCDate()).padStart(2, '0');
    const hojeString = `${ano}-${mes}-${dia}`;

    const diaSemanaConsulta = new Date(Date.UTC(Number(anoD), Number(mesD) - 1, Number(diaD), 12)).getUTCDay();
    
    const horarioDoDia = await prisma.horarioFuncionamento.findUnique({
      where: { diaSemana: diaSemanaConsulta }
    });

    if (!horarioDoDia || !horarioDoDia.ativo) {
      return res.json({ data, courtId, disponiveis: [], fechado: true });
    }

    let disponiveis = horariosBase.filter(h => h >= horarioDoDia.horaAbertura && h < horarioDoDia.horaFechamento);

    const bloqueios = await prisma.bloqueioQuadra.findMany({
      where: {
        quadraId: Number(courtId),
        data: dataSelecionadaString
      }
    });

    if (bloqueios.length > 0) {
      disponiveis = disponiveis.filter(hora => {
        const estaBloqueado = bloqueios.some(bloqueio => {
          return hora >= bloqueio.horaInicio && hora < bloqueio.horaFim;
        });
        return !estaBloqueado;
      });
    }

    if (dataSelecionadaString === hojeString) {
      const horaAtual = agoraBrasilia.getUTCHours();
      const minutoAtual = agoraBrasilia.getUTCMinutes();

      disponiveis = disponiveis.filter(h => {
        const [hBotao, mBotao] = h.split(':').map(Number);
        if (hBotao > horaAtual) return true;
        if (hBotao === horaAtual && mBotao > minutoAtual) return true;
        return false;
      });
    }

    disponiveis = disponiveis.filter(horario => {
      const [h, m] = horario.split(':').map(Number);
      
      const inicioSugerido = new Date(Date.UTC(Number(anoD), Number(mesD) - 1, Number(diaD), h + 3, m, 0));
      const fimSugerido = new Date(inicioSugerido.getTime() + (30 * 60 * 1000)); 

      const temConflito = reservas.some(r => {
        const rInicio = new Date(r.horaInicio);
        const rFim = new Date(r.horaFim);
        return (inicioSugerido < rFim && fimSugerido > rInicio);
      });

      return !temConflito;
    });

    disponiveis = disponiveis.filter((h) => {
      const [hora, min] = h.split(':').map(Number);
      
      const blocoAnterior = min === 30 ? `${String(hora).padStart(2, '0')}:00` : `${String(hora - 1).padStart(2, '0')}:30`;
      const blocoProximo = min === 30 ? `${String(hora + 1).padStart(2, '0')}:00` : `${String(hora).padStart(2, '0')}:30`;
      
      const temAnterior = disponiveis.includes(blocoAnterior);
      const temProximo = disponiveis.includes(blocoProximo);

      if (!temAnterior && !temProximo) return false; 
      return true;
    });

    return res.json({ data, courtId, disponiveis });
  } catch (err) {
    console.error('ERRO AO BUSCAR HORÁRIOS:', err);
    return res.status(500).json({ error: 'Erro ao buscar horários' });
  }
}

// Admin: listar todas as reservas
async function listarTodas(req, res) {
  try {
    const bookings = await prisma.booking.findMany({
      include: { court: true, user: true },
      orderBy: { data: 'asc' }
    });
    return res.json(bookings);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar reservas' });
  }
}

async function criarBloqueio(req, res) {
  const { quadraId, data, horaInicio, horaFim, motivo } = req.body;
  try {
    const bloqueio = await prisma.bloqueioQuadra.create({
      data: {
        quadraId: Number(quadraId),
        data, 
        horaInicio, 
        horaFim, 
        motivo
      }
    });
    return res.status(201).json(bloqueio);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao criar bloqueio" });
  }
}

// Listar todos os bloqueios criados
async function listarBloqueios(req, res) {
  try {
    const bloqueios = await prisma.bloqueioQuadra.findMany({
      include: { quadra: true },
      orderBy: { data: 'asc' }
    });
    return res.json(bloqueios);
  } catch (err) {
    console.error("Erro ao listar bloqueios:", err);
    return res.status(500).json({ error: "Erro ao listar bloqueios" });
  }
}

// Cancelar/Deletar um bloqueio específico
async function deletarBloqueio(req, res) {
  const { id } = req.params;
  try {
    await prisma.bloqueioQuadra.delete({
      where: { id: Number(id) }
    });
    return res.json({ message: "Bloqueio removido com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar bloqueio:", err);
    return res.status(500).json({ error: "Erro ao remover bloqueio" });
  }
}

async function buscarPorId(req, res) {
  try {
    const { id } = req.params;
    
    const bookingId = Number(id);
    if (isNaN(bookingId)) {
        return res.status(400).json({ error: "ID inválido" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        court: true,
        user: true 
      }
    });

    if (!booking) {
      return res.status(404).json({ error: "Reserva não encontrada" });
    }

    return res.json(booking);
  } catch (error) {
    console.error("Erro em buscarPorId:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}

module.exports = { 
  criar, 
  criarManual,
  minhasReservas, 
  cancelar, 
  horariosDisponiveis, 
  listarTodas, 
  buscarPorId, 
  criarBloqueio, 
  listarBloqueios, 
  deletarBloqueio,
  atualizarManual,
  deletarManual,
};