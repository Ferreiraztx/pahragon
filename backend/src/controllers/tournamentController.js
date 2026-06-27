const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listar(req, res) {
  try {
    const tournaments = await prisma.tournament.findMany({ orderBy: { data: 'asc' } })
    return res.json(tournaments)
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar torneios' })
  }
}

async function criar(req, res) {
  const { nome, descricao, data, vagas, preco, whatsapp } = req.body 

  // 💡 VALIDAÇÃO: Impede a criação se o whatsapp estiver em branco
  if (!whatsapp || whatsapp.trim() === "") {
    return res.status(400).json({ error: 'O número de WhatsApp é obrigatório para criar um torneio.' })
  }

  try {
    const tournament = await prisma.tournament.create({
      data: { 
        nome, 
        descricao, 
        data: new Date(data), 
        vagas: Number(vagas), 
        preco: Number(preco),
        whatsapp: whatsapp
      }
    })
    return res.status(201).json(tournament)
  } catch (err) {
    console.error("Erro ao criar torneio:", err.message)
    return res.status(500).json({ error: 'Erro ao criar torneio' })
  }
}

async function deletar(req, res) {
  const { id } = req.params
  try {
    await prisma.tournament.delete({ where: { id: Number(id) } })
    return res.json({ message: 'Torneio deletado' })
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao deletar torneio' })
  }
}

async function fluxoCaixa(req, res) {
  try {
    const payments = await prisma.payment.findMany({
      where: { status: 'aprovado' },
      include: { booking: { include: { court: true, user: true } } },
      orderBy: { id: 'desc' }
    })

    const total = payments.reduce((acc, p) => acc + p.valor, 0)
    const hoje = new Date()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const totalMes = payments
      .filter(p => new Date(p.booking.createdAt) >= inicioMes)
      .reduce((acc, p) => acc + p.valor, 0)

    return res.json({ payments, total, totalMes })
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar fluxo de caixa' })
  }
}

module.exports = { listar, criar, deletar, fluxoCaixa }