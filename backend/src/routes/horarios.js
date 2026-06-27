const express = require('express');
const router = express.Router();
const { listar, atualizar } = require('../controllers/horarioController');
const requireAuth = require('../middlewares/auth');

router.get('/', listar); // público — usado pela página de agendar também
router.put('/', requireAuth, atualizar); // só admin (checado dentro do controller)

module.exports = router;