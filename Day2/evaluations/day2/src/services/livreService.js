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

async function create(data) {
  return prisma.livre.create({ data });
}

async function update(id, data) {
  await findById(id);
  return prisma.livre.update({ where: { id: parseInt(id) }, data });
}

async function remove(id) {
  await findById(id);
  await prisma.emprunt.deleteMany({ where: { livreId: parseInt(id) } });
  await prisma.livre.delete({ where: { id: parseInt(id) } });
}

async function emprunter(livreId, userId) {
  const livre = await findById(livreId);

  if (!livre.disponible) {
    const err = new Error("Ce livre n'est pas disponible");
    err.status = 409;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    await tx.livre.update({
      where: { id: parseInt(livreId) },
      data: { disponible: false },
    });
    return tx.emprunt.create({
      data: { livreId: parseInt(livreId), userId: parseInt(userId) },
      include: { livre: true, user: { select: { nom: true } } },
    });
  });
}

async function retourner(livreId, userId) {
  const emprunt = await prisma.emprunt.findFirst({
    where: { livreId: parseInt(livreId), userId: parseInt(userId), dateRetour: null },
  });

  if (!emprunt) {
    const err = new Error('Aucun emprunt actif trouvé pour ce livre');
    err.status = 404;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    await tx.livre.update({
      where: { id: parseInt(livreId) },
      data: { disponible: true },
    });
    return tx.emprunt.update({
      where: { id: emprunt.id },
      data: { dateRetour: new Date() },
    });
  });
}

module.exports = { findAll, findById, create, update, remove, emprunter, retourner };
