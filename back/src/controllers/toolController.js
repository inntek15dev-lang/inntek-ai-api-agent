const { Tool } = require('../models');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// Helper to convert file to GoogleGenerativeAI.Part
const fileToGenerativePart = (path, mimeType) => {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
};

exports.executeTool = async (req, res) => {
    try {
        const tool = await Tool.findByPk(req.params.id);
        if (!tool) return res.status(404).json({ success: false, message: 'Tool not found' });

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const fullTextPrompt = `
SYSTEM TRAINING:
${tool.training_prompt}

BEHAVIOR PROTOCOL:
${tool.behavior_prompt}

USER INSTRUCTION:
${req.body.prompt || "Analyze the attached content."}

RESPONSE FORMAT:
${tool.response_format || "Text"}
`.trim();

        const promptParts = [fullTextPrompt];

        // Handle multimodal file if present
        if (req.file) {
            promptParts.push(fileToGenerativePart(req.file.path, req.file.mimetype));
        }

        const result = await model.generateContent(promptParts);
        const response = await result.response;
        const text = response.text();

        // Cleanup temp file
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.json({
            success: true,
            data: {
                response: text
            }
        });
    } catch (error) {
        console.error('Gemini Execution Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
