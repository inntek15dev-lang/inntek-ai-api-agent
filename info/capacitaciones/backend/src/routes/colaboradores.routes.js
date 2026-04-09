const express = require('express');
const router = express.Router();
const { 
  getColaboradores, getColaboradorById, 
  createColaborador, updateColaborador, deleteColaborador 
} = require('../controllers/colaboradores.controller');
const { checkPermission } = require('../middleware/rbac.middleware');
const { verifyToken } = require('../middleware/auth.middleware');

/**
 * @route GET /api/v1/colaboradores
 * @desc Get list of collaborators with filters and search
 * @access Protected
 */
router.get('/', verifyToken, getColaboradores);
router.get('/:id', verifyToken, getColaboradorById);

router.post('/', verifyToken, checkPermission('write:colaboradores'), createColaborador);
router.put('/:id', verifyToken, checkPermission('write:colaboradores'), updateColaborador);
router.delete('/:id', verifyToken, checkPermission('write:colaboradores'), deleteColaborador);

module.exports = router;
