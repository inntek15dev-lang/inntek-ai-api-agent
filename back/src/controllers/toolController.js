const { Tool, JsonSchema, OutputFormat, AiProvider } = require('../models');
const { GoogleGenerativeAI } = require('@google/generative-ai');
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

    if (Array.isArray(cleaned.type)) {
        cleaned.type = cleaned.type[0];
    }

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

// Sanitize AI response: strip markdown code fences
const sanitizeResponse = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
};

// Supported MIME types for multimodal uploads
const SUPPORTED_MIME_TYPES = [
    'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
    'application/pdf', 'text/plain', 'text/javascript', 'text/python',
    'text/x-python', 'text/markdown', 'text/html', 'text/css', 'text/csv'
];

// ═══════════════════════════════════════════════════════════════
// Provider Execution Strategies
// ═══════════════════════════════════════════════════════════════

/**
 * Execute via Google Gemini Native SDK
 */
const executeGoogleNative = async (provider, fullTextPrompt, promptParts, generationConfig) => {
    const genAI = new GoogleGenerativeAI(provider.api_key);
    const model = genAI.getGenerativeModel({
        model: provider.modelo,
        generationConfig
    });

    const result = await model.generateContent(promptParts);
    const response = await result.response;
    return response.text();
};

/**
 * Execute via OpenAI-compatible API (OpenRouter, Groq, Together, Ollama, etc.)
 */
const executeOpenAICompatible = async (provider, fullTextPrompt, file) => {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.api_key}`,
    };

    // Merge extra headers if present
    if (provider.extra_headers) {
        try {
            const extra = JSON.parse(provider.extra_headers);
            Object.assign(headers, extra);
        } catch (e) { /* ignore parse errors */ }
    }

    // Build messages array
    const messages = [];
    const userContent = [];

    // Add text content
    userContent.push({ type: 'text', text: fullTextPrompt });

    // Add image content if file present (base64 inline for OpenAI vision API format)
    if (file) {
        const base64 = Buffer.from(fs.readFileSync(file.path)).toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64}`;
        userContent.push({
            type: 'image_url',
            image_url: { url: dataUrl }
        });
    }

    messages.push({ role: 'user', content: userContent });

    const body = {
        model: provider.modelo,
        messages,
    };

    const url = `${provider.base_url}/chat/completions`;
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Provider API error (${response.status}): ${errorData}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices.length || !data.choices[0].message) {
        throw new Error(`Unexpected provider response structure: ${JSON.stringify(data).substring(0, 300)}`);
    }

    return data.choices[0].message.content;
};

// ═══════════════════════════════════════════════════════════════
// Main Execution Handler
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

        // Resolve provider: Tool-specific → System Default
        let provider = tool.AiProvider;
        if (!provider) {
            provider = await AiProvider.findOne({ where: { is_default: true, activo: true } });
        }
        if (!provider) {
            return res.status(400).json({ success: false, message: 'No AI provider configured. Go to Config → AI Providers to set one up.' });
        }
        if (!provider.api_key) {
            return res.status(400).json({ success: false, message: `AI Provider "${provider.nombre}" has no API key configured. Update it in Config → AI Providers.` });
        }

        // Build generation config for Google providers
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

        // Build the full prompt
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

        // Validate file MIME type if file present
        if (req.file && !SUPPORTED_MIME_TYPES.includes(req.file.mimetype)) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: `Unsupported file type: ${req.file.mimetype}. Supported: Images, PDFs, and Plain Text files.`
            });
        }

        let text;

        if (provider.tipo === 'google_native') {
            // Google Gemini Native SDK
            const promptParts = [fullTextPrompt];
            if (req.file) {
                promptParts.push(fileToGenerativePart(req.file.path, req.file.mimetype));
            }
            text = await executeGoogleNative(provider, fullTextPrompt, promptParts, generationConfig);
        } else {
            // OpenAI-compatible API
            text = await executeOpenAICompatible(provider, fullTextPrompt, req.file || null);
        }

        // Cleanup temp file
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        // Sanitize response: remove markdown code fences from AI output
        text = sanitizeResponse(text);

        // Parse JSON if schema is present
        let responseData;
        try {
            responseData = tool.JsonSchema ? JSON.parse(text) : text;
        } catch (e) {
            responseData = text; // If JSON parse fails, return raw text
        }

        res.json({
            success: true,
            data: {
                response: responseData,
                provider: { nombre: provider.nombre, modelo: provider.modelo }
            }
        });
    } catch (error) {
        console.error('AI Execution Error:', error.message);
        console.error('Stack:', error.stack);

        const isClientError = error.message.includes('400') || error.message.includes('403');
        const status = isClientError ? 400 : 500;

        res.status(status).json({
            success: false,
            message: `Neural Protocol Failed: ${error.message}`
        });
    }
};
