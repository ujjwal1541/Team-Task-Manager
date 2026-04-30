const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { updateTask, deleteTask } = require('../controllers/taskController');

router.use(authenticate);

router.put(
  '/:id',
  [
    body('title').optional().trim().isLength({ min: 1 }),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  ],
  updateTask
);

router.delete('/:id', deleteTask);

module.exports = router;
