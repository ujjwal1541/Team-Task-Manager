const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate, requireProjectRole } = require('../middleware/auth');
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { getTasks, createTask } = require('../controllers/taskController');

router.use(authenticate);

router.get('/', getProjects);
router.post(
  '/',
  [body('name').trim().isLength({ min: 1 }).withMessage('Project name required')],
  createProject
);

router.get('/:id', getProject);

router.put(
  '/:id',
  requireProjectRole(['ADMIN']),
  [body('name').optional().trim().isLength({ min: 1 })],
  updateProject
);

router.delete('/:id', requireProjectRole(['ADMIN']), deleteProject);

router.post(
  '/:id/members',
  requireProjectRole(['ADMIN']),
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('role').optional().isIn(['ADMIN', 'MEMBER']),
  ],
  addMember
);

router.delete('/:id/members/:userId', requireProjectRole(['ADMIN']), removeMember);

// Task sub-routes
router.get('/:id/tasks', getTasks);
router.post(
  '/:id/tasks',
  requireProjectRole(['ADMIN', 'MEMBER']),
  [body('title').trim().isLength({ min: 1 }).withMessage('Task title required')],
  createTask
);

module.exports = router;
