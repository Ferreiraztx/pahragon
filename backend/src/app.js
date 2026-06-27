const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const courtRoutes = require('./routes/courts');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const tournamentRoutes = require('./routes/tournaments');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173'
].map(url => url ? url.replace(/\/$/, '') : url) // Remove qualquer barra "/" que tenha ficado no final da string por engano
 .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Deixa explícito os métodos aceitos
  allowedHeaders: ['Content-Type', 'Authorization'], // Garante que os headers enviados pelo axios passem
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204 // Responde com sucesso imediatamente para o teste OPTIONS do navegador
}));

app.options(/(.*)/, cors());

app.use(express.json());
app.use(cookieParser())

app.use('/auth', authRoutes);
app.use('/courts', courtRoutes);
app.use('/bookings', bookingRoutes);
app.use('/payments', paymentRoutes);
app.use('/tournaments', tournamentRoutes);
app.use('/horarios', require('./routes/horarios'));

app.get('/', (req, res) => {
  res.json({ message: 'Pahragon Beach Tennis API 🎾' });
});

module.exports = app;