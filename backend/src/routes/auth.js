const express = require('express');
const router = express.Router();
// 💡 Adicionado o 'logout' aqui na desestruturação:
const { register, login, registerAdmin, loginAdmin, loginGoogle, atualizarPerfil, obterPerfil, listarAtletas, logout } = require('../controllers/authController');
const requireAuth = require('../middlewares/auth');
const { listar } = require('../controllers/courtController');

router.post('/register', register);
router.post('/login', login);
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);
router.post('/google', loginGoogle);
router.put('/perfil', requireAuth, atualizarPerfil);
router.get('/perfil', requireAuth, obterPerfil);
router.get('/usuarios', requireAuth, listarAtletas);
router.post('/logout', logout);

module.exports = router;