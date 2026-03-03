const { Tool, JsonSchema, OutputFormat, AiProvider } = require('../models');
const { executeSingleTool } = require('../utils/aiExecutor');
const fs = require('fs');

exports.getTools = async (req, res) => {
    try {
        const tools = await Tool.findAll({
            include: [{ model: AiProvider, attributes: ['id', 'nombre', 'slug'] }]
        });
        res.json({ success: true, data: tools });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createTool = async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.output_format_id === '') data.output_format_id = null;
        if (data.json_schema_id === '') data.json_schema_id = null;
        if (data.ai_provider_id === '') data.ai_provider_id = null;

        const tool = await Tool.create(data);
        res.json({ success: true, data: tool });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTool = async (req, res) => {
    try {
        const tool = await Tool.findByPk(req.params.id, {
            include: [
                { model: OutputFormat },
                { model: JsonSchema },
                { model: AiProvider, attributes: ['id', 'nombre', 'slug', 'modelo'] }
            ]
        });
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

        const data = { ...req.body };
        if (data.output_format_id === '') data.output_format_id = null;
        if (data.json_schema_id === '') data.json_schema_id = null;
        if (data.ai_provider_id === '') data.ai_provider_id = null;

        await tool.update(data);
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

// ═══════════════════════════════════════════════════════════════
// Main Execution Handler (delegates to shared aiExecutor)
// ═══════════════════════════════════════════════════════════════

exports.executeTool = async (req, res) => {
    try {
        const tool = await Tool.findByPk(req.params.id, {
            include: [
                { model: JsonSchema },
                { model: AiProvider }
            ]
        });

        if (!tool) return res.status(404).json({ success: false, message: 'Tool not found' });

        const result = await executeSingleTool(tool, req.body.prompt, req.file || null);

        // Cleanup temp file
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
        }

        res.json({
            success: true,
            data: {
                response: result.response,
                provider: result.provider
            }
        });
    } catch (error) {
        // Cleanup temp file on error
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
        }

        console.error('AI Execution Error:', error.message);
        const isClientError = error.message.includes('400') || error.message.includes('403');
        const status = isClientError ? 400 : 500;

        res.status(status).json({
            success: false,
            message: `Neural Protocol Failed: ${error.message}`
        });
    }
};
