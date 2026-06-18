-- CreateTable
CREATE TABLE "Tournament" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "vagas" INTEGER NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);
