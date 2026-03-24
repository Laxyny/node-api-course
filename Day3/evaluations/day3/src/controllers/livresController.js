const livreService = require('../services/livreService');

async function getAll(req, res, next) {
  try {
    const livres = await livreService.findAll(req.query);
    res.json(livres);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const livre = await livreService.findById(req.params.id);
    res.json(livre);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { titre, auteur, annee, genre, disponible } = req.body;
    const livre = await livreService.create({ titre, auteur, annee, genre, disponible });
    res.status(201).json(livre);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { titre, auteur, annee, genre, disponible } = req.body;
    const livre = await livreService.update(req.params.id, { titre, auteur, annee, genre, disponible });
    res.json(livre);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await livreService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
