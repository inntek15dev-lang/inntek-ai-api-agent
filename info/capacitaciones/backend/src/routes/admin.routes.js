const express = require('express');
const router = express.Router();
const { 
  getServicios, createServicio, updateServicio, deleteServicio,
  getCursos, createCurso, updateCurso, deleteCurso
} = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/rbac.middleware');

// Servicios CRUD
router.get('/servicios', verifyToken, checkPermission('read:all'), getServicios);
router.post('/servicios', verifyToken, checkPermission('all:all'), createServicio);
router.put('/servicios/:id', verifyToken, checkPermission('all:all'), updateServicio);
router.delete('/servicios/:id', verifyToken, checkPermission('all:all'), deleteServicio);

// Cursos CRUD
router.get('/cursos', verifyToken, checkPermission('read:all'), getCursos);
router.post('/cursos', verifyToken, checkPermission('all:all'), createCurso);
router.put('/cursos/:id', verifyToken, checkPermission('all:all'), updateCurso);
router.delete('/cursos/:id', verifyToken, checkPermission('all:all'), deleteCurso);

module.exports = router;
