const express = require('express');
const router = express.Router();
const { register, login, registerAdmin, loginAdmin, loginGoogle, atualizarPerfil, obterPerfil, listarAtletas } = require('../controllers/authController');
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
router.post('/logout', authController.logout);

module.exports = router;