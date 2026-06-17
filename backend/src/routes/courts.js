const express = require('express');
const router = express.Router();
const { listar, criar, editar, deletar } = require('../controllers/courtController');
const auth = require('../middlewares/auth');

router.get('/', listar);
router.post('/', auth, criar);
router.put('/:id', auth, editar);
router.delete('/:id', auth, deletar);

module.exports = router;