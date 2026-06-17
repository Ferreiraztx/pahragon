const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar reserva
async function criar(req, res) {
  const { courtId, data, horaInicio, horaFim } = req.body;
  const userId = req.userId;

  try {
    // Verifica se já existe reserva nesse horário
    const conflito = await prisma.booking.findFirst({
      where: {
        courtId: Number(courtId),
        data: new Date(data),
        status: { not: 'cancelado' },
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
    });

    if (conflito) {
      return res.status(400).json({ error: 'Horário já reservado' });
    }

    const booking = await prisma.booking.create({
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

    return res.status(201).json(booking);
  } catch (err) {
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
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  try {
    const reservas = await prisma.booking.findMany({
      where: {
        courtId: Number(courtId),
        data: new Date(data),
        status: { not: 'cancelado' }
      }
    });

    const horariosOcupados = reservas.map(r =>
      new Date(r.horaInicio).toTimeString().slice(0, 5)
    );

    const disponiveis = horariosBase.filter(h => !horariosOcupados.includes(h));

    return res.json({ data, courtId, disponiveis });
  } catch (err) {
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

module.exports = { criar, minhasReservas, cancelar, horariosDisponiveis, listarTodas };