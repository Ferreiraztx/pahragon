const { MercadoPagoConfig, Preference, Payment } = require('mercadopago')
const { PrismaClient } = require('@prisma/client')
const { enviarConfirmacaoReserva } = require('../services/emailService')

const prisma = new PrismaClient()

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
})

async function criarPagamento(req, res) {
  const { bookingId } = req.body
  const userId = req.userId

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: { court: true, user: true }
    })

    if (!booking) {
      return res.status(404).json({ error: 'Reserva não encontrada' })
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Sem permissão' })
    }

    // ==========================================================
    // TRAVA ANTI-DUPLO PAGAMENTO: Bloqueia se já estiver confirmado
    // ==========================================================
    if (booking.status === 'confirmado' || booking.status === 'pago') {
      return res.status(400).json({ 
        error: 'Esta reserva já foi paga e confirmada. Não é possível pagar novamente.' 
      })
    }

    // ==========================================================
    // VALIDAÇÃO COM FUSO HORÁRIO (UTC-3)
    // ==========================================================
    const agoraUTC = new Date()
    const agoraLocal = new Date(agoraUTC.getTime() - (3 * 60 * 60 * 1000))
    const horarioInicioReserva = new Date(booking.horaInicio)

    if (horarioInicioReserva <= agoraLocal) {
      return res.status(400).json({ 
        error: 'Não é possível realizar o pagamento de uma reserva que já passou ou está acontecendo agora.' 
      })
    }

    const inicio = new Date(booking.horaInicio)
    const fim = new Date(booking.horaFim)
    const horas = (fim - inicio) / (1000 * 60 * 60)
    const valor = booking.court.precoPorHora * horas

    // Configuração de expiração de 10 minutos
    const dataExpiracao = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const preference = new Preference(client)

    const result = await preference.create({
      body: {
        items: [
          {
            id: String(booking.id),
            title: `Reserva - ${booking.court.nome}`,
            description: `${new Date(booking.data).toLocaleDateString('pt-BR')}`,
            quantity: 1,
            unit_price: valor,
            currency_id: 'BRL'
          }
        ],
        payer: {
          name: booking.user.nome,
          email: booking.user.email
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL}/pagamento/sucesso?bookingId=${booking.id}`,
          failure: `${process.env.FRONTEND_URL}/pagamento/falha?bookingId=${booking.id}`,
          pending: `${process.env.FRONTEND_URL}/pagamento/pendente?bookingId=${booking.id}`
        },
        external_reference: String(booking.id),
        payment_methods: {
          installments: 1
        },
        expires: true,
        expiration_date_to: dataExpiracao
      }
    })

    await prisma.payment.upsert({
      where: { bookingId: booking.id },
      update: { gatewayId: result.id, valor, status: 'pendente' },
      create: {
        bookingId: booking.id,
        valor,
        metodo: 'mercadopago',
        status: 'pendente',
        gatewayId: result.id
      }
    })

    return res.json({
      initPoint: result.init_point,
      sandboxUrl: result.sandbox_init_point,
      preferenceId: result.id
    })
  } catch (err) {
    console.error('ERRO PAGAMENTO:', err)
    return res.status(500).json({ error: 'Erro ao criar pagamento' })
  }
}

async function webhook(req, res) {
  const { type, data } = req.body

  // Garante o retorno 200 rápido pro Mercado Pago não travar a sua fila
  res.sendStatus(200);

  // Captura robusta do ID do pagamento enviado pelo Mercado Pago
  const paymentId = data?.id || (req.body.resource && req.body.resource.split('/').pop());

  if (type === 'payment' && paymentId) {
    try {
      const paymentClient = new Payment(client)
      const payment = await paymentClient.get({ id: String(paymentId) })

      const bookingId = Number(payment.external_reference)
      const status = payment.status

      if (status === 'approved') {
        const bookingAtualizado = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'confirmado' },
          include: { court: true, user: true }
        })

        await prisma.payment.update({
          where: { bookingId },
          data: { status: 'aprovado', metodo: payment.payment_type_id }
        })

        try {
          await enviarConfirmacaoReserva(bookingAtualizado)
        } catch (emailErr) {
          console.error('Erro ao enviar e-mail via webhook:', emailErr.message)
        }
      } else if (status === 'rejected') {
        await prisma.payment.update({
          where: { bookingId },
          data: { status: 'rejeitado' }
        })
      }
    } catch (err) {
      console.error('ERRO INTERNO PROCESSAMENTO WEBHOOK:', err)
    }
  }
}

async function confirmarPagamento(req, res) {
  const { bookingId, status } = req.body

  try {
    if (status === 'approved') {
      const bookingAtualizado = await prisma.booking.update({
        where: { id: Number(bookingId) },
        data: { status: 'confirmado' },
        include: { court: true, user: true }
      })
      
      await prisma.payment.update({
        where: { bookingId: Number(bookingId) },
        data: { status: 'aprovado' }
      })

      try {
        await enviarConfirmacaoReserva(bookingAtualizado)
      } catch (emailErr) {
        console.error('Erro ao enviar e-mail via confirmação direta:', emailErr.message)
      }

      return res.json(bookingAtualizado)
    }

    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: { court: true, user: true }
    })

    return res.json(booking)
  } catch (err) {
    console.error('Erro ao confirmar pagamento:', err)
    return res.status(500).json({ error: 'Erro ao confirmar pagamento' })
  }
}

module.exports = { criarPagamento, webhook, confirmarPagamento }