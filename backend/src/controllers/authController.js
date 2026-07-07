const { randomUUID } = require("crypto");

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');
const { PrismaClient } = require('@prisma/client');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const prisma = new PrismaClient();

const resend = new Resend(process.env.RESEND_PASS);

// 💡 FUNÇÃO AUXILIAR: Centraliza a configuração de segurança do cookie
function enviarCookieToken(res, token) {
  res.cookie('token', token, {
    httpOnly: true, // 🔒 Impede o JavaScript (front-end) de ler o token. Proteção máxima contra XSS!
    secure: true,   // 🌐 Força o uso em HTTPS (essencial para Railway/Vercel)
    sameSite: 'none', // 🔄 Permite cross-origin se o seu front estiver na Vercel e o back no Railway
    maxAge: 7 * 24 * 60 * 60 * 1000, // Tempo de vida: 7 dias
  });
}

// 🔒 RECUPERAÇÃO: Esqueci minha senha
async function forgotPassword(req, res) {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(200).json({ 
        message: "Se o e-mail existir em nossa base, um link de recuperação será enviado em instantes." 
      });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await prisma.user.update({
      where: { email },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // 🚀 AQUI ESTAVA O ERRO! Substitua pelo envio oficial via HTTP do Resend:
    await resend.emails.send({
      from: "Pahragon Beach Tennis <onboarding@resend.dev>",
      to: email, // Lembre-se: no modo de teste do Resend, envie para o SEU e-mail de cadastro neles.
      subject: "Recuperação de Senha — Pahragon",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e2221; background-color: #faf9f6;">
          <h1 style="font-size: 24px; font-weight: 900; tracking-tight: -0.04em;">Pahragon <span style="font-size: 10px; color: #0d9488;">BEACH TENNIS</span></h1>
          <p style="font-size: 16px; margin-top: 20px;">Olá,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">Você solicitou a recuperação de senha da sua conta. Para definir uma nova senha de acesso, clique no botão abaixo:</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${resetUrl}" style="background-color: #1e2221; color: #ffffff; text-decoration: none; padding: 14px 24px; font-weight: bold; border-radius: 12px; display: inline-block;">Redefinir Minha Senha</a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">Se você não solicitou este e-mail, pode desconsiderá-lo com segurança. O link é válido por 1 hora.</p>
        </div>
      `,
    });

    return res.status(200).json({ 
      message: "Se o e-mail existir em nossa base, um link de recuperação será enviado em instantes." 
    });

  } catch (err) {
    console.error("Erro no forgot-password:", err);
    return res.status(500).json({ error: "Erro interno ao processar a recuperação de senha." });
  }
}

// 🔒 RECUPERAÇÃO: Definir nova senha
async function resetPassword(req, res) {
  const { token, senha } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ message: "O link de recuperação expirou ou é inválido." });
    }

    const senhaHash = await bcrypt.hash(senha, 8);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        senha: senhaHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      }
    });

    return res.status(200).json({ message: "Senha atualizada com sucesso!" });

  } catch (err) {
    console.error("Erro no reset-password:", err);
    return res.status(500).json({ error: "Erro interno ao redefinir a senha." });
  }
}

async function loginGoogle(req, res) {
  const { token } = req.body;

  if (!usuario.isActive) {
  return res.status(401).json({ error: "Esta conta foi excluída." });
}

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

    enviarCookieToken(res, tokenSistema);

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

  if (!usuario.isActive) {
  return res.status(401).json({ error: "Esta conta foi excluída." });
}

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

async function deleteAccount(req, res) {
  const userId = req.user.id; // ID do usuário vindo do token JWT

  try {
    // 1. Verifica se o usuário existe
    const usuario = await prisma.user.findUnique({ where: { id: userId } });
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // 2. Anonimiza os dados (substitui por dados genéricos irreconhecíveis)
    // Usamos um UUID no e-mail e CPF para evitar conflitos de registros únicos no Prisma
    await prisma.user.update({
      where: { id: userId },
      data: {
        nome: "Usuário Excluído",
        email: `deleted-${randomUUID()}@pahragon.com`,
        telefone: "00000000000",
        cpf: `deleted-${randomUUID()}`,
        password: null, // Remove a senha por completo
        isActive: false // Marca a conta como inativa
      }
    });

    // 3. (Opcional) Cancela reservas futuras que este usuário tinha pendentes/confirmadas
    const hojeStr = new Date().toISOString().split("T")[0];
    await prisma.booking.updateMany({
      where: {
        userId: userId,
        data: { gte: hojeStr }, // Apenas datas maiores ou iguais a hoje
        status: { in: ["confirmado", "pendente"] }
      },
      data: {
        status: "cancelado"
      }
    });

    return res.json({ message: "Conta excluída e dados pessoais removidos com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    return res.status(500).json({ error: "Erro interno ao processar a exclusão." });
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

// Rota de Logout
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
  logout,
  forgotPassword,
  resetPassword,
  deleteAccount  
};