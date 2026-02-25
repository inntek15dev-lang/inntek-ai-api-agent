const { Tool, JsonSchema, OutputFormat } = require('../models');
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
        const data = { ...req.body };
        if (data.output_format_id === '') data.output_format_id = null;
        if (data.json_schema_id === '') data.json_schema_id = null;

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
                { model: JsonSchema }
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

// Helper to convert file to GoogleGenerativeAI.Part
const fileToGenerativePart = (path, mimeType) => {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
};

// Helper to remove unsupported Gemini JSON Schema keywords
const cleanSchema = (schema) => {
    if (!schema || typeof schema !== 'object') return schema;

    const cleaned = { ...schema };

    // Gemini only supports single types, no arrays like ["string", "null"]
    if (Array.isArray(cleaned.type)) {
        cleaned.type = cleaned.type[0];
    }

    // ENFORCE STRING TYPE FOR ENUMS (Mandatory for Gemini API)
    if (cleaned.enum && (!cleaned.type || cleaned.type !== 'string')) {
        cleaned.type = 'string';
    }

    const unsupported = ['$schema', '$ref', 'definitions', '$id', 'additionalProperties', 'default', 'examples', 'title', 'description', 'format'];

    unsupported.forEach(key => delete cleaned[key]);

    if (cleaned.properties) {
        const cleanedProps = {};
        for (const [key, value] of Object.entries(cleaned.properties)) {
            cleanedProps[key] = cleanSchema(value);
        }
        cleaned.properties = cleanedProps;
    }

    if (cleaned.items) {
        cleaned.items = cleanSchema(cleaned.items);
    }

    return cleaned;
};

exports.executeTool = async (req, res) => {
    try {
        const tool = await Tool.findByPk(req.params.id, {
            include: [{ model: JsonSchema }]
        });

        if (!tool) return res.status(404).json({ success: false, message: 'Tool not found' });

        const generationConfig = {};
        if (tool.JsonSchema) {
            generationConfig.responseMimeType = "application/json";
            try {
                const rawSchema = JSON.parse(tool.JsonSchema.schema);
                generationConfig.responseSchema = cleanSchema(rawSchema);
            } catch (e) {
                console.warn('Invalid JSON Schema in database, falling back to basic prompt constraint.');
            }
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig
        });

        let fullTextPrompt = `
SYSTEM TRAINING:
${tool.training_prompt}

BEHAVIOR PROTOCOL:
${tool.behavior_prompt}

USER INSTRUCTION:
${req.body.prompt || "Analyze the attached content."}
`.trim();

        if (tool.JsonSchema) {
            fullTextPrompt += `\n\nCRITICAL: Respond strictly following this JSON Schema structure:\n${tool.JsonSchema.schema}`;
        } else {
            fullTextPrompt += `\n\nRESPONSE FORMAT:\n${tool.response_format || "Text"}`;
        }

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
                response: tool.JsonSchema ? JSON.parse(text) : text
            }
        });
    } catch (error) {
        console.error('Gemini Execution Error:', error.message);
        // Do not leak internal error details to the client
        res.status(500).json({
            success: false,
            message: 'Neural Processing Failure. Please check system logs for audit trail.'
        });
    }
};
