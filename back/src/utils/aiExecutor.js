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

    const unsupported = ['$schema', '$ref', 'definitions', '$id', 'additionalProperties', 'default', 'examples', 'title', 'description', 'format', 'const', 'pattern'];
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

/**
 * Resolves @file and @data markers in prompt text.
 * Replaces markers with explicit source labels so the AI can distinguish
 * between data coming from the attached file(s) and from the text input.
 * If markers are detected, appends a contextual data block at the end.
 */
const resolveSourceMarkers = (promptText, userInputText, hasFiles) => {
    if (!promptText || typeof promptText !== 'string') return promptText;

    const hasFileMarker = /@file/gi.test(promptText);
    const hasDataMarker = /@data/gi.test(promptText);

    if (!hasFileMarker && !hasDataMarker) return promptText;

    // Replace markers with explicit labels
    let resolved = promptText
        .replace(/@file/gi, '[FUENTE: ARCHIVO ADJUNTO]')
        .replace(/@data/gi, '[FUENTE: INPUT DE TEXTO]');

    // Append contextual blocks
    if (hasDataMarker && userInputText) {
        resolved += `\n\n─────── DATOS DE TEXTO (@data) ───────\n${userInputText}\n───────────────────────────────────────`;
    }

    if (hasFileMarker && !hasFiles) {
        resolved += `\n\n⚠️ NOTA: Se referencia @file pero no se adjuntó ningún archivo en esta ejecución.`;
    }

    return resolved;
};

const SUPPORTED_MIME_TYPES = [
    'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
    'application/pdf', 'text/plain', 'text/javascript', 'text/python',
    'text/x-python', 'text/markdown', 'text/html', 'text/css', 'text/csv'
];

// ═══════════════════════════════════════════════════════════════
// Provider Strategies
// ═══════════════════════════════════════════════════════════════

