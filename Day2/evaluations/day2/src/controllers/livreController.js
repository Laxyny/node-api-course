const livreService = require('../services/livreService');

async function index(req, res, next) {
  try {
    const livres = await livreService.findAll(req.query);
    res.json(livres);
  } catch (err) {
    next(err);
  }
}

async function show(req, res, next) {
  try {
    const livre = await livreService.findById(req.params.id);
    res.json(livre);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const livre = await livreService.create(req.body);
    res.status(201).json(livre);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const livre = await livreService.update(req.params.id, req.body);
    res.json(livre);
  } catch (err) {
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    await livreService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function emprunter(req, res, next) {
  try {
    const emprunt = await livreService.emprunter(req.params.id, req.user.userId);
    res.status(201).json(emprunt);
  } catch (err) {
    next(err);
  }
}

async function retourner(req, res, next) {
  try {
    const emprunt = await livreService.retourner(req.params.id, req.user.userId);
    res.json(emprunt);
  } catch (err) {
    next(err);
  }
}

module.exports = { index, show, create, update, destroy, emprunter, retourner };
