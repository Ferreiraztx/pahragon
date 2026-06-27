const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  for (let dia = 0; dia <= 6; dia++) {
    await prisma.horarioFuncionamento.upsert({
      where: { diaSemana: dia },
      update: {},
      create: { diaSemana: dia }
    });
  }
  console.log('Horários padrão criados.');
}
seed().finally(() => prisma.$disconnect());