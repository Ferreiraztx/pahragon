const express = require('express');
const router = express.Router();
const { register, login, registerAdmin, loginAdmin } = require('../controllers/authController');
const { loginGoogle } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);
router.post('/auth/google', loginGoogle);

module.exports = router;