# Jour 2 — Base de données, Authentification & Middleware avancé

> **Durée :** 7h — Théorie + Pratique le matin · Rappel 30min · Évaluation projet 2h l'après-midi  
> **Niveau :** Intermédiaire — Prérequis : Jour 1 complété (Express, routes CRUD, fs)

---

## Sommaire

1. [Variables d'environnement & configuration](#1-variables-denvironnement--configuration)
2. [Introduction aux bases de données avec SQLite](#2-introduction-aux-bases-de-données-avec-sqlite)
3. [ORM avec Prisma](#3-orm-avec-prisma)
4. [Validation des données avec Zod](#4-validation-des-données-avec-zod)
5. [Authentification JWT](#5-authentification-jwt)
6. [Middleware d'authentification](#6-middleware-dauthentification)
7. [Hachage de mots de passe avec bcrypt](#7-hachage-de-mots-de-passe-avec-bcrypt)
8. [Architecture en couches (Controller / Service / Repository)](#8-architecture-en-couches-controller--service--repository)
9. [Rappel 30 min — Checklist avant évaluation](#9-rappel-30-min--checklist-avant-évaluation)
10. [Évaluation Jour 2 — Projet fil-rouge](#10-évaluation-jour-2--projet-fil-rouge)

---

## 1. Variables d'environnement & configuration

### 1.1 Pourquoi les variables d'environnement ?

Les variables d'environnement permettent de **séparer la configuration du code** :
- Éviter de commiter des secrets (clés API, mots de passe BDD)
- Avoir des configs différentes par environnement (dev / test / prod)
- Principe **12-factor app**

### 1.2 Le package dotenv

```bash
npm install dotenv
```

```bash
# .env — NE JAMAIS commiter ce fichier !
PORT=3000
NODE_ENV=development
DATABASE_URL=file:./dev.db
JWT_SECRET=mon_secret_tres_long_et_complexe_32_caracteres_minimum
JWT_EXPIRES_IN=24h
```

```bash
# .env.example — CE fichier, on le commite (valeurs factices)
PORT=3000
NODE_ENV=development
DATABASE_URL=file:./dev.db
JWT_SECRET=CHANGE_ME_IN_PRODUCTION
JWT_EXPIRES_IN=24h
```

```javascript
// src/config/env.js — Charger et valider l'environnement
require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
};

// Validation au démarrage
const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Variable d'environnement manquante : ${key}`);
  }
}

module.exports = config;
```

```javascript
// src/index.js — Charger dotenv EN PREMIER
require('dotenv').config(); // ← toujours en tout premier
const express = require('express');
const config = require('./config/env');

const app = express();
app.listen(config.port, () => {
  console.log(`Serveur démarré sur :${config.port} (${config.nodeEnv})`);
});
```

---

## 2. Introduction aux bases de données avec SQLite

### 2.1 Pourquoi SQLite pour ce cours ?

- **Zéro configuration** : une seule fichier `.db`
- **Idéal pour le développement** et les projets de petite taille
- Compatible SQL standard → migration vers PostgreSQL/MySQL facile

### 2.2 SQLite directement (sans ORM)

```bash
npm install better-sqlite3
```

```javascript
// src/db/connection.js
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../dev.db'), {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null,
});

// Activer les foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
```

```javascript
// src/db/migrations.js — Créer les tables
const db = require('./connection');

function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nom       TEXT    NOT NULL,
      email     TEXT    NOT NULL UNIQUE,
      password  TEXT    NOT NULL,
      role      TEXT    NOT NULL DEFAULT 'user',
      createdAt TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS livres (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      titre       TEXT    NOT NULL,
      auteur      TEXT    NOT NULL,
      annee       INTEGER,
      genre       TEXT,
      disponible  INTEGER NOT NULL DEFAULT 1,
      createdAt   TEXT    NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS emprunts (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      livreId   INTEGER NOT NULL REFERENCES livres(id) ON DELETE CASCADE,
      userId    INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
      dateEmprunt TEXT  NOT NULL DEFAULT (datetime('now')),
      dateRetour  TEXT
    );
  `);
  
  console.log('Migrations exécutées avec succès');
}

module.exports = runMigrations;
```

### 2.3 Opérations CRUD avec better-sqlite3

```javascript
// src/repositories/livresRepository.js
const db = require('../db/connection');

const LivresRepository = {
  // Lire tous
  findAll(filters = {}) {
    let query = 'SELECT * FROM livres WHERE 1=1';
    const params = [];
    
    if (filters.genre) {
      query += ' AND genre = ?';
      params.push(filters.genre);
    }
    if (filters.disponible !== undefined) {
      query += ' AND disponible = ?';
      params.push(filters.disponible ? 1 : 0);
    }
    
    return db.prepare(query).all(...params);
  },

  // Lire un
  findById(id) {
    return db.prepare('SELECT * FROM livres WHERE id = ?').get(id);
  },

  // Créer
  create(data) {
    const stmt = db.prepare(`
      INSERT INTO livres (titre, auteur, annee, genre, disponible)
      VALUES (@titre, @auteur, @annee, @genre, @disponible)
    `);
    const result = stmt.run({
      titre: data.titre,
      auteur: data.auteur,
      annee: data.annee || null,
      genre: data.genre || null,
      disponible: data.disponible !== false ? 1 : 0,
    });
    return this.findById(result.lastInsertRowid);
  },

  // Modifier
  update(id, data) {
    const existing = this.findById(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    
    db.prepare(`
      UPDATE livres
      SET titre = @titre, auteur = @auteur, annee = @annee,
          genre = @genre, disponible = @disponible, updatedAt = @updatedAt
      WHERE id = @id
    `).run({ ...updated, id });
    
    return this.findById(id);
  },

  // Supprimer
  delete(id) {
    const result = db.prepare('DELETE FROM livres WHERE id = ?').run(id);
    return result.changes > 0;
  },
};

module.exports = LivresRepository;
```

---

## 3. ORM avec Prisma

### 3.1 Pourquoi un ORM ?

Un ORM (Object-Relational Mapper) traduit les opérations objet JavaScript en SQL. Prisma offre :
- **Type-safety** complète (autocomplétion, erreurs à la compilation)
- **Migrations** versionnées et reproductibles
- **Query builder** lisible et expressif

### 3.2 Initialisation Prisma

```bash
npm install @prisma/client
npm install --save-dev prisma

npx prisma init --datasource-provider sqlite
```

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        Int       @id @default(autoincrement())
  nom       String
  email     String    @unique
  password  String
  role      String    @default("user")
  createdAt DateTime  @default(now())
  emprunts  Emprunt[]
}

model Livre {
  id          Int       @id @default(autoincrement())
  titre       String
  auteur      String
  annee       Int?
  genre       String?
  disponible  Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  emprunts    Emprunt[]
}

model Emprunt {
  id          Int       @id @default(autoincrement())
  livre       Livre     @relation(fields: [livreId], references: [id])
  livreId     Int
  user        User      @relation(fields: [userId], references: [id])
  userId      Int
  dateEmprunt DateTime  @default(now())
  dateRetour  DateTime?
}
```

```bash
# Créer la migration initiale
npx prisma migrate dev --name init

# Générer le client Prisma (après chaque modification du schema)
npx prisma generate

# Explorer la BDD visuellement
npx prisma studio
```

### 3.3 Utiliser le client Prisma

```javascript
// src/db/prisma.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});

module.exports = prisma;
```

```javascript
// Exemples d'opérations Prisma
const prisma = require('../db/prisma');

// Trouver tous les livres disponibles
const livres = await prisma.livre.findMany({
  where: { disponible: true },
  orderBy: { titre: 'asc' },
});

// Trouver un livre avec ses emprunts
const livre = await prisma.livre.findUnique({
  where: { id: 1 },
  include: { emprunts: { include: { user: true } } },
});

// Créer un livre
const nouveau = await prisma.livre.create({
  data: { titre: 'Node.js en action', auteur: 'Mike Cantelon', annee: 2017 },
});

// Mettre à jour
const modifie = await prisma.livre.update({
  where: { id: 1 },
  data: { disponible: false },
});

// Supprimer
await prisma.livre.delete({ where: { id: 1 } });

// Compter
const count = await prisma.livre.count({ where: { genre: 'Informatique' } });
```

---

## 4. Validation des données avec Zod

### 4.1 Pourquoi valider ?

> "Ne jamais faire confiance aux données entrantes" — Règle fondamentale de sécurité.

```bash
npm install zod
```

### 4.2 Définir des schémas

```javascript
// src/validators/livreValidator.js
const { z } = require('zod');

const livreCreateSchema = z.object({
  titre: z.string()
    .min(1, 'Le titre est obligatoire')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  auteur: z.string()
    .min(1, "L'auteur est obligatoire"),
  annee: z.number()
    .int()
    .min(1000, 'Année invalide')
    .max(new Date().getFullYear(), 'Année dans le futur')
    .optional(),
  genre: z.enum(['Informatique', 'Roman', 'Science-Fiction', 'Histoire', 'Autre'])
    .optional(),
  disponible: z.boolean().default(true),
});

const livreUpdateSchema = livreCreateSchema.partial(); // Tous les champs optionnels

module.exports = { livreCreateSchema, livreUpdateSchema };
```

### 4.3 Middleware de validation

```javascript
// src/middlewares/validate.js
const { z } = require('zod');

/**
 * Middleware factory de validation
 * @param {z.ZodSchema} schema
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      // Formater les erreurs Zod
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      return res.status(400).json({
        error: 'Données invalides',
        details: errors,
      });
    }
    
    // Remplacer req.body par les données validées (et transformées)
    req.body = result.data;
    next();
  };
}

module.exports = validate;
```

```javascript
// Utilisation dans une route
const { livreCreateSchema } = require('../validators/livreValidator');
const validate = require('../middlewares/validate');

router.post('/', validate(livreCreateSchema), async (req, res, next) => {
  try {
    const livre = await LivresService.create(req.body);
    res.status(201).json(livre);
  } catch (err) {
    next(err);
  }
});
```

---

## 5. Authentification JWT

### 5.1 Comprendre JSON Web Tokens

Un JWT est un **token signé** contenant des informations :

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9    ← Header (algo + type)
.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWxpY2VAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDAwMDAwMDB9  ← Payload
.SIGNATURE_HMAC_SHA256                     ← Signature
```

**Payload décodé :**
```json
{
  "userId": 1,
  "email": "alice@example.com",
  "role": "user",
  "iat": 1700000000,   // issued at
  "exp": 1700086400    // expires at
}
```

### 5.2 Générer et vérifier des tokens

```bash
npm install jsonwebtoken
```

```javascript
// src/utils/jwt.js
const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Générer un token JWT
 */
function generateToken(payload) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Vérifier un token JWT
 * @throws {JsonWebTokenError} si invalide
 * @throws {TokenExpiredError} si expiré
 */
function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = { generateToken, verifyToken };
```

### 5.3 Routes d'authentification

```javascript
// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db/prisma');
const { generateToken } = require('../utils/jwt');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validators/authValidator');

const router = express.Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { nom, email, password } = req.body;

    // Vérifier que l'email n'existe pas déjà
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: { nom, email, password: hashedPassword },
      select: { id: true, nom: true, email: true, role: true, createdAt: true },
    });

    // Générer le token
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res.json({
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — profil de l'utilisateur connecté
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, nom: true, email: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

---

## 6. Middleware d'authentification

### 6.1 Middleware `authenticate`

```javascript
// src/middlewares/authenticate.js
const { verifyToken } = require('../utils/jwt');

/**
 * Middleware : vérifie le JWT dans le header Authorization
 * Injecte req.user = { userId, email, role }
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou format invalide' });
  }

  const token = authHeader.slice(7); // Supprimer "Bearer "

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { userId, email, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    return res.status(401).json({ error: 'Token invalide' });
  }
}

module.exports = authenticate;
```

### 6.2 Middleware `authorize` (contrôle des rôles)

```javascript
// src/middlewares/authorize.js

/**
 * Middleware factory : vérifie que l'utilisateur a le bon rôle
 * @param {...string} roles - Rôles autorisés
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Accès refusé — rôle requis : ${roles.join(' ou ')}`,
      });
    }
    next();
  };
}