const executeGoogleNative = async (provider, fullTextPrompt, promptParts, generationConfig, overrideModel = null, overrideApiKey = null) => {
    const modelName = overrideModel || provider.modelo;
    const apiKey = (overrideApiKey || provider.api_key || '').trim();

    // Hardening: Ensure we don't send a masked key to the provider
    if (apiKey.includes('•') || apiKey.includes('*')) {
        throw new Error(`Critical Security Fault: Provider "${provider.nombre}" is using a masked API key. Please re-enter the cleartext API key in Config → AI Providers.`);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
    const result = await model.generateContent(promptParts);
    const response = await result.response;
    return response.text();
};

const executeOpenAICompatible = async (provider, fullTextPrompt, filesArray, overrideModel = null, overrideApiKey = null) => {
    const modelName = overrideModel || provider.modelo;
    const apiKey = (overrideApiKey || provider.api_key || '').trim();

    // Hardening: Ensure we don't send a masked key to the provider
    if (apiKey.includes('•') || apiKey.includes('*')) {
        throw new Error(`Critical Security Fault: Provider "${provider.nombre}" is using a masked API key. Please re-enter the cleartext API key in Config → AI Providers.`);
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    };

    if (provider.extra_headers) {
        try {
            const extra = JSON.parse(provider.extra_headers);
            Object.assign(headers, extra);
        } catch (e) { /* ignore */ }
    }

    const userContent = [{ type: 'text', text: fullTextPrompt }];

    // Handle files if strictly needed (some OpenAI providers don't support this format)
    let processedPrompt = fullTextPrompt;
    if (filesArray && filesArray.length > 0) {
        filesArray.forEach(file => {
            if (file.mimetype.startsWith('image/')) {
                const base64 = Buffer.from(fs.readFileSync(file.path)).toString('base64');
                const dataUrl = `data:${file.mimetype};base64,${base64}`;
                userContent.push({ type: 'image_url', image_url: { url: dataUrl } });
            } else {
                processedPrompt += `\n\n[ARCHIVO ADJUNTO ADICIONAL: ${file.originalname} (${file.mimetype})]`;
            }
        });
        userContent[0].text = processedPrompt;
    }

    const body = {
        model: modelName,
        messages: [{ role: 'user', content: userContent }],
    };

    const url = `${provider.base_url}/chat/completions`;
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });

    if (!response.ok) {
        const errorData = await response.text();
        const error = new Error(`Provider API error (${response.status}): ${errorData}`);
        error.status = response.status;
        throw error;
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
 * Execute a single AI Tool with a text prompt and optional file(s).
 * @param {object} tool - Tool model instance (with JsonSchema and AiProvider eager-loaded)
 * @param {string} promptText - The user/pipeline input text
 * @param {object|array|null} files - Optional Multer file(s)
 * @returns {{ response: any, provider: { nombre, modelo } }}
 */
const executeSingleTool = async (tool, promptText, files = null) => {
    const provider = await resolveProvider(tool);

    // Normalize files to array
    const filesArray = Array.isArray(files) ? files : (files ? [files] : []);

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
    const hasFiles = filesArray.length > 0;
    const inputData = promptText || (hasFiles ? 'Analyze the attached content.' : 'Execute and generate output based on your training and behavior protocols.');

    // Resolve @file/@data markers in training and behavior prompts
    const resolvedTraining = resolveSourceMarkers(tool.training_prompt, promptText, hasFiles);
    const resolvedBehavior = resolveSourceMarkers(tool.behavior_prompt, promptText, hasFiles);

    let fullTextPrompt = `
SYSTEM TRAINING:
${resolvedTraining}

BEHAVIOR PROTOCOL:
${resolvedBehavior}

#inputData#:{
${inputData}
}
`.trim();

    if (tool.JsonSchema) {
        fullTextPrompt += `\n\nCRITICAL: Respond strictly following this JSON Schema structure:\n${tool.JsonSchema.schema}`;
    } else {
        fullTextPrompt += `\n\nRESPONSE FORMAT:\n${tool.response_format || 'Text'}`;
    }

    // Validate files MIME
    filesArray.forEach(f => {
        if (!SUPPORTED_MIME_TYPES.includes(f.mimetype)) {
            throw new Error(`Unsupported file type: ${f.mimetype} (${f.originalname || 'unknown'})`);
        }
    });

    /**
     * Retry Strategy (1-6)
     * 1. Primary Model + Primary Key
     * 2. Secondary Model + Primary Key
     * 3. Tertiary Model + Primary Key
     * 4. Primary Model + Retry Key
     * 5. Secondary Model + Retry Key
     * 6. Tertiary Model + Retry Key
     */
    const retrySteps = [
        { model: provider.modelo, key: provider.api_key, label: 'Primary Model + Primary Key' },
        { model: provider.modelo_secundario, key: provider.api_key, label: 'Secondary Model + Primary Key' },
        { model: provider.modelo_terciario, key: provider.api_key, label: 'Tertiary Model + Primary Key' },
        { model: provider.modelo, key: provider.api_key_retry, label: 'Primary Model + Retry Key' },
        { model: provider.modelo_secundario, key: provider.api_key_retry, label: 'Secondary Model + Retry Key' },
        { model: provider.modelo_terciario, key: provider.api_key_retry, label: 'Tertiary Model + Retry Key' },
    ];

    let lastError = null;
    let successfulResult = null;
    let usedModel = provider.modelo;

    for (const step of retrySteps) {
        // Skip if model or key is not configured for this step
        if (!step.model || !step.key) continue;

        console.log(`[AI-EXECUTOR] Attempting with ${step.label} (${step.model})...`);

        try {
            let text;
            if (provider.tipo === 'google_native') {
                const promptParts = [fullTextPrompt];
                filesArray.forEach(f => {
                    promptParts.push(fileToGenerativePart(f.path, f.mimetype));
                });
                text = await executeGoogleNative(provider, fullTextPrompt, promptParts, generationConfig, step.model, step.key);
            } else {
                text = await executeOpenAICompatible(provider, fullTextPrompt, filesArray, step.model, step.key);
            }

            successfulResult = sanitizeResponse(text);
            usedModel = step.model;
            break; // Success!
        } catch (error) {
            lastError = error;
            console.error(`[AI-EXECUTOR] Failed with ${step.label}:`, error.message);

            // Do not retry on Bad Request (400) or other "client" errors
            if (error.status === 400) {
                console.warn('[AI-EXECUTOR] Stopping retries due to client error (400).');
                break;
            }
            
            // If it's the last step, we give up
            if (step === retrySteps[retrySteps.length - 1]) {
                console.error('[AI-EXECUTOR] All retry steps exhausted.');
            } else {
                console.log('[AI-EXECUTOR] Moving to next retry step...');
            }
        }
    }

    if (!successfulResult) {
        throw lastError || new Error('AI Execution failed after all retries.');
    }

    let responseData;
    try {
        responseData = tool.JsonSchema ? JSON.parse(successfulResult) : successfulResult;
    } catch (e) {
        responseData = successfulResult;
    }

    return {
        response: responseData,
        provider: { nombre: provider.nombre, modelo: usedModel }
    };
};


module.exports = {
    executeSingleTool,
    resolveProvider,
    sanitizeResponse,
    cleanSchema,
    SUPPORTED_MIME_TYPES
};
