const express = require('express');
const router = express.Router();
const livreController = require('../controllers/livreController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { livreCreateSchema, livreUpdateSchema } = require('../validators/livreValidator');

router.get('/', livreController.index);
router.get('/:id', livreController.show);
router.post('/', authenticate, validate(livreCreateSchema), livreController.create);
router.put('/:id', authenticate, validate(livreUpdateSchema), livreController.update);
router.delete('/:id', authenticate, authorize('admin'), livreController.destroy);
router.post('/:id/emprunter', authenticate, livreController.emprunter);
router.post('/:id/retourner', authenticate, livreController.retourner);

module.exports = router;
