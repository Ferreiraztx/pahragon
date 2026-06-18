const app = require('./src/app');
const { iniciarJobCancelamento } = require('./src/jobs/cancelamentoJob');

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  iniciarJobCancelamento();
});