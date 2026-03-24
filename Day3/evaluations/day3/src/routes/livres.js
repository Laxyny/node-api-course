const express = require('express');
const router = express.Router();
const livresController = require('../controllers/livresController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { livreCreateSchema, livreUpdateSchema } = require('../validators/livreValidator');

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
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filtrer par genre
 *     responses:
 *       200:
 *         description: Liste des livres
 */
router.get('/', livresController.getAll);

/**
 * @swagger
 * /api/livres/{id}:
 *   get:
 *     summary: Récupérer un livre par ID
 *     tags: [Livres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Le livre
 *       404:
 *         description: Livre introuvable
 */
router.get('/:id', livresController.getById);

/**
 * @swagger
 * /api/livres:
 *   post:
 *     summary: Ajouter un livre
 *     tags: [Livres]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titre, auteur]
 *             properties:
 *               titre:
 *                 type: string
 *               auteur:
 *                 type: string
 *               annee:
 *                 type: integer
 *               genre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Livre créé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 */
router.post('/', authenticate, validate(livreCreateSchema), livresController.create);

/**
 * @swagger
 * /api/livres/{id}:
 *   put:
 *     summary: Modifier un livre
 *     tags: [Livres]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre:
 *                 type: string
 *               auteur:
 *                 type: string
 *               annee:
 *                 type: integer
 *               genre:
 *                 type: string
 *               disponible:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Livre modifié
 *       401:
 *         description: Token manquant ou invalide
 *       404:
 *         description: Livre introuvable
 */
router.put('/:id', authenticate, validate(livreUpdateSchema), livresController.update);

/**
 * @swagger
 * /api/livres/{id}:
 *   delete:
 *     summary: Supprimer un livre (admin uniquement)
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
 *         description: Supprimé avec succès
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Droits insuffisants — admin requis
 *       404:
 *         description: Livre introuvable
 */
router.delete('/:id', authenticate, authorize('admin'), livresController.remove);

module.exports = router;