module.exports = authorize;
```

### 6.3 Utilisation dans les routes

```javascript
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Route publique — pas besoin de token
router.get('/livres', async (req, res) => { /* ... */ });

// Route protégée — token requis
router.post('/livres', authenticate, validate(livreCreateSchema), async (req, res) => {
  // req.user est disponible ici
  console.log(`Livre créé par : ${req.user.email}`);
  /* ... */
});

// Route admin seulement
router.delete('/livres/:id', authenticate, authorize('admin'), async (req, res) => {
  /* ... */
});

// Enchaîner plusieurs middlewares
router.put('/livres/:id',
  authenticate,
  authorize('admin', 'bibliothecaire'),
  validate(livreUpdateSchema),
  async (req, res) => { /* ... */ }
);
```

---

## 7. Hachage de mots de passe avec bcrypt

### 7.1 Principes

- Ne **jamais** stocker un mot de passe en clair
- `bcrypt` applique un hachage lent avec sel (salt) — résistant aux attaques par dictionnaire
- Le `cost factor` (rounds) détermine la lenteur : 10-12 recommandé en production

```bash
npm install bcryptjs
```

```javascript
const bcrypt = require('bcryptjs');

// Hacher
const SALT_ROUNDS = 12;
const plainPassword = 'MonMotDePasse123!';
const hashed = await bcrypt.hash(plainPassword, SALT_ROUNDS);
// Résultat : "$2a$12$..."  (60 caractères)

