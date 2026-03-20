## ÉVALUATION JOUR 3 — Projet Fil Rouge : API Bibliothèque sécurisée

> **Durée :** 2h | **Barème :** /20

---

### Contexte

C'est l'évaluation finale. Reprenez la base du Jour 2 et ajoutez l'authentification JWT, l'autorisation par rôle, et les mesures de sécurité.

---

### 🎯 Instructions

Dans votre fork, créez le dossier `evaluations/jour3/`. L'API doit fonctionner sur le port `3000` (ou `process.env.PORT`).

#### Structure attendue

```
evaluations/
└── jour3/
    ├── package.json
    ├── .env.example
    ├── .gitignore
    ├── index.js
    ├── app.js
    ├── routes/
    │   ├── auth.js
    │   └── livres.js
    ├── controllers/
    │   ├── authController.js
    │   └── livresController.js
    ├── middlewares/
    │   ├── auth.js          ← authenticate + authorize
    │   ├── logger.js
    │   └── errorHandler.js
    ├── validators/
    │   ├── authValidator.js
    │   └── livreValidator.js
    └── db/
        └── database.js
```

#### Rôles et permissions

| Route | Public | User (connecté) | Admin |
|---|---|---|---|
| `GET /api/livres` | ✅ | ✅ | ✅ |
| `GET /api/livres/:id` | ✅ | ✅ | ✅ |
| `POST /api/livres` | ❌ | ✅ | ✅ |
| `PUT /api/livres/:id` | ❌ | ✅ (si son livre) | ✅ |
| `DELETE /api/livres/:id` | ❌ | ❌ | ✅ |
| `POST /api/auth/register` | ✅ | — | — |
| `POST /api/auth/login` | ✅ | — | — |
| `GET /api/auth/me` | ❌ | ✅ | ✅ |

---

### Critères de notation

#### Section 1 — Inscription et connexion `/5 pts`

| Critère | Points |
|---|---|
| `POST /api/auth/register` crée un utilisateur et retourne `201` | 1 pt |
| Le mot de passe est haché avec `bcrypt` (rounds ≥ 10) **avant** insertion en base | 2 pts |
| `POST /api/auth/login` vérifie les identifiants et retourne un token JWT | 1 pt |
| En cas de mauvais identifiants, la réponse est `401` avec **le même message** pour email inconnu et mauvais mot de passe | 1 pt |

---

#### Section 2 — Middleware d'authentification JWT `/5 pts`

| Critère | Points |
|---|---|
| Le middleware `authenticate` extrait le token du header `Authorization: Bearer <token>` | 1 pt |
| Le token est vérifié avec `jwt.verify()` et le secret depuis `.env` | 2 pts |
| Un token expiré ou invalide retourne `401` avec un message explicite | 1 pt |
| Le payload décodé est attaché à `req.user` pour les routes suivantes | 1 pt |

---

#### Section 3 — Autorisation par rôle `/4 pts`

| Critère | Points |
|---|---|
| Un middleware `authorize(...roles)` vérifie `req.user.role` | 2 pts |
| `DELETE /api/livres/:id` est accessible uniquement aux `admin` (retourne `403` sinon) | 1 pt |
| `POST /api/livres` exige d'être authentifié (retourne `401` si pas de token) | 1 pt |

---

#### Section 4 — Sécurité applicative `/4 pts`

| Critère | Points |
|---|---|
| `helmet` est configuré dans `app.js` | 1 pt |
| Un rate limiter est appliqué sur la route `POST /api/auth/login` | 1 pt |
| `express.json()` est configuré avec une limite de taille (ex: `{ limit: '10kb' }`) | 1 pt |
| Un fichier `.env.example` documente toutes les variables d'environnement nécessaires (`PORT`, `JWT_SECRET`, `DB_PATH`, etc.) | 1 pt |

---

#### Section 5 — Route `/api/auth/me` et qualité globale `/2 pts`

| Critère | Points |
|---|---|
| `GET /api/auth/me` retourne les infos de l'utilisateur connecté (depuis `req.user`) avec `authenticate` | 1 pt |
| Le code ne contient pas de données sensibles hardcodées (pas de secret JWT en dur, pas de mot de passe en clair dans le code) | 1 pt |

---

### Bonus (hors barème)

- Implémenter un système de refresh token
- Ajouter la documentation Swagger/OpenAPI sur `/api-docs`
- Implémenter `PATCH /api/livres/:id/disponibilite` pour emprunter/retourner un livre
- Déployer l'API sur Railway ou Render et fournir l'URL publique

---

### Rendu final

1. Pushez votre code sur votre fork GitHub
2. Le code doit être dans `evaluations/jour3/`
3. Vérifiez que `.env`, `node_modules` et `*.db` ne sont **pas** commités
4. Envoyez le lien vers votre fork : `https://github.com/votre-pseudo/node-api-course`

---

### Récapitulatif du fil rouge sur 3 jours

| Jour | Ce que vous avez construit |
|---|---|
| Jour 1 | API CRUD en mémoire, Express de base, codes HTTP |
| Jour 2 | Architecture modulaire, validation Joi, persistance SQLite |
| Jour 3 | Authentification JWT, rôles, sécurité, documentation |

**Félicitations ! Vous avez construit une API REST complète, sécurisée et prête pour la production. 🎉**

---

*"First, make it work. Then, make it right. Then, make it fast." — Kent Beck*