## Évaluation Jour 2 — Projet fil-rouge

> Votre travail doit se trouver dans `evaluations/day2/` de votre fork.

---

### Contexte — Suite de l'API bibliothèque

Vous allez enrichir l'API du Jour 1 avec une **vraie base de données (SQLite + Prisma)**, un système d'**authentification JWT** et des règles d'**autorisation** par rôle.

---

### Objectifs pédagogiques évalués

- Configurer Prisma avec SQLite
- Implémenter inscription / connexion avec JWT + bcrypt
- Protéger des routes avec des middlewares d'authentification
- Valider les données entrantes avec Zod
- Appliquer l'architecture Controller / Service

---

### Cahier des charges

#### Schéma Prisma à implémenter

```prisma
model User {
  id        Int       @id @default(autoincrement())
  nom       String
  email     String    @unique
  password  String
  role      String    @default("user")  // "user" | "admin"
  createdAt DateTime  @default(now())
  emprunts  Emprunt[]
}

model Livre {
  id         Int       @id @default(autoincrement())
  titre      String
  auteur     String
  annee      Int?
  genre      String?
  disponible Boolean   @default(true)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  emprunts   Emprunt[]
}

model Emprunt {
  id          Int       @id @default(autoincrement())
  livreId     Int
  userId      Int
  dateEmprunt DateTime  @default(now())
  dateRetour  DateTime?
  livre       Livre     @relation(fields: [livreId], references: [id])
  user        User      @relation(fields: [userId], references: [id])
}
```

#### Endpoints à implémenter

| N° | Méthode | URL | Auth | Description |
|----|---------|-----|------|-------------|
| 1 | POST | `/api/auth/register` | ✗ | Créer un compte |
| 2 | POST | `/api/auth/login` | ✗ | Connexion → token JWT |
| 3 | GET | `/api/auth/me` | ✓ user | Profil connecté |
| 4 | GET | `/api/livres` | ✗ | Liste des livres |
| 5 | GET | `/api/livres/:id` | ✗ | Détail d'un livre |
| 6 | POST | `/api/livres` | ✓ user | Ajouter un livre |
| 7 | PUT | `/api/livres/:id` | ✓ user | Modifier un livre |
| 8 | DELETE | `/api/livres/:id` | ✓ admin | Supprimer (admin only) |
| 9 | POST | `/api/livres/:id/emprunter` | ✓ user | Emprunter un livre |
| 10 | POST | `/api/livres/:id/retourner` | ✓ user | Retourner un livre |

---

### Critères d'évaluation détaillés

> **Note totale : /20**

---

#### Section 1 — Base de données et Prisma `/4`

```
COPILOT_EVAL_SECTION_1: Prisma et base de données
Vérifier dans evaluations/day2/ :
- prisma/schema.prisma contient les modèles User, Livre, Emprunt avec les bons champs → 2 points
  (User: id, nom, email, password, role, createdAt)
  (Livre: id, titre, auteur, annee, genre, disponible, createdAt, updatedAt)
  (Emprunt: id, livreId, userId, dateEmprunt, dateRetour + relations)
- Migration appliquée (présence de prisma/migrations/ ou dev.db) → 0.5 point
- src/db/prisma.js exporte une instance PrismaClient → 0.5 point
- .env.example présent et commité (DATABASE_URL + JWT_SECRET) → 1 point
SCORE_SECTION_1: /4
```

---

#### Section 2 — Authentification JWT `/5`

```
COPILOT_EVAL_SECTION_2: Authentification
Vérifier dans evaluations/day2/src/ :
- POST /api/auth/register : hash bcrypt du password (cost >= 10), retourne {user, token} avec status 201 → 1.5 point
- POST /api/auth/register : retourne 409 si email déjà utilisé → 0.5 point
- POST /api/auth/login : retourne {user, token} si credentials valides → 1 point
- POST /api/auth/login : retourne 401 si email ou password incorrect (même message pour les 2 cas) → 0.5 point
- GET /api/auth/me : retourne le profil user (sans le password) avec token valide → 1 point
- Validation Zod sur register (email valide, password >= 8 chars) → 0.5 point
SCORE_SECTION_2: /5
```

---

#### Section 3 — Middlewares d'authentification et d'autorisation `/4`

```
COPILOT_EVAL_SECTION_3: Middlewares
Vérifier dans evaluations/day2/src/middlewares/ :
- authenticate.js : extrait le token du header "Authorization: Bearer <token>", retourne 401 si absent ou invalide → 1.5 point
- authenticate.js : retourne 401 avec message "Token expiré" si le token est expiré (TokenExpiredError) → 0.5 point
- authorize.js (ou équivalent) : refuse avec 403 si le rôle user ne correspond pas → 1 point
- DELETE /api/livres/:id retourne 403 pour un user avec role "user" (non admin) → 1 point
SCORE_SECTION_3: /4
```

---

#### Section 4 — Logique métier emprunts `/4`

```
COPILOT_EVAL_SECTION_4: Logique métier
Vérifier dans evaluations/day2/src/ :
- POST /api/livres/:id/emprunter : retourne 409 si le livre n'est pas disponible → 1 point
- POST /api/livres/:id/emprunter : met disponible à false et crée un Emprunt → 1.5 point
- POST /api/livres/:id/retourner : met disponible à true et remplit dateRetour → 1 point
- Utilisation d'une transaction Prisma ($transaction) pour l'emprunt ou le retour → 0.5 point
SCORE_SECTION_4: /4
```

---

#### Section 5 — Qualité du code et architecture `/3`

```
COPILOT_EVAL_SECTION_5: Qualité et architecture
Vérifier dans evaluations/day2/ :
- Architecture en couches respectée (routes/ controllers/ services/ ou équivalent) → 1 point
- Validation Zod sur POST /api/livres (titre et auteur obligatoires) → 0.5 point
- Middleware de gestion d'erreurs global (4 paramètres) qui formate proprement les erreurs → 0.5 point
- BONUS: Seeder Prisma (npx prisma db seed) avec des données initiales (livres + user admin) → 1 point
SCORE_SECTION_5: /3
```

---

### Démarrage du projet

```bash
cd evaluations/day2
npm init -y
npm install express dotenv @prisma/client bcryptjs jsonwebtoken zod
npm install --save-dev prisma nodemon

# Initialiser Prisma
npx prisma init --datasource-provider sqlite

# Après avoir écrit le schema.prisma :
npx prisma migrate dev --name init
npx prisma generate

# Démarrer
npm run dev
```

### Rendu

```bash
git add evaluations/day2/
git commit -m "Jour 2 : API bibliothèque - Auth JWT + Prisma + Emprunts"
git push origin main
```

> ⚠️ **Ne pas commiter** : `node_modules/`, `.env`, `prisma/dev.db`
> **Commiter** : `prisma/schema.prisma`, `prisma/migrations/`, `.env.example`

---