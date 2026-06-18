const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const MINUTOS_EXPIRACAO = 10;

async function cancelarReservasExpiradas() {
  const limite = new Date(Date.now() - MINUTOS_EXPIRACAO * 60 * 1000);

  try {
    const resultado = await prisma.booking.updateMany({
      where: {
        status: 'pendente',
        createdAt: { lt: limite }
      },
      data: { status: 'cancelado' }
    });

    if (resultado.count > 0) {
      console.log(`🧹 ${resultado.count} reserva(s) pendente(s) expirada(s) cancelada(s) automaticamente.`);
    }
  } catch (err) {
    console.error('Erro ao cancelar reservas expiradas:', err);
  }
}

function iniciarJobCancelamento() {
  // Roda a cada 1 minuto
  cron.schedule('* * * * *', cancelarReservasExpiradas);
  console.log('⏰ Job de cancelamento automático de reservas iniciado.');
}

module.exports = { iniciarJobCancelamento, cancelarReservasExpiradas };