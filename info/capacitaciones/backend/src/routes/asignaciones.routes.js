const express = require('express');
const router = express.Router();
const { updateAsignacion, syncData } = require('../controllers/asignaciones.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/rbac.middleware');

/**
 * @route PATCH /api/v1/asignaciones/:id
 * @desc Update assignment status or percentage
 * @access Protected (Admin/SuperAdmin)
 */
router.patch('/:id', verifyToken, checkPermission('write:asignaciones'), updateAsignacion);

/**
 * @route POST /api/v1/asignaciones/sync
 * @desc Bulk sync assignments from JSON source
 * @access Protected (SuperAdmin)
 */
router.post('/sync', verifyToken, checkPermission('all:all'), syncData);

module.exports = router;
