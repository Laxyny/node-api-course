## Évaluation Jour 1 — Projet fil-rouge (noté sur 20)

> **Durée : 2 heures** | Travaillez dans le dossier `evaluation-day1/`

---

### Contexte du projet fil-rouge

Vous allez construire **"LibraryAPI"** — une API de gestion de livres qui évoluera sur les 3 jours. Aujourd'hui, vous posez les fondations : un serveur HTTP **sans framework**, avec persistance JSON.

---

### Instructions

#### Mise en place (non notée)

```bash
mkdir evaluation-day1 && cd evaluation-day1
npm init -y
```

Créez un fichier `db.json` initial :

```json
{
  "books": [
    { "id": 1, "title": "Clean Code", "author": "Robert C. Martin", "year": 2008, "available": true },
    { "id": 2, "title": "The Pragmatic Programmer", "author": "Hunt & Thomas", "year": 1999, "available": true }
  ]
}
```

---

### Section 1 — Architecture et modules (4 points)

**Ce qui est attendu :**

Créez la structure suivante :

```
evaluation-day1/
├── package.json          ← scripts "start" et "dev" configurés
├── .gitignore            ← node_modules/ ignoré
├── db.json               ← données initiales
├── server.js             ← point d'entrée, démarrage sur port 3000
└── modules/
    ├── db.js             ← fonctions readDB() et writeDB()
    └── router.js         ← logique de routing
```

**Critères de notation :**

- `[ 1 pt ]` Structure de fichiers respectée avec tous les fichiers présents
- `[ 1 pt ]` `db.js` exporte correctement `readDB()` et `writeDB()` (async/await)
- `[ 1 pt ]` `server.js` importe et utilise `router.js` (séparation des responsabilités)
- `[ 1 pt ]` `.gitignore` présent et `node_modules/` absent du repo

---

### Section 2 — Routes GET (5 points)

**Ce qui est attendu :**

Implémentez ces deux routes dans `router.js` :

**`GET /books`** — Retourne la liste complète des livres

Réponse attendue (200) :
```json
{
  "success": true,
  "count": 2,
  "data": [
    { "id": 1, "title": "Clean Code", "author": "Robert C. Martin", "year": 2008, "available": true },
    { "id": 2, "title": "The Pragmatic Programmer", "author": "Hunt & Thomas", "year": 1999, "available": true }
  ]
}
```

**`GET /books/:id`** — Retourne un livre par son ID

L'URL `/books/1` doit retourner le livre avec l'id `1`.

Réponse si trouvé (200) :
```json
{ "success": true, "data": { "id": 1, "title": "Clean Code", ... } }
```

Réponse si non trouvé (404) :
```json
{ "success": false, "error": "Livre introuvable" }
```

**Critères de notation :**

- `[ 2 pts ]` `GET /books` retourne tous les livres avec la structure `{ success, count, data }`
- `[ 2 pts ]` `GET /books/:id` parse correctement l'ID depuis l'URL et retourne le bon livre
- `[ 1 pt ]`  `GET /books/:id` retourne un 404 avec message d'erreur si l'ID n'existe pas

---

### Section 3 — Route POST (5 points)

**Ce qui est attendu :**

**`POST /books`** — Ajoute un nouveau livre

Corps de la requête attendu :
```json
{ "title": "Node.js Design Patterns", "author": "Mario Casciaro", "year": 2020 }
```

Réponse si succès (201) :
```json
{
  "success": true,
  "data": { "id": 3, "title": "Node.js Design Patterns", "author": "Mario Casciaro", "year": 2020, "available": true }
}
```

Réponse si champs manquants (400) :
```json
{ "success": false, "error": "Les champs title, author et year sont requis" }
```

**Critères de notation :**

- `[ 1 pt ]`  Le corps de la requête est lu correctement via les événements `data` / `end`
- `[ 1 pt ]`  L'ID est auto-incrémenté (id = max(ids) + 1)
- `[ 1 pt ]`  `available` est initialisé à `true` automatiquement
- `[ 1 pt ]`  Le livre est sauvegardé dans `db.json` (persistance réelle)
- `[ 1 pt ]`  Validation : retourne 400 si `title`, `author` ou `year` est absent

---

### Section 4 — Gestion des erreurs et qualité (4 points)

**Ce qui est attendu :**

- Toute route inconnue retourne un **404** avec `{ "success": false, "error": "Route non trouvée" }`
- Les erreurs serveur (exceptions non gérées) retournent un **500** propre avec `{ "success": false, "error": "Erreur interne" }` (utilisez try/catch dans le router)
- Le Content-Type de toutes les réponses est `application/json`
- Le serveur affiche dans le terminal chaque requête : `[2024-01-15T10:30:00.000Z] GET /books → 200`

**Critères de notation :**

- `[ 1 pt ]`  Route 404 par défaut correctement implémentée
- `[ 1 pt ]`  try/catch autour de la logique de routing, erreur 500 propre
- `[ 1 pt ]`  `Content-Type: application/json` présent sur toutes les réponses
- `[ 1 pt ]`  Log de chaque requête avec méthode, URL, code de réponse et timestamp

---

### Section 5 — Bonus (2 points, non obligatoire)

- `[ 1 pt ]`  `DELETE /books/:id` — Supprime un livre par ID, retourne 404 si absent
- `[ 1 pt ]`  `GET /books?available=true` — Filtrage par disponibilité via query string

---

### 🚀 Comment tester votre API

```bash
# Démarrer le serveur
npm start

# Lister tous les livres
curl http://localhost:3000/books

# Récupérer un livre par ID
curl http://localhost:3000/books/1

# Ajouter un livre
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Node.js Deep Dive","author":"Dupont","year":2024}'

# Route inexistante
curl http://localhost:3000/unknown
```

---

### Checklist avant de soumettre

- [ ] `npm start` lance le serveur sans erreur
- [ ] `db.json` est modifié après un POST (persistance vérifiable)
- [ ] Toutes les routes retournent du JSON valide
- [ ] `node_modules/` absent du commit
- [ ] Le code est dans `evaluation-day1/`

```bash
git add evaluation-day1/
git commit -m "Evaluation Jour 1 - [Votre Nom]"
git push origin main
```
