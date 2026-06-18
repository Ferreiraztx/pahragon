const express = require('express')
const router = express.Router()
const { listar, criar, deletar, fluxoCaixa } = require('../controllers/tournamentController')
const auth = require('../middlewares/auth')

router.get('/', listar)
router.post('/', auth, criar)
router.delete('/:id', auth, deletar)
router.get('/caixa', auth, fluxoCaixa)

module.exports = router