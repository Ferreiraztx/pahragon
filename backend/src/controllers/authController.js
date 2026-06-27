const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const prisma = new PrismaClient();

// 💡 FUNÇÃO AUXILIAR: Centraliza a configuração de segurança do cookie
function enviarCookieToken(res, token) {
  res.cookie('token', token, {
    httpOnly: true, // 🔒 Impede o JavaScript (front-end) de ler o token. Proteção máxima contra XSS!
    secure: true,   // 🌐 Força o uso em HTTPS (essencial para Railway/Vercel)
    sameSite: 'None', // 🔄 Permite cross-origin se o seu front estiver na Vercel e o back no Railway
    maxAge: 7 * 24 * 60 * 60 * 1000, // Tempo de vida: 7 dias
  });
}

async function loginGoogle(req, res) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token do Google é obrigatório.' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      const senhaInutilizada = await bcrypt.hash(Math.random().toString(36).substring(2), 8);

      user = await prisma.user.create({
        data: {
          email,
          nome: name,
          senha: senhaInutilizada,
          telefone: "" 
        }
      });
    }

    const tokenSistema = jwt.sign(
      { id: user.id, role: 'user' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // 🍪 Envia o token trancado via Cookie seguro
    enviarCookieToken(res, tokenSistema);

    // O JSON agora só envia os dados do usuário; o token vai oculto pelos cabeçalhos do navegador
    return res.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: 'user'
      }
    });

  } catch (err) {
    console.error('ERRO LOGIN GOOGLE BACKEND:', err.message);
    return res.status(400).json({ error: 'Falha na autenticação com o Google. Token inválido.' });
  }
}

// Cadastro de usuário
async function register(req, res) {
  const { nome, email, senha, telefone } = req.body;

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 8);

    const user = await prisma.user.create({
      data: { nome, email, senha: senhaHash, telefone }
    });

    const token = jwt.sign(
      { id: user.id, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    enviarCookieToken(res, token);

    return res.status(201).json({ user: { id: user.id, nome, email, role: 'user' } });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
}

// Login de usuário
async function login(req, res) {
  const { email, senha } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos' });
    }

    const senhaCorreta = await bcrypt.compare(senha, user.senha);
    if (!senhaCorreta) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos' });
    }

    const token = jwt.sign(
      { id: user.id, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    enviarCookieToken(res, token);

    return res.json({ user: { id: user.id, nome: user.nome, email, role: 'user' } });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
}

// Cadastro de admin
async function registerAdmin(req, res) {
  const { nome, email, senha } = req.body;

  try {
    const adminExists = await prisma.admin.findUnique({ where: { email } });
    if (adminExists) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 8);

    const admin = await prisma.admin.create({
      data: { nome, email, senha: senhaHash }
    });

    const token = jwt.sign(
      { id: admin.id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    enviarCookieToken(res, token);

    return res.status(201).json({ admin: { id: admin.id, nome, email, role: 'admin' } });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao cadastrar admin' });
  }
}

// Login de admin
async function loginAdmin(req, res) {
  const { email, senha } = req.body;

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos' });
    }

    const senhaCorreta = await bcrypt.compare(senha, admin.senha);
    if (!senhaCorreta) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos' });
    }

    const token = jwt.sign(
      { id: admin.id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    enviarCookieToken(res, token);

    return res.json({ admin: { id: admin.id, nome: admin.nome, email, role: 'admin' } });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
}

// Rota de Logout: Limpa o cookie trancado do navegador
async function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  });
  return res.json({ message: 'Sessão encerrada com sucesso.' });
}

const atualizarPerfil = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const dadosAtualizados = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado corretamente.' });
    }

    const cpfLimpo = dadosAtualizados.cpf ? dadosAtualizados.cpf.replace(/\D/g, '') : null;
    const cepLimpo = dadosAtualizados.cep ? dadosAtualizados.cep.replace(/\D/g, '') : null;
    const celularLimpo = dadosAtualizados.celular ? dadosAtualizados.celular.replace(/\D/g, '') : null;

    const idFormatado = isNaN(Number(userId)) ? userId : Number(userId);

    const dataNascimentoFormatada = dadosAtualizados.dataNascimento 
      ? new Date(dadosAtualizados.dataNascimento) 
      : null;

    const dadosParaSalvar = {
      nome: dadosAtualizados.nome,
      cpf: cpfLimpo,
      telefone: celularLimpo,
      cep: cepLimpo,
      rua: dadosAtualizados.rua,
      numero: dadosAtualizados.numero,
      complemento: dadosAtualizados.complemento,
      bairro: dadosAtualizados.bairro,
      cidade: dadosAtualizados.cidade,
      estado: dadosAtualizados.estado,
    };

    if (dataNascimentoFormatada && !isNaN(dataNascimentoFormatada.getTime())) {
      dadosParaSalvar.dataNascimento = dataNascimentoFormatada;
    }

    const usuarioAtualizado = await prisma.user.update({
      where: { id: idFormatado }, 
      data: dadosParaSalvar,
    });

    if (usuarioAtualizado.senha) {
      delete usuarioAtualizado.senha;
    }

    return res.json({ message: 'Perfil updated!', user: usuarioAtualizado });

  } catch (error) {
    console.error("ERRO CRÍTICO NO BANCO (PRISMA):", error.message || error);
    return res.status(500).json({ error: 'Erro interno ao atualizar os dados.' });
  }
};

const obterPerfil = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const role = req.userRole || req.user?.role;

    if (!userId || !role) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    let usuario = null;

    if (role === 'admin') {
      usuario = await prisma.admin.findUnique({ where: { id: Number(userId) } });
    } else {
      usuario = await prisma.user.findUnique({ where: { id: Number(userId) } });
    }

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (usuario.senha) delete usuario.senha;

    return res.json({ ...usuario, role });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return res.status(500).json({ error: 'Erro interno ao buscar perfil.' });
  }
};

const listarAtletas = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito ao administrador.' });
    }

    const atletas = await prisma.user.findMany({
      orderBy: { id: 'desc' },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        cpf: true,
        cidade: true,
        estado: true,
        dataNascimento: true,
      }
    });

    return res.json(atletas);
  } catch (error) {
    console.error('Erro ao listar atletas:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar atletas.' });
  }
};

module.exports = { 
  register, 
  login, 
  registerAdmin, 
  loginAdmin, 
  loginGoogle, 
  atualizarPerfil, 
  obterPerfil, 
  listarAtletas,
  logout // 💡 Adicionada rota de logout para limpar cookies
};