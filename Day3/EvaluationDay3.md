# Évaluation Jour 3 — API Bibliothèque : Sécurité avancée

> **Durée :** 2h | **Barème :** /20
> **Prérequis :** Votre rendu du Jour 2 doit être fonctionnel (Prisma, JWT, bcrypt, architecture Controller/Service).

---

## Contexte

Le Jour 2 a posé les bases : Prisma, JWT, bcrypt, architecture en couches. Aujourd'hui, vous durcissez cette API en y ajoutant des **couches de sécurité complémentaires** vues au Jour 3 : refresh tokens, gestion sécurisée des erreurs, rate limiting étendu, CORS strict, logging et documentation Swagger.

---

## Instructions

Dans votre fork, créez le dossier `evaluations/day3/`. Partez de votre code du Jour 2 (vous pouvez le copier) et faites-y évoluer l'API.

L'API doit fonctionner sur `process.env.PORT` (par défaut `3000`).

### Structure attendue

```
evaluations/day3/
├── prisma/
│   ├── schema.prisma        ← modèles User, Livre, Emprunt + RefreshToken (nouveau)
│   └── migrations/
├── src/
│   ├── index.js
│   ├── app.js               ← helmet, cors, rate limiting, morgan
│   ├── config/
│   │   └── env.js
│   ├── db/
│   │   └── prisma.js
│   ├── docs/
│   │   └── swagger.js       ← configuration Swagger
│   ├── routes/
│   │   ├── auth.js          ← register, login, refresh, logout, me
│   │   └── livres.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── livresController.js
│   ├── middlewares/
│   │   ├── authenticate.js
│   │   ├── authorize.js
│   │   ├── validate.js
│   │   └── errorHandler.js  ← gestion sécurisée des erreurs
│   ├── services/
│   │   ├── authService.js
│   │   └── livreService.js
│   └── validators/
│       ├── authValidator.js
│       └── livreValidator.js
├── .env.example
├── .gitignore
└── package.json
```

### Tableau des permissions

| Route | Public | User connecté | Admin |
|---|---|---|---|
| `POST /api/auth/register` | ✅ | — | — |
| `POST /api/auth/login` | ✅ | — | — |
| `POST /api/auth/refresh` | ✅ (cookie) | — | — |
| `POST /api/auth/logout` | ✅ (cookie) | — | — |
| `GET /api/auth/me` | ❌ | ✅ | ✅ |
| `GET /api/livres` | ✅ | ✅ | ✅ |
| `GET /api/livres/:id` | ✅ | ✅ | ✅ |
| `POST /api/livres` | ❌ | ✅ | ✅ |
| `PUT /api/livres/:id` | ❌ | ✅ | ✅ |
| `DELETE /api/livres/:id` | ❌ | ❌ | ✅ |

---

## Critères de notation

---

### Section 1 — Socle Auth (reprise Jour 2) `/3 pts`

> Ces points valident que votre base du Jour 2 est bien intégrée. Pas de nouvelle implémentation attendue ici — vérification que ça fonctionne toujours après refactoring.

| Critère | Points |
|---|---|
| `POST /api/auth/register` et `POST /api/auth/login` fonctionnent avec Prisma + bcrypt (rounds ≥ 10) + JWT | 1 pt |
| Middleware `authenticate` opérationnel : extrait le token Bearer, injecte `req.user`, retourne `401` si absent/invalide/expiré | 1 pt |
| Même message d'erreur `401` pour email inconnu **et** mauvais mot de passe (protection contre l'énumération de comptes) | 1 pt |

---

### Section 2 — Refresh tokens `/4 pts`

| Critère | Points |
|---|---|
| Modèle `RefreshToken` ajouté au schéma Prisma (`token`, `userId`, `expiresAt`) + migration appliquée | 1 pt |
| `POST /api/auth/login` génère un **access token court** (≤ 15 min) **et** un refresh token (≥ 7 j) stocké en base | 1 pt |
| Le refresh token est envoyé dans un cookie `HttpOnly` + `Secure` (en production) + `SameSite: strict` | 1 pt |
| `POST /api/auth/refresh` vérifie le cookie, contrôle que le token est en base (non révoqué), retourne un nouvel access token | 0,5 pt |
| `POST /api/auth/logout` supprime le refresh token en base et efface le cookie | 0,5 pt |

