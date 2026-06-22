const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar reserva (Versão Corrigida com Validação Local e Date.UTC)
async function criar(req, res) {
  const { courtId, data, horaInicio, horaFim } = req.body;
  const userId = req.userId;

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

    const booking = await prisma.$transaction(async (tx) => {
      const lockKey = `${courtId}-${dataAgendamentoString}-${horaInicio}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`;

      const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000);

      // Desestruturando os pedaços da data e hora para forçar o UTC puro
      // Dentro da transaction na função criar():
      const [anoStr, mesStr, diaStr] = dataAgendamentoString.split('-');
      const [hInicioStr, mInicioStr] = horaAgendamentoStr.split(':');
      const [hFimStr, mFimStr] = horaFim.split('T')[1].substring(0, 5).split(':');

// Altere esta linha dentro da transaction na função criar():
const dataFormatada = new Date(Date.UTC(Number(anoStr), Number(mesStr) - 1, Number(diaStr), 12, 0, 0));

      // ATENÇÃO AQUI: Adicionamos +3 horas na conversão para o banco armazenar o UTC equivalente ao horário de Brasília escolhido
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

// Listar reservas do usuário logado
async function minhasReservas(req, res) {
  const userId = req.userId;

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: { court: true },
      orderBy: { data: 'asc' }
    });
    return res.json(bookings);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar reservas' });
  }
}

// Cancelar reserva
async function cancelar(req, res) {
  const { id } = req.params;
  const userId = req.userId;

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

// Listar horários disponíveis de uma quadra em uma data
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

    // Ajuste para ler a data sem deslocamento de timezone na busca
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

    let disponiveis = [...horariosBase];

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
      
      const inicioSugerido = new Date(Date.UTC(Number(anoD), Number(mesD) - 1, Number(diaD), h, m, 0));
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

module.exports = { criar, minhasReservas, cancelar, horariosDisponiveis, listarTodas, buscarPorId };