const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar reserva
async function criar(req, res) {
  const { courtId, data, horaInicio, horaFim } = req.body;
  const userId = req.userId;

  try {
    // ==========================================================
    // TRAVA DE SEGURANÇA: EVITAR QUE CLIQUEM EM HORÁRIOS PASSADOS
    // ==========================================================
    const agoraUTC = new Date();
    const agoraLocal = new Date(agoraUTC.getTime() - (3 * 60 * 60 * 1000)); // Fuso Brasília (UTC-3)
    const inicioReserva = new Date(horaInicio);

    if (inicioReserva <= agoraLocal) {
      return res.status(400).json({ error: 'Não é possível agendar em um horário que já passou.' });
    }
    // ==========================================================

    const booking = await prisma.$transaction(async (tx) => {
      const lockKey = `${courtId}-${data}-${horaInicio}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`;

      // IMPORTANTE: Aqui também atualizamos para considerar o tempo limite se clicarem no mesmo milissegundo
      const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000);

      const conflito = await tx.booking.findFirst({
        where: {
          courtId: Number(courtId),
          data: new Date(data),
          OR: [
            { status: 'pago' },
            { status: 'confirmado' },
            {
              status: 'pendente',
              createdAt: { gte: dezMinutosAtras } // Bloqueia apenas se tiver menos de 10 min de vida
            }
          ],
          AND: [
            {
              OR: [
                {
                  horaInicio: { lte: new Date(horaInicio) },
                  horaFim: { gt: new Date(horaInicio) }
                },
                {
                  horaInicio: { lt: new Date(horaFim) },
                  horaFim: { gte: new Date(horaFim) }
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
          data: new Date(data),
          horaInicio: new Date(horaInicio),
          horaFim: new Date(horaFim),
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

// Listar horários disponíveis de uma quadra em uma data (Versão 30 min com Expiração)
async function horariosDisponiveis(req, res) {
  const { courtId, data } = req.query;

  const horariosBase = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  try {
    // ----------------------------------------------------------------===
    // AJUSTE 1: Limpeza automática de Pix/Reservas abandonadas no Banco
    // ----------------------------------------------------------------===
    const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000);
    
    await prisma.booking.updateMany({
      where: {
        status: 'pendente',
        createdAt: { lt: dezMinutosAtras }
      },
      data: { status: 'cancelado' }
    });

    // ----------------------------------------------------------------===
    // AJUSTE 2: Filtrar apenas agendamentos realmente válidos ou dentro do prazo
    // ----------------------------------------------------------------===
    const reservas = await prisma.booking.findMany({
      where: {
        courtId: Number(courtId),
        data: new Date(data),
        OR: [
          { status: 'pago' },
          { status: 'confirmado' },
          {
            status: 'pendente',
            createdAt: { gte: dezMinutosAtras } // Se tiver menos de 10 minutos, ainda segura a vaga
          }
        ]
      }
    });

    // Filtro para não mostrar horários que já passaram (caso seja o dia de hoje)
    const agoraLocal = new Date();
    const ano = agoraLocal.getFullYear();
    const mes = String(agoraLocal.getMonth() + 1).padStart(2, '0');
    const dia = String(agoraLocal.getDate()).padStart(2, '0');
    const hojeString = `${ano}-${mes}-${dia}`;
    const dataSelecionadaString = data.split('T')[0];

    let disponiveis = [...horariosBase];

    if (dataSelecionadaString === hojeString) {
      const horaAtual = agoraLocal.getHours();
      const minutoAtual = agoraLocal.getMinutes();

      disponiveis = disponiveis.filter(h => {
        const [hBotao, mBotao] = h.split(':').map(Number);
        if (hBotao > horaAtual) return true;
        if (hBotao === horaAtual && mBotao > minutoAtual) return true;
        return false;
      });
    }

    // Filtra os blocos que batem de frente com agendamentos existentes
    // ==========================================
    // CORREÇÃO DE TIMEZONE: Mantendo a mesma leitura do banco de dados
    // ==========================================
    disponiveis = disponiveis.filter(horario => {
      const [h, m] = horario.split(':').map(Number);
      
      // REMOVIDO O "Z" DO FINAL: Tratando a string de teste exatamente igual à string que foi gravada pelo front
      const inicioSugerido = new Date(`${dataSelecionadaString}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
      const fimSugerido = new Date(inicioSugerido.getTime() + (30 * 60 * 1000)); 

      const temConflito = reservas.some(r => {
        const rInicio = new Date(r.horaInicio);
        const rFim = new Date(r.horaFim);
        return (inicioSugerido < rFim && fimSugerido > rInicio);
      });

      return !temConflito;
    });

    // Remove meias horas isoladas
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
    
    // Convertemos para Number, mas tratamos caso venha algo inválido
    const bookingId = Number(id);
    if (isNaN(bookingId)) {
        return res.status(400).json({ error: "ID inválido" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        court: true,
        user: true // Adicionei o user caso o frontend precise
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