---

### Section 3 — Sécurité applicative `/5 pts`

| Critère | Points |
|---|---|
| `helmet()` activé dans `app.js` | 0,5 pt |
| CORS configuré : mode permissif en développement, liste blanche via `ALLOWED_ORIGINS` en production | 1 pt |
| Rate limiter global (100 req / 15 min / IP) | 0,5 pt |
| Rate limiter strict sur `/api/auth/login` **et** `/api/auth/register` (≤ 10 req / 15 min) | 1 pt |
| `express.json({ limit: '10kb' })` pour limiter la taille des payloads | 0,5 pt |
| `req.body` destructuré explicitement avant tout appel Prisma (jamais `prisma.user.create({ data: req.body })`) | 1 pt |
| `.env.example` présent et commité avec toutes les variables : `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ALLOWED_ORIGINS` | 0,5 pt |

---

### Section 4 — Gestion sécurisée des erreurs `/3 pts`

| Critère | Points |
|---|---|
| Middleware `errorHandler` avec 4 paramètres `(err, req, res, next)` appliqué en dernier dans `app.js` | 1 pt |
| En production (`NODE_ENV=production`), les erreurs 5xx retournent un message générique (`"Erreur interne"`) sans stack trace | 1 pt |
| Middleware `notFound` retourne `404` avec un message structuré pour toute route inconnue | 0,5 pt |
| Les erreurs sont loggées côté serveur (`console.error`) **sans** inclure `req.body` ni le header `Authorization` | 0,5 pt |

---

### Section 5 — Logging `/2 pts`

| Critère | Points |
|---|---|
| `morgan` configuré dans `app.js` : format `'dev'` en développement, `'combined'` en production | 1 pt |
| Aucune donnée sensible dans les logs applicatifs (mot de passe, token JWT, refresh token) | 1 pt |

---

### Section 6 — Documentation Swagger & qualité du code `/3 pts`

| Critère | Points |
|---|---|
| `swagger-jsdoc` + `swagger-ui-express` configurés, interface accessible sur `GET /api-docs` | 1 pt |
| Au moins 3 routes documentées avec annotations `@swagger` (résumé, paramètres, réponses dont les codes d'erreur 401/403) | 1 pt |
| Architecture en couches respectée : les controllers ne contiennent pas de logique métier, les services ne manipulent pas `req`/`res` | 1 pt |

---

## Bonus (hors barème)

| Bonus | Description |
|---|---|
| **+1 pt** | `npm audit` sans vulnérabilité de niveau `critical` ou `high` (joindre la sortie en screenshot ou dans un fichier `audit.txt`) |
| **+1 pt** | Déploiement sur Railway ou Render : fournir l'URL publique de l'API dans un fichier `DEPLOY.md` |

---

## Rendu

```bash
# Dans votre fork
git add evaluations/day3/
git commit -m "Jour 3 : Sécurité avancée — refresh tokens, rate limiting, erreurs, Swagger"
git push origin main
```

Vérifiez que ces fichiers **ne sont pas** commités :
- `node_modules/`
- `.env`
- `prisma/dev.db`

Ces fichiers **doivent** être commités :
- `prisma/schema.prisma`
- `prisma/migrations/`
- `.env.example`

---

## Récapitulatif du fil rouge sur 3 jours

| Jour | Ce que vous avez construit |
|---|---|
| **Jour 1** | Serveur HTTP natif, routage manuel, persistance JSON, modules Node.js |
| **Jour 2** | Prisma + SQLite, validation Zod, JWT, bcrypt, architecture Controller/Service/Repository |
| **Jour 3** | Refresh tokens, sécurité applicative (helmet, CORS, rate limiting), gestion d'erreurs, logging, Swagger |

**Félicitations — vous avez construit une API REST complète, sécurisée et documentée, prête pour la production.**

---

*"Make it work, make it right, make it fast." — Kent Beck*
