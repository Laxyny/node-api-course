const prisma = require('../db/prisma');

async function findAll(filters = {}) {
  const where = {};
  if (filters.genre) where.genre = filters.genre;
  if (filters.disponible !== undefined) where.disponible = filters.disponible === 'true';
  return prisma.livre.findMany({ where, orderBy: { titre: 'asc' } });
}

async function findById(id) {
  const livre = await prisma.livre.findUnique({ where: { id: parseInt(id) } });
  if (!livre) {
    const err = new Error('Livre introuvable');
    err.status = 404;
    throw err;
  }
  return livre;
}

async function create({ titre, auteur, annee, genre, disponible }) {
  return prisma.livre.create({ data: { titre, auteur, annee, genre, disponible } });
}

async function update(id, { titre, auteur, annee, genre, disponible }) {
  await findById(id);
  return prisma.livre.update({
    where: { id: parseInt(id) },
    data: { titre, auteur, annee, genre, disponible },
  });
}

async function remove(id) {
  await findById(id);
  await prisma.emprunt.deleteMany({ where: { livreId: parseInt(id) } });
  await prisma.livre.delete({ where: { id: parseInt(id) } });
}

module.exports = { findAll, findById, create, update, remove };
