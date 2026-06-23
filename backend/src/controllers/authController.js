const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const prisma = new PrismaClient();

async function loginGoogle(req, res) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token do Google é obrigatório.' });
  }

  try {
    // 1. Valida de forma robusta o token enviado pelo frontend junto ao Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name } = payload;

    // 2. Busca o usuário pelo e-mail ou cria um novo caso não exista (Upsert)
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          nome: name,
          password: "", // Como o login é via Google, deixamos a senha local vazia
        }
      });
    }

    // 3. Gera o SEU token JWT interno da Pahragon Arena usando a sua chave secreta existente
    // Ajuste o nome da propriedade para bater com o seu Middleware de autenticação (ex: id ou userId)
    const tokenSistema = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Retorna o token e os dados para o frontend salvar
    return res.json({
      token: tokenSistema,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email
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

    return res.status(201).json({ user: { id: user.id, nome, email }, token });
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

    return res.json({ user: { id: user.id, nome: user.nome, email }, token });
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

    return res.status(201).json({ admin: { id: admin.id, nome, email }, token });
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

    return res.json({ admin: { id: admin.id, nome: admin.nome, email }, token });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
}

const atualizarPerfil = async (req, res) => {
  try {
    const userId = req.user.id; // Pego pelo seu middleware de autenticação
    const dadosAtualizados = req.body;

    // Remove as máscaras visuais caso o seu banco precise salvar apenas os números limpos
    const cpfLimpo = dadosAtualizados.cpf ? dadosAtualizados.cpf.replace(/\D/g, '') : null;
    const cepLimpo = dadosAtualizados.cep ? dadosAtualizados.cep.replace(/\D/g, '') : null;
    const celularLimpo = dadosAtualizados.celular ? dadosAtualizados.celular.replace(/\D/g, '') : null;

    // Tratamento para a data de nascimento não quebrar se vier string vazia
    const dataNascimentoFormatada = dadosAtualizados.dataNascimento 
      ? new Date(dadosAtualizados.dataNascimento) 
      : null;

    // Atualização no Prisma
    const usuarioAtualizado = await prisma.user.update({
      where: { id: userId },
      data: {
        nome: dadosAtualizados.nome,
        cpf: cpfLimpo, // Corrigido de dadosAuthorized.cpf para a variável limpa
        dataNascimento: dataNascimentoFormatada,
        celular: celularLimpo,
        cep: cepLimpo,
        rua: dadosAtualizados.rua,
        numero: dadosAtualizados.numero,
        complemento: dadosAtualizados.complemento,
        bairro: dadosAtualizados.bairro,
        cidade: dadosAtualizados.cidade,
        estado: dadosAtualizados.estado,
      },
    });

    // Remove a senha do objeto de retorno por segurança
    if (usuarioAtualizado.senha) {
      delete usuarioAtualizado.senha;
    }

    res.json({ message: 'Perfil atualizado com sucesso!', user: usuarioAtualizado });
  } catch (error) {
    console.error("Erro interno no controller de perfil:", error);
    res.status(500).json({ error: 'Erro interno ao atualizar os dados no banco.' });
  }
};

module.exports = { register, login, registerAdmin, loginAdmin, loginGoogle, atualizarPerfil };