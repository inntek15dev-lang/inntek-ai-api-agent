const { Tool } = require('../models');

exports.getTools = async (req, res) => {
    try {
        const tools = await Tool.findAll();
        res.json({ success: true, data: tools });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createTool = async (req, res) => {
    try {
        const tool = await Tool.create(req.body);
        res.json({ success: true, data: tool });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTool = async (req, res) => {
    try {
        const tool = await Tool.findByPk(req.params.id);
        if (!tool) return res.status(404).json({ success: false, message: 'Tool not found' });
        res.json({ success: true, data: tool });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateTool = async (req, res) => {
    try {
        const tool = await Tool.findByPk(req.params.id);
        if (!tool) return res.status(404).json({ success: false, message: 'Tool not found' });
        await tool.update(req.body);
        res.json({ success: true, data: tool });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteTool = async (req, res) => {
    try {
        const tool = await Tool.findByPk(req.params.id);
        if (!tool) return res.status(404).json({ success: false, message: 'Tool not found' });
        await tool.destroy();
        res.json({ success: true, message: 'Tool deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.executeTool = async (req, res) => {
    // This will eventually call Gemini. For now, it's a mock.
    try {
        const tool = await Tool.findByPk(req.params.id);
        if (!tool) return res.status(404).json({ success: false, message: 'Tool not found' });

        res.json({
            success: true,
            data: {
                response: `[Simulación IA] Herramienta "${tool.nombre}" procesando: ${req.body.prompt || 'Sin prompt'}.`
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
