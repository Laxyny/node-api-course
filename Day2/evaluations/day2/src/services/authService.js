const bcrypt = require('bcryptjs');
const prisma = require('../db/prisma');
const { generateToken } = require('../utils/jwt');

async function register({ nom, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Cet email est déjà utilisé');
    err.status = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { nom, email, password: hashedPassword },
    select: { id: true, nom: true, email: true, role: true, createdAt: true },
  });

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });
  return { user, token };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('Email ou mot de passe incorrect');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const err = new Error('Email ou mot de passe incorrect');
    err.status = 401;
    throw err;
  }

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });
  return {
    user: { id: user.id, nom: user.nom, email: user.email, role: user.role },
    token,
  };
}

async function getMe(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nom: true, email: true, role: true, createdAt: true },
  });
}

module.exports = { register, login, getMe };
