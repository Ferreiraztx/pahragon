const { MercadoPagoConfig, Preference, Payment } = require('mercadopago')
const { PrismaClient } = require('@prisma/client')

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

    const inicio = new Date(booking.horaInicio)
    const fim = new Date(booking.horaFim)
    const horas = (fim - inicio) / (1000 * 60 * 60)
    const valor = booking.court.precoPorHora * horas

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
        }
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
      checkoutUrl: result.init_point,
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

  if (type === 'payment') {
    try {
      const paymentClient = new Payment(client)
      const payment = await paymentClient.get({ id: data.id })

      const bookingId = Number(payment.external_reference)
      const status = payment.status

      if (status === 'approved') {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'confirmado' }
        })
        await prisma.payment.update({
          where: { bookingId },
          data: { status: 'aprovado', metodo: payment.payment_type_id }
        })
      } else if (status === 'rejected') {
        await prisma.payment.update({
          where: { bookingId },
          data: { status: 'rejeitado' }
        })
      }
    } catch (err) {
      console.error('ERRO WEBHOOK:', err)
    }
  }

  return res.sendStatus(200)
}

async function confirmarPagamento(req, res) {
  const { bookingId, status } = req.body

  try {
    if (status === 'approved') {
      await prisma.booking.update({
        where: { id: Number(bookingId) },
        data: { status: 'confirmado' }
      })
      await prisma.payment.update({
        where: { bookingId: Number(bookingId) },
        data: { status: 'aprovado' }
      })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: { court: true }
    })

    return res.json(booking)
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao confirmar pagamento' })
  }
}

module.exports = { criarPagamento, webhook, confirmarPagamento }