const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.cookies.token;

  console.log('AUTH HEADER:', authHeader);

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  console.log('TOKEN:', token);

try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('DECODED:', decoded);
    
    // Unifica para garantir que o ID sempre chegue no controller, não importa se foi gerado como 'id' ou 'userId'
    req.userId = decoded.userId || decoded.id; 
    req.user = decoded;
    req.userRole = decoded.role;
    next();
} catch (err) {
    console.log('ERRO JWT:', err.message);
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = authMiddleware;