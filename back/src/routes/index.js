const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const toolController = require('../controllers/toolController');
const configController = require('../controllers/configController');
const { authMiddleware, requirePrivilege } = require('../middleware/auth');

// Auth
router.post('/auth/login', authController.login);
router.get('/auth/me', authMiddleware, authController.me);

// AI Tools
router.get('/tools', authMiddleware, requirePrivilege('AI_Tool_Catalog', 'read'), toolController.getTools);
router.post('/tools', authMiddleware, requirePrivilege('AI_Tool_Maker', 'write'), toolController.createTool);
router.get('/tools/:id', authMiddleware, requirePrivilege('AI_Tool_Execution', 'read'), toolController.getTool);
router.put('/tools/:id', authMiddleware, requirePrivilege('AI_Tool_Maker', 'write'), toolController.updateTool);
router.delete('/tools/:id', authMiddleware, requirePrivilege('AI_Tool_Maker', 'write'), toolController.deleteTool);
router.post('/tools/:id/execute', authMiddleware, requirePrivilege('AI_Tool_Execution', 'excec'), toolController.executeTool);

// Config
router.get('/config', authMiddleware, requirePrivilege('Config', 'read'), configController.getConfig);
router.post('/config', authMiddleware, requirePrivilege('Config', 'write'), configController.saveConfig);

module.exports = router;
