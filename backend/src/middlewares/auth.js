const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // 🍪 Captura o token direto dos cookies da requisição
  // (Nota: O cookie-parser precisa estar ativo no seu app.js para ler req.cookies)
  let token = req.cookies ? req.cookies.token : null;

  // 🔄 Fallback de segurança: Se não achar nos cookies, tenta ler do cabeçalho Authorization tradicional
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;
    }
  }

  // Se mesmo tentando ler o cookie e o header ele não existir, barra o usuário
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido ou sessão expirada' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Injeta com segurança os dados decodificados para os controllers usarem
    req.userId = decoded.userId || decoded.id; 
    req.user = decoded;
    req.userRole = decoded.role;
    
    next();
  } catch (err) {
    console.log('ERRO JWT MIDDLEWARE:', err.message);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = authMiddleware;