const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin1234', 12);

  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      nom: 'Admin',
      email: 'admin@test.com',
      password: adminPassword,
      role: 'admin',
    },
  });

  await prisma.livre.createMany({
    data: [
      { titre: 'Clean Code', auteur: 'Robert C. Martin', annee: 2008, genre: 'Informatique' },
      { titre: 'The Pragmatic Programmer', auteur: 'Hunt & Thomas', annee: 1999, genre: 'Informatique' },
      { titre: 'Node.js Design Patterns', auteur: 'Mario Casciaro', annee: 2020, genre: 'Informatique' },
    ],
  });

  console.log('Seed terminé — admin@test.com / Admin1234');
}

main().finally(() => prisma.$disconnect());
