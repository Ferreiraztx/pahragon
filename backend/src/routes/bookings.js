const express = require('express');
const router = express.Router();
const { criar, minhasReservas, cancelar, horariosDisponiveis, listarTodas, buscarPorId } = require('../controllers/bookingController');
const auth = require('../middlewares/auth');

router.get('/disponiveis', horariosDisponiveis);
router.get('/minhas', auth, minhasReservas);
router.get('/todas', auth, listarTodas);
router.post('/', auth, criar);
router.patch('/:id/cancelar', auth, cancelar);
router.get('/detalhes/:id', auth, buscarPorId);
router.post('/bloqueios', authMiddleware, adminMiddleware, bookingController.criarBloqueio);

module.exports = router;