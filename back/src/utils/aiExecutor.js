/**
 * Shared AI Execution Utility
 * Extracted from toolController.js to be reused by machineController.js
 */
const { Tool, JsonSchema, AiProvider } = require('../models');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

const fileToGenerativePart = (path, mimeType) => ({
    inlineData: {
        data: Buffer.from(fs.readFileSync(path)).toString('base64'),
        mimeType
    },
});

const cleanSchema = (schema) => {
    if (!schema || typeof schema !== 'object') return schema;
    const cleaned = { ...schema };

    if (Array.isArray(cleaned.type)) cleaned.type = cleaned.type[0];
    if (cleaned.enum && (!cleaned.type || cleaned.type !== 'string')) cleaned.type = 'string';

    const unsupported = ['$schema', '$ref', 'definitions', '$id', 'additionalProperties', 'default', 'examples', 'title', 'description', 'format'];
    unsupported.forEach(key => delete cleaned[key]);

    if (cleaned.properties) {
        const cleanedProps = {};
        for (const [key, value] of Object.entries(cleaned.properties)) {
            cleanedProps[key] = cleanSchema(value);
        }
        cleaned.properties = cleanedProps;
    }
    if (cleaned.items) cleaned.items = cleanSchema(cleaned.items);
    return cleaned;
};

const sanitizeResponse = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
};

const SUPPORTED_MIME_TYPES = [
    'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
    'application/pdf', 'text/plain', 'text/javascript', 'text/python',
    'text/x-python', 'text/markdown', 'text/html', 'text/css', 'text/csv'
];

// ═══════════════════════════════════════════════════════════════
// Provider Strategies
// ═══════════════════════════════════════════════════════════════

const executeGoogleNative = async (provider, fullTextPrompt, promptParts, generationConfig) => {
    const genAI = new GoogleGenerativeAI(provider.api_key);
    const model = genAI.getGenerativeModel({ model: provider.modelo, generationConfig });
    const result = await model.generateContent(promptParts);
    const response = await result.response;
    return response.text();
};

const executeOpenAICompatible = async (provider, fullTextPrompt, file) => {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.api_key}`,
    };

    if (provider.extra_headers) {
        try {
            const extra = JSON.parse(provider.extra_headers);
            Object.assign(headers, extra);
        } catch (e) { /* ignore */ }
    }

    const userContent = [{ type: 'text', text: fullTextPrompt }];

    if (file) {
        const base64 = Buffer.from(fs.readFileSync(file.path)).toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64}`;
        userContent.push({ type: 'image_url', image_url: { url: dataUrl } });
    }

    const body = {
        model: provider.modelo,
        messages: [{ role: 'user', content: userContent }],
    };

    const url = `${provider.base_url}/chat/completions`;
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });

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
// Resolve Provider
// ═══════════════════════════════════════════════════════════════

/**
 * Resolve the AI provider for a tool: tool-specific override → system default
 */
const resolveProvider = async (tool) => {
    let provider = tool.AiProvider;
    if (!provider) {
        provider = await AiProvider.findOne({ where: { is_default: true, activo: true } });
    }
    if (!provider) throw new Error('No AI provider configured. Go to Config → AI Providers to set one up.');
    if (!provider.api_key) throw new Error(`AI Provider "${provider.nombre}" has no API key configured.`);
    return provider;
};

// ═══════════════════════════════════════════════════════════════
// Execute a single Tool
// ═══════════════════════════════════════════════════════════════

/**
 * Execute a single AI Tool with a text prompt and optional file.
 * @param {object} tool - Tool model instance (with JsonSchema and AiProvider eager-loaded)
 * @param {string} promptText - The user/pipeline input text
 * @param {object|null} file - Optional Multer file object { path, mimetype }
 * @returns {{ response: any, provider: { nombre, modelo } }}
 */
const executeSingleTool = async (tool, promptText, file = null) => {
    const provider = await resolveProvider(tool);

    // Generation config for Google
    const generationConfig = {};
    if (tool.JsonSchema) {
        generationConfig.responseMimeType = 'application/json';
        try {
            const rawSchema = JSON.parse(tool.JsonSchema.schema);
            generationConfig.responseSchema = cleanSchema(rawSchema);
        } catch (e) {
            console.warn('Invalid JSON Schema, falling back to basic prompt constraint.');
        }
    }

    // Build full prompt
    let fullTextPrompt = `
SYSTEM TRAINING:
${tool.training_prompt}

BEHAVIOR PROTOCOL:
${tool.behavior_prompt}

USER INSTRUCTION:
${promptText || 'Analyze the attached content.'}
`.trim();

    if (tool.JsonSchema) {
        fullTextPrompt += `\n\nCRITICAL: Respond strictly following this JSON Schema structure:\n${tool.JsonSchema.schema}`;
    } else {
        fullTextPrompt += `\n\nRESPONSE FORMAT:\n${tool.response_format || 'Text'}`;
    }

    // Validate file MIME
    if (file && !SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
        throw new Error(`Unsupported file type: ${file.mimetype}`);
    }

    let text;
    if (provider.tipo === 'google_native') {
        const promptParts = [fullTextPrompt];
        if (file) promptParts.push(fileToGenerativePart(file.path, file.mimetype));
        text = await executeGoogleNative(provider, fullTextPrompt, promptParts, generationConfig);
    } else {
        text = await executeOpenAICompatible(provider, fullTextPrompt, file || null);
    }

    text = sanitizeResponse(text);

    let responseData;
    try {
        responseData = tool.JsonSchema ? JSON.parse(text) : text;
    } catch (e) {
        responseData = text;
    }

    return {
        response: responseData,
        provider: { nombre: provider.nombre, modelo: provider.modelo }
    };
};

module.exports = {
    executeSingleTool,
    resolveProvider,
    sanitizeResponse,
    cleanSchema,
    SUPPORTED_MIME_TYPES
};
