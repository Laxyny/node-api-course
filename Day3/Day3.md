# Jour 3 — Sécurité avancée & Mise en production

> **Durée :** 7h | **Niveau :** Intermédiaire → Confirmé
> **Prérequis :** Jour 2 complété (Prisma, JWT, bcrypt, architecture Controller/Service)
> **Objectif :** Approfondir la sécurité d'une API REST, documenter avec Swagger, et préparer le déploiement.

---

## Sommaire

1. [Rappel express — JWT, bcrypt & middlewares (Jour 2)](#1-rappel-express--jwt-bcrypt--middlewares-jour-2)
2. [Helmet — Headers HTTP de sécurité](#2-helmet--headers-http-de-sécurité)
3. [CORS avancé](#3-cors-avancé)
4. [Rate limiting & protection brute-force](#4-rate-limiting--protection-brute-force)
5. [Injections & validation avancée](#5-injections--validation-avancée)
6. [Gestion sécurisée des erreurs](#6-gestion-sécurisée-des-erreurs)
7. [Refresh tokens](#7-refresh-tokens)
8. [Audit & durcissement des dépendances](#8-audit--durcissement-des-dépendances)
9. [Logging sécurisé](#9-logging-sécurisé)
10. [Documentation avec Swagger/OpenAPI](#10-documentation-avec-swaggeropenapi)
11. [Déploiement](#11-déploiement)
12. [Rappel 30 min — Checklist avant évaluation](#12-rappel-30-min--checklist-avant-évaluation)
13. [Évaluation finale](#13-évaluation-finale)

---

## Planning de la journée

| Créneau | Contenu |
|---|---|
| 09h00 – 09h15 | Rappel rapide Jour 2 (JWT, bcrypt, middlewares) |
| 09h15 – 10h00 | Helmet, CORS avancé, Rate limiting |
| 10h00 – 11h00 | Injections, validation avancée, gestion des erreurs |
| 11h00 – 12h00 | Refresh tokens, audit, logging sécurisé |
| 12h00 – 12h30 | Swagger/OpenAPI + Déploiement |
| 12h30 – 13h30 | Pause déjeuner |
| 13h30 – 14h00 | **Rappel & questions** |
| 14h00 – 16h00 | **Évaluation finale notée** |

---

## 1. Rappel express — JWT, bcrypt & middlewares (Jour 2)

> ⏱️ **15 minutes** — Ces notions ont été détaillées au Jour 2. Ce rappel synthétise les points clés avant d'aller plus loin.

### Ce qu'on sait déjà

**bcrypt** : hacher avec `bcrypt.hash(password, 12)`, vérifier avec `bcrypt.compare()`. Ne jamais stocker un mot de passe en clair, ne jamais comparer avec `===`.

**JWT** : token en trois parties (Header.Payload.Signature). Le payload est encodé en Base64, **pas chiffré** — ne jamais y mettre de données sensibles. On génère avec `jwt.sign()`, on vérifie avec `jwt.verify()`.

**Middleware `authenticate`** : extrait le token du header `Authorization: Bearer <token>`, vérifie sa validité, injecte `req.user` et appelle `next()`. Retourne 401 si absent/invalide/expiré.

**Middleware `authorize(...roles)`** : vérifie que `req.user.role` fait partie des rôles autorisés. Retourne 403 sinon.

### Ce qu'on va approfondir aujourd'hui

- Quels nouveaux vecteurs d'attaque subsistent malgré JWT + bcrypt ?
- Comment durcir l'API avec des couches de sécurité complémentaires ?
- Comment gérer le cycle de vie des tokens (expiration, révocation) ?

---

## 2. Helmet — Headers HTTP de sécurité

```bash
npm install helmet
```

`helmet` est un middleware qui ajoute ou modifie automatiquement des headers HTTP pour neutraliser des classes entières d'attaques.

### 2.1 Activation et ce qu'il fait

```javascript
const helmet = require('helmet');
app.use(helmet()); // Active tous les protections par défaut
```

| Header ajouté par Helmet | Attaque neutralisée |
|---|---|
| `Content-Security-Policy` | Injection de scripts (XSS) |
| `X-Frame-Options: DENY` | Clickjacking |
| `X-Content-Type-Options: nosniff` | MIME sniffing |
| `Strict-Transport-Security` | Downgrade HTTP → HTTPS (HSTS) |
| `X-DNS-Prefetch-Control: off` | Fuite d'information via DNS |
| `Referrer-Policy: no-referrer` | Fuite d'URL dans le header Referer |

### 2.2 Configuration fine de la CSP

La Content Security Policy (CSP) est le header le plus puissant, mais aussi le plus délicat à configurer.

```javascript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],           // Par défaut : ressources du même domaine
        scriptSrc:  ["'self'"],           // Scripts : uniquement depuis soi-même
        styleSrc:   ["'self'", "'unsafe-inline'"], // Styles : autorise les styles inline
        imgSrc:     ["'self'", "data:"],  // Images : soi-même + data URIs
        connectSrc: ["'self'"],           // XHR/fetch : uniquement vers soi-même
      },
    },
    // Désactiver uniquement si votre frontend est servi en HTTP en dev
    hsts: process.env.NODE_ENV === 'production',
  })
);
```

> 💡 Pour une API pure (pas de frontend servi par Node), la CSP est moins critique — c'est surtout utile si vous servez du HTML.

---

## 3. CORS avancé

```bash
npm install cors
```

CORS (Cross-Origin Resource Sharing) contrôle quels domaines peuvent appeler votre API depuis un navigateur.

### 3.1 Comprendre le risque

Sans CORS configuré (ou avec `origin: '*'`), un site malveillant peut déclencher des requêtes vers votre API en utilisant les cookies de session d'un utilisateur connecté. C'est la base des attaques **CSRF**.

### 3.2 Configuration en développement vs production

```javascript
const cors = require('cors');

// Développement : permissif
if (process.env.NODE_ENV === 'development') {
  app.use(cors());
}

// Production : liste blanche stricte
if (process.env.NODE_ENV === 'production') {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

  app.use(cors({
    origin(origin, callback) {
      // Autoriser les requêtes sans origin (Postman, mobile)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS : origine non autorisée — ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,   // Nécessaire pour envoyer des cookies
    maxAge: 86400,        // Mettre en cache le résultat preflight 24h
  }));
}
```

### 3.3 Pré-requis en production

Dans `.env` :
```bash
ALLOWED_ORIGINS=https://mon-frontend.com,https://app.mon-domaine.fr
```

---

## 4. Rate limiting & protection brute-force

```bash
npm install express-rate-limit
```

### 4.1 Limiter les requêtes globalement

```javascript
const rateLimit = require('express-rate-limit');

// Appliquer à toutes les routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Fenêtre de 15 minutes
  max: 100,                  // 100 requêtes par IP par fenêtre
  standardHeaders: true,     // Expose X-RateLimit-* dans les headers
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez dans 15 minutes.' },
});

app.use(globalLimiter);
```

### 4.2 Limiter strictement les routes d'authentification

Les endpoints de login et de register sont les cibles prioritaires d'attaques par force brute.

```javascript
// 5 tentatives de login par 15 minutes par IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  skipSuccessfulRequests: true, // Ne compte pas les requêtes réussies
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

### 4.3 Limiter la taille des payloads

Une autre protection simple contre les attaques par déni de service (DoS) :

```javascript
// Refuser les corps de requête > 10 Ko
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
```

---

## 5. Injections & validation avancée

### 5.1 Injection SQL — Pourquoi Prisma protège

Une injection SQL consiste à injecter du SQL malveillant dans un paramètre pour manipuler la requête.

```sql
-- Requête naïve vulnérable (si on concaténait des chaînes) :
SELECT * FROM users WHERE email = '' OR '1'='1' --';
```

Prisma utilise systématiquement des **requêtes paramétrées** : les valeurs fournies par l'utilisateur ne sont jamais interpolées dans la requête SQL. Il est donc impossible d'injecter du SQL via les méthodes Prisma standard.

```javascript
// Sûr : Prisma envoie email comme paramètre, pas comme SQL brut
const user = await prisma.user.findUnique({ where: { email: req.body.email } });

// ⚠️ Seul cas risqué : prisma.$queryRaw si mal utilisé
// Toujours préférer prisma.$queryRaw`SELECT * FROM users WHERE id = ${id}`
// (tagged template literal) plutôt que la concaténation de chaînes
```

### 5.2 Injection NoSQL / prototype pollution

Même sans SQL, une API Node peut être vulnérable si elle traite des objets sans validation.

```javascript
// Attaque : envoyer {"email": {"$gt": ""}} pour contourner un filtre
// body: { "email": { "$gt": "" }, "password": "anything" }
```

La protection : valider strictement les types avec **Zod** avant tout traitement.

```javascript
// Zod garantit que email est une string, jamais un objet
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
```

### 5.3 Sanitisation des entrées avec `express-validator`

Zod valide la structure, mais certaines valeurs peuvent encore contenir du HTML ou des caractères dangereux si elles sont renvoyées dans une réponse HTML.

```bash
npm install express-validator
```

```javascript
const { body, validationResult } = require('express-validator');

router.post('/commentaire',
  authenticate,
  // Nettoyer les entrées AVANT de les traiter
  body('texte').trim().escape(),          // Supprime balises HTML
  body('email').normalizeEmail(),         // Normalise l'email
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // req.body.texte est maintenant sûr à stocker et à afficher
  }
);
```

> 💡 Pour une API JSON pure (sans rendu HTML côté serveur), `.escape()` est moins critique — mais reste une bonne habitude, surtout si les données sont un jour affichées dans un front.

### 5.4 Éviter la pollution de `req.body`

Un attaquant peut envoyer des champs supplémentaires pour tenter de modifier des données privilégiées (ex: envoyer `role: "admin"` à l'inscription).

La bonne pratique : ne jamais passer `req.body` directement à Prisma. Destructurer explicitement les champs attendus.

```javascript
// ❌ Dangereux : l'utilisateur peut injecter n'importe quel champ
await prisma.user.create({ data: req.body });

// ✅ Sûr : on choisit exactement ce qu'on accepte
const { nom, email, password } = req.body;
await prisma.user.create({ data: { nom, email, password: hashed } });
```

---

## 6. Gestion sécurisée des erreurs

### 6.1 Ne jamais exposer les stack traces en production

Un message d'erreur trop verbeux offre un plan de l'application à un attaquant.

```javascript
// src/middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  // En développement : afficher tous les détails
  if (process.env.NODE_ENV === 'development') {
    return res.status(status).json({
      error: err.message,
      stack: err.stack,
    });
  }

  // En production : message générique pour les erreurs 5xx
  if (status >= 500) {
    console.error('[ERROR]', err); // Logger côté serveur uniquement
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }

  // Les erreurs 4xx (validation, auth...) peuvent être renvoyées telles quelles
  res.status(status).json({ error: err.message });
}

// Route non trouvée
function notFound(req, res) {
  res.status(404).json({ error: `Route introuvable : ${req.method} ${req.path}` });
}

module.exports = { errorHandler, notFound };
```

```javascript
// app.js — toujours en dernier
app.use(notFound);
app.use(errorHandler);
```

### 6.2 Messages d'erreur neutres pour l'authentification

Révéler si un email existe ou non aide les attaquants à constituer une liste de comptes valides (enumeration attack).

```javascript
// ❌ Trop précis — révèle que l'email est inconnu
if (!user) return res.status(401).json({ error: 'Email introuvable' });

// ✅ Message identique dans les deux cas
if (!user || !(await bcrypt.compare(password, user.password))) {
  return res.status(401).json({ error: 'Identifiants invalides' });
}
```

---

## 7. Refresh tokens

### 7.1 Le problème avec les access tokens classiques

Un JWT classique avec une longue durée de vie (ex: 24h) ne peut pas être révoqué avant expiration. Si un token est volé, l'attaquant a accès jusqu'à l'expiration.

### 7.2 La stratégie Access token + Refresh token

```
┌─────────┐      POST /auth/login       ┌───────────┐
│ Client  │ ─────────────────────────→  │   API     │
│         │ ←─────────────────────────  │           │
│         │  { accessToken (15min),      │           │
│         │    refreshToken (7j) }        │           │
└─────────┘                             └───────────┘

Quand l'accessToken expire :
┌─────────┐   POST /auth/refresh        ┌───────────┐
│ Client  │ ─────────────────────────→  │   API     │
│         │   { refreshToken }           │           │
│         │ ←─────────────────────────  │           │
│         │   { accessToken (15min) }    │           │
└─────────┘                             └───────────┘
```

| Token | Durée de vie | Stockage client | Usage |
|---|---|---|---|
| **Access token** | Courte (5–15 min) | Mémoire JS | Envoyer dans `Authorization` |
| **Refresh token** | Longue (7–30 j) | Cookie HttpOnly | Renouveler l'access token uniquement |

### 7.3 Implémentation

```javascript
// src/utils/jwt.js
const jwt = require('jsonwebtoken');

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(payload) {
  // Secret différent pour les refresh tokens
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

module.exports = { generateAccessToken, generateRefreshToken };
```

```javascript
// Modèle Prisma — stocker les refresh tokens en base pour permettre la révocation
model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

```javascript
// POST /api/auth/login — retourner les deux tokens
const accessToken  = generateAccessToken({ userId: user.id, role: user.role });
const refreshToken = generateRefreshToken({ userId: user.id });

// Stocker le refresh token en base
await prisma.refreshToken.create({
  data: {
    token: refreshToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
});

// Envoyer le refresh token dans un cookie HttpOnly (non accessible en JS)
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en prod
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
});

res.json({ accessToken, user: { id: user.id, nom: user.nom, role: user.role } });
```

```javascript
// POST /api/auth/refresh — renouveler l'access token
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token manquant' });

    // Vérifier que le token est en base (non révoqué)
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token invalide ou expiré' });
    }

    // Vérifier la signature
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Émettre un nouvel access token
    const accessToken = generateAccessToken({ userId: payload.userId, role: payload.role });
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout — révoquer le refresh token
router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'Déconnecté' });
});
```

---

## 8. Audit & durcissement des dépendances

### 8.1 npm audit

```bash
# Scanner les vulnérabilités connues dans les dépendances
npm audit

# Corriger automatiquement les vulnérabilités non breaking
npm audit fix

# Corriger y compris les breaking changes (avec précaution !)
npm audit fix --force
```

> 💡 `npm audit` consulte la base CVE de npm et signale les packages avec des vulnérabilités publiques. À lancer régulièrement, et impérativement avant une mise en production.

### 8.2 Fixer les versions en production

```json
// package.json — éviter les mises à jour automatiques imprévues
{
  "dependencies": {
    "express": "4.19.2",   // Version exacte, pas "^4.19.2"
    "prisma": "5.14.0"
  }
}
```

Ou utiliser `npm ci` en CI/CD plutôt que `npm install` : il respecte strictement `package-lock.json`.

### 8.3 Ne pas exposer les informations de version

```javascript
// Supprimer le header X-Powered-By qui révèle qu'on utilise Express
app.disable('x-powered-by');
// (helmet() le fait déjà automatiquement)
```

### 8.4 Variables d'environnement — bonnes pratiques

```bash
# Générer un secret JWT cryptographiquement fort
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ne jamais utiliser :
JWT_SECRET=secret          # ❌ Trop court, prévisible
JWT_SECRET=monappli123     # ❌ Dictionnaire

# Utiliser :
JWT_SECRET=a3f8d2c1e7b4...  # ✅ 128 caractères hexadécimaux aléatoires
```

---

## 9. Logging sécurisé

### 9.1 Pourquoi les logs peuvent être dangereux

Un log mal configuré peut enregistrer des mots de passe, des tokens ou des données personnelles, créant un vecteur de fuite de données.

```javascript
// ❌ Ne jamais logger le body entier sans filtrage
console.log('Requête reçue :', req.body);
// → Peut logger { email: "alice@example.com", password: "MonMotDePasse123!" }
```

### 9.2 Logging avec Morgan (requêtes HTTP)

```bash
npm install morgan
```

```javascript
const morgan = require('morgan');

// En développement : format lisible
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// En production : format JSON structuré (compatible avec des agrégateurs de logs)
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
}
```

### 9.3 Logger les erreurs sans exposer les données sensibles

```javascript
// src/middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
  // Construire un log sans données sensibles
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    status: err.status || 500,
    message: err.message,
    // Ne pas inclure : req.body, req.headers.authorization
  };

  if (err.status >= 500) {
    console.error('[ERROR]', JSON.stringify(logEntry));
  }

  // Réponse au client
  const status = err.status || 500;
  res.status(status).json(
    process.env.NODE_ENV === 'production' && status >= 500
      ? { error: 'Erreur interne' }
      : { error: err.message }
  );
}
```

### 9.4 app.js final — tout assemblé

```javascript
// src/app.js
require('dotenv').config();

const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const morgan     = require('morgan');
const cookieParser = require('cookie-parser');

const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app = express();

// ── Sécurité ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || (process.env.NODE_ENV === 'development' ? '*' : []),
  credentials: true,
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// ── Parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ── Logging ───────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/livres', require('./routes/livres'));

// ── Gestion des erreurs (toujours en dernier) ─────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
```

---

## 10. Documentation avec Swagger/OpenAPI

```bash
npm install swagger-jsdoc swagger-ui-express
```

### 10.1 Configuration

```javascript
// src/docs/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Bibliothèque',
      version: '1.0.0',
      description: 'API de gestion de bibliothèque — Cours Node.js Jour 3',
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
```

### 10.2 Annotations JSDoc dans les routes

```javascript
/**
 * @swagger
 * /api/livres:
 *   get:
 *     summary: Liste tous les livres
 *     tags: [Livres]
 *     parameters:
 *       - in: query
 *         name: disponible
 *         schema:
 *           type: boolean
 *         description: Filtrer par disponibilité
 *     responses:
 *       200:
 *         description: Succès
 *
 * /api/livres/{id}:
 *   delete:
 *     summary: Supprimer un livre (admin)
 *     tags: [Livres]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Supprimé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Droits insuffisants
 */
```

```javascript
// app.js — ajouter avant les routes d'erreur
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// → Interface disponible sur http://localhost:3000/api-docs
```

---

## 11. Déploiement

### 11.1 Variables d'environnement en production

```bash
# .env.production (ne jamais commiter)
NODE_ENV=production
PORT=8080
DATABASE_URL=file:/app/data/bibliotheque.db
JWT_SECRET=<128_chars_hex_aléatoires>
JWT_REFRESH_SECRET=<autre_secret_128_chars>
ALLOWED_ORIGINS=https://mon-frontend.com
```

### 11.2 package.json prêt pour la prod

```json
{
  "scripts": {
    "start":  "node src/index.js",
    "dev":    "nodemon src/index.js",
    "lint":   "eslint src/"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 11.3 Déploiement sur Railway / Render

1. Pusher le code sur GitHub (sans `.env`, `node_modules`, `dev.db`)
2. Créer un compte [Railway](https://railway.app) ou [Render](https://render.com)
3. Connecter le repo GitHub — le service se déploie automatiquement à chaque `git push`
4. Définir les variables d'environnement dans le dashboard
5. Pour Prisma : ajouter une commande de build `npx prisma migrate deploy && node src/index.js`

> ⚠️ `prisma migrate deploy` (et non `dev`) en production : elle applique les migrations existantes sans en créer de nouvelles.

### 11.4 HTTPS

Railway et Render fournissent HTTPS automatiquement. Si vous déployez sur un VPS, utilisez [Caddy](https://caddyserver.com/) ou Let's Encrypt via Certbot — ne jamais exposer une API en HTTP en production.

---

## 12. Rappel 30 min — Checklist avant évaluation

> ⏰ Ce rappel est fait **en début d'après-midi** avant de démarrer l'évaluation.

### Flux d'authentification complet (avec refresh tokens)

```
POST /api/auth/register  →  { user, accessToken } + cookie refreshToken
POST /api/auth/login     →  { user, accessToken } + cookie refreshToken
GET  /api/auth/me        →  Header: Authorization: Bearer <accessToken>
POST /api/auth/refresh   →  Cookie: refreshToken → { accessToken }
POST /api/auth/logout    →  Supprime le refreshToken en base + efface le cookie
```

### Checklist de sécurité complète

| ✅ | Pratique |
|---|---|
| ☐ | `helmet()` activé |
| ☐ | CORS configuré avec liste blanche en production |
| ☐ | Rate limiting global (100 req/15min) |
| ☐ | Rate limiting strict sur `/login` et `/register` (5 req/15min) |
| ☐ | `express.json({ limit: '10kb' })` |
| ☐ | Mots de passe hachés avec bcrypt (rounds ≥ 10) |
| ☐ | Même message d'erreur pour email inconnu et mauvais mot de passe |
| ☐ | JWT secret long et aléatoire (≥ 64 bytes hex) |
| ☐ | Access token courte durée (15 min) |
| ☐ | Refresh token dans cookie HttpOnly + Secure |
| ☐ | Stack traces masquées en production |
| ☐ | Données sensibles non loggées (password, token) |
| ☐ | Champs `req.body` destructurés explicitement avant Prisma |
| ☐ | `npm audit` lancé sans vulnérabilités critiques |
| ☐ | `.env` et `dev.db` dans `.gitignore` |
| ☐ | `.env.example` commité avec valeurs factices |

---

## 13. Évaluation finale

> Voir le fichier `EvaluationDay3.md` pour le cahier des charges complet.

L'évaluation du Jour 3 reprend l'API du Jour 2 pour y intégrer les nouvelles couches de sécurité vues aujourd'hui : refresh tokens, gestion sécurisée des erreurs, headers helmet, rate limiting et documentation Swagger.
