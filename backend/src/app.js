const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const courtRoutes = require('./routes/courts');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const tournamentRoutes = require('./routes/tournaments');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/courts', courtRoutes);
app.use('/bookings', bookingRoutes);
app.use('/payments', paymentRoutes);
app.use('/tournaments', tournamentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Pahragon Beach Tennis API 🎾' });
});

module.exports = app;