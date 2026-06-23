const express = require('express');
const router = express.Router();
const { register, login, registerAdmin, loginAdmin, loginGoogle, atualizarPerfil, obterPerfil } = require('../controllers/authController');
const requireAuth = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);
router.post('/google', loginGoogle);
router.put('/perfil', requireAuth, atualizarPerfil);
router.get('/perfil', requireAuth, obterPerfil);

module.exports = router;