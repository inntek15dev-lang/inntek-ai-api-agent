const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const toolController = require('../controllers/toolController');
const configController = require('../controllers/configController');
const { authMiddleware, requirePrivilege } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

/**
 * @swagger
 * components:
 *   schemas:
 *     Tool:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *         logo_herramienta:
 *           type: string
 *         training_prompt:
 *           type: string
 *         behavior_prompt:
 *           type: string
 *         response_format:
 *           type: string
 */

// Auth
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/auth/login', authController.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user info
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User found
 */
router.get('/auth/me', authMiddleware, authController.me);

// AI Tools
/**
 * @swagger
 * /tools:
 *   get:
 *     summary: Get all AI Tools
 *     tags: [Tools]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tools
 */
router.get('/tools', authMiddleware, requirePrivilege('AI_Tool_Catalog', 'read'), toolController.getTools);

/**
 * @swagger
 * /tools:
 *   post:
 *     summary: Create a new AI Tool
 *     tags: [Tools]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tool'
 *     responses:
 *       201:
 *         description: Tool created
 */
router.post('/tools', authMiddleware, requirePrivilege('AI_Tool_Maker', 'write'), toolController.createTool);

/**
 * @swagger
 * /tools/{id}:
 *   get:
 *     summary: Get a single tool
 *     tags: [Tools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tool data
 */
router.get('/tools/:id', authMiddleware, requirePrivilege('AI_Tool_Execution', 'read'), toolController.getTool);

/**
 * @swagger
 * /tools/{id}:
 *   put:
 *     summary: Update an AI Tool
 *     tags: [Tools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tool updated
 */
router.put('/tools/:id', authMiddleware, requirePrivilege('AI_Tool_Maker', 'write'), toolController.updateTool);

/**
 * @swagger
 * /tools/{id}:
 *   delete:
 *     summary: Delete an AI Tool
 *     tags: [Tools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tool deleted
 */
router.delete('/tools/:id', authMiddleware, requirePrivilege('AI_Tool_Maker', 'write'), toolController.deleteTool);

/**
 * @swagger
 * /tools/{id}/execute:
 *   post:
 *     summary: Execute an AI Tool
 *     tags: [Tools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *               imagen:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Execution result
 */
router.post('/tools/:id/execute', authMiddleware, requirePrivilege('AI_Tool_Execution', 'exec'), upload.single('imagen'), toolController.executeTool);

// Config
/**
 * @swagger
 * /config:
 *   get:
 *     summary: Get system configuration
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Config data
 */
router.get('/config', authMiddleware, requirePrivilege('Config', 'read'), configController.getConfig);

/**
 * @swagger
 * /config:
 *   post:
 *     summary: Save system configuration
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Config saved
 */
router.post('/config', authMiddleware, requirePrivilege('Config', 'write'), configController.saveConfig);

module.exports = router;
