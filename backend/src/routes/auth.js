const express = require('express');
const router = express.Router();
const { register, login, registerAdmin, loginAdmin } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

module.exports = router;