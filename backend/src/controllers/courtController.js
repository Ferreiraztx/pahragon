const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar todas as quadras
async function listar(req, res) {
  try {
    const courts = await prisma.court.findMany();
    return res.json(courts);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar quadras' });
  }
}

// Criar quadra (admin)
async function criar(req, res) {
  const { nome, descricao, precoPorHora } = req.body;

  try {
    const court = await prisma.court.create({
      data: { nome, descricao, precoPorHora }
    });
    return res.status(201).json(court);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao criar quadra' });
  }
}

// Editar quadra (admin)
async function editar(req, res) {
  const { id } = req.params;
  const { nome, descricao, precoPorHora } = req.body;

  try {
    const court = await prisma.court.update({
      where: { id: Number(id) },
      data: { nome, descricao, precoPorHora }
    });
    return res.json(court);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao editar quadra' });
  }
}

// Deletar quadra (admin)
async function deletar(req, res) {
  const { id } = req.params;

  try {
    await prisma.court.delete({ where: { id: Number(id) } });
    return res.json({ message: 'Quadra deletada com sucesso' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao deletar quadra' });
  }
}

module.exports = { listar, criar, editar, deletar };