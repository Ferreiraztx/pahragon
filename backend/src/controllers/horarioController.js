const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listar(req, res) {
  try {
    const horarios = await prisma.horarioFuncionamento.findMany({
      orderBy: { diaSemana: 'asc' }
    });
    return res.json(horarios);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar horários de funcionamento' });
  }
}

async function atualizar(req, res) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito ao administrador.' });
  }

  const { diaSemana, ativo, horaAbertura, horaFechamento } = req.body;

  try {
    const atualizado = await prisma.horarioFuncionamento.update({
      where: { diaSemana: Number(diaSemana) },
      data: { ativo, horaAbertura, horaFechamento }
    });
    return res.json(atualizado);
  } catch (err) {
    console.error('Erro ao atualizar horário:', err);
    return res.status(500).json({ error: 'Erro ao atualizar horário de funcionamento' });
  }
}

module.exports = { listar, atualizar };