// Vérifier
const isValid = await bcrypt.compare(plainPassword, hashed);    // true
const isInvalid = await bcrypt.compare('mauvais', hashed);      // false
```

### 7.2 Validateur de mot de passe fort

```javascript
// src/validators/authValidator.js
const { z } = require('zod');

const passwordSchema = z.string()
  .min(8, 'Minimum 8 caractères')
  .regex(/[A-Z]/, 'Doit contenir une majuscule')
  .regex(/[0-9]/, 'Doit contenir un chiffre');

const registerSchema = z.object({
  nom: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

module.exports = { registerSchema, loginSchema };
```

---

## 8. Architecture en couches (Controller / Service / Repository)

### 8.1 Le pattern 3-couches

```
HTTP Request
     │
     ▼
┌──────────────┐
│   Controller  │  ← Reçoit req/res, délègue, renvoie la réponse
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Service     │  ← Logique métier, orchestration, règles
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Repository  │  ← Accès à la BDD uniquement
└──────────────┘
```

### 8.2 Exemple complet : LivreService

```javascript
// src/services/livreService.js
const prisma = require('../db/prisma');

class LivreService {
  async findAll(filters = {}) {
    const where = {};
    if (filters.genre) where.genre = filters.genre;
    if (filters.disponible !== undefined) where.disponible = filters.disponible === 'true';
    
    return prisma.livre.findMany({
      where,
      orderBy: { titre: 'asc' },
    });
  }

  async findById(id) {
    const livre = await prisma.livre.findUnique({
      where: { id: parseInt(id) },
      include: {
        emprunts: {
          where: { dateRetour: null },
          include: { user: { select: { nom: true, email: true } } },
        },
      },
    });
    if (!livre) throw Object.assign(new Error('Livre introuvable'), { status: 404 });
    return livre;
  }

  async create(data) {
    return prisma.livre.create({ data });
  }

  async update(id, data) {
    await this.findById(id); // Lance une erreur 404 si absent
    return prisma.livre.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  async delete(id) {
    await this.findById(id); // Lance une erreur 404 si absent
    await prisma.livre.delete({ where: { id: parseInt(id) } });
  }

  // Logique métier : emprunter un livre
  async emprunter(livreId, userId) {
    const livre = await this.findById(livreId);
    
    if (!livre.disponible) {
      throw Object.assign(new Error('Ce livre n\'est pas disponible'), { status: 409 });
    }
    
    // Transaction : modifier disponibilité + créer emprunt atomiquement
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
}

module.exports = new LivreService();
```

```javascript
// src/controllers/livreController.js
const livreService = require('../services/livreService');

const LivreController = {
  async index(req, res, next) {
    try {
      const livres = await livreService.findAll(req.query);
      res.json(livres);
    } catch (err) { next(err); }
  },

  async show(req, res, next) {
    try {
      const livre = await livreService.findById(req.params.id);
      res.json(livre);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const livre = await livreService.create(req.body);
      res.status(201).json(livre);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const livre = await livreService.update(req.params.id, req.body);
      res.json(livre);
    } catch (err) { next(err); }
  },

  async destroy(req, res, next) {
    try {
      await livreService.delete(req.params.id);
      res.status(204).send();
    } catch (err) { next(err); }
  },
};

module.exports = LivreController;
```

```javascript
// src/routes/livres.js — Version finale avec tout
const express = require('express');
const router = express.Router();
const controller = require('../controllers/livreController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { livreCreateSchema, livreUpdateSchema } = require('../validators/livreValidator');

router.get('/',    controller.index);
router.get('/:id', controller.show);
router.post('/',   authenticate, validate(livreCreateSchema), controller.create);
router.put('/:id', authenticate, validate(livreUpdateSchema), controller.update);
router.delete('/:id', authenticate, authorize('admin'), controller.destroy);

module.exports = router;
```

---

## 9. Rappel 30 min — Checklist avant évaluation

> ⏰ Ce rappel est fait **en début d'après-midi** avant de démarrer le projet.

### Architecture du projet attendu

```
evaluations/day2/
├── prisma/
│   ├── schema.prisma      ← Modèles User + Livre + Emprunt
│   └── dev.db             ← BDD SQLite (générée automatiquement)
├── src/
│   ├── index.js            ← Express + middlewares globaux
│   ├── config/env.js       ← Config dotenv
│   ├── db/prisma.js        ← Instance Prisma
│   ├── middlewares/
│   │   ├── authenticate.js
│   │   ├── authorize.js
│   │   └── validate.js
│   ├── services/
│   │   ├── authService.js
│   │   └── livreService.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── livreController.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── livres.js
│   └── validators/
│       ├── authValidator.js
│       └── livreValidator.js
├── .env
├── .env.example
├── .gitignore
└── package.json
```

### Flux d'authentification

```
POST /api/auth/register → body: {nom, email, password} → {user, token}
POST /api/auth/login    → body: {email, password}        → {user, token}
GET  /api/auth/me       → Header: Bearer <token>         → {user}

Utiliser le token dans les requêtes protégées :
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Points de vigilance

- `.env` dans `.gitignore` ✓
- `.env.example` commité avec valeurs factices ✓
- `prisma generate` après toute modification du schema ✓
- Transaction Prisma pour les opérations multi-tables ✓
- Toujours retourner des messages d'erreur clairs (pas de stack trace en prod) ✓

---

