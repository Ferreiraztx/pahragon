const express = require('express');
const router = express.Router();
// 💡 ADICIONADO: 'criarManual' na lista de importações abaixo
const { 
  criar, 
  minhasReservas, 
  cancelar, 
  horariosDisponiveis, 
  listarTodas, 
  buscarPorId, 
  criarBloqueio, 
  listarBloqueios, 
  deletarBloqueio,
  criarManual 
} = require('../controllers/bookingController');
const auth = require('../middlewares/auth');

router.get('/disponiveis', horariosDisponiveis);
router.get('/minhas', auth, minhasReservas);
router.get('/todas', auth, listarTodas);
router.post('/', auth, criar);
router.patch('/:id/cancelar', auth, cancelar);
router.get('/detalhes/:id', auth, buscarPorId);
router.post('/bloqueios', auth, criarBloqueio);
router.get('/bloqueios', auth, listarBloqueios);
router.delete('/bloqueios/:id', auth, deletarBloqueio);

router.post('/manual', auth, criarManual);

module.exports = router;