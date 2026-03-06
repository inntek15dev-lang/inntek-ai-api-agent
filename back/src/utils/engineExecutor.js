/**
 * Engine Executor Utility (PARKO Protocol)
 * Implements engines as pure code functionalities, ensuring zero AI usage for internal engine processing.
 */
const { executeSingleTool } = require('./aiExecutor');

/**
 * Registry of engine functions.
 * Each function receives (node, inputText, parentOutputs, context) and returns a result.
 */
const engines = {
    'list-iterator': async (node, inputText, parentOutputs, context) => {
        const { nodeMap, adjacency } = context;
        let items = inputText;
        if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch (e) { items = [items]; }
        }
        if (!Array.isArray(items) && typeof items === 'object') {
            const arrayKey = Object.keys(items).find(k => Array.isArray(items[k]));
            items = arrayKey ? items[arrayKey] : [items];
        }
        if (!Array.isArray(items)) items = [items];

        const targetIds = adjacency[node.id] || [];
        const nextToolNode = targetIds.map(id => nodeMap[id]).find(n => n.node_type === 'tool' && n.Tool);

        if (nextToolNode) {
            const iterResults = [];
            for (let i = 0; i < items.length; i++) {
                const itemText = typeof items[i] === 'string' ? items[i] : JSON.stringify(items[i]);
                const r = await executeSingleTool(nextToolNode.Tool, itemText);
                iterResults.push(r.response);
            }
            // Return BOTH the results and a signal to skip the next tool node if it was already handled
            return {
                output: iterResults,
                stepInfo: { itemsProcessed: items.length, results: iterResults },
                consumedNodeId: nextToolNode.id,
                consumedOutput: iterResults
            };
        }

        return { output: items, stepInfo: items };
    },

    'list-collector': async (node, inputText, parentOutputs) => {
        const collected = [];
        for (const po of parentOutputs) {
            if (Array.isArray(po)) collected.push(...po);
            else collected.push(po);
        }
        return {
            output: collected,
            stepInfo: { collectedItems: collected.length, data: collected }
        };
    },

    'data-mapper': async (node, inputText, parentOutputs) => {
        if (parentOutputs.length === 1) {
            return { output: parentOutputs[0], stepInfo: parentOutputs[0] };
        }
        const merged = {};
        for (const po of parentOutputs) {
            if (typeof po === 'object' && po !== null && !Array.isArray(po)) {
                Object.assign(merged, po);
            } else if (Array.isArray(po)) {
                merged.data = [...(merged.data || []), ...po];
            } else {
                merged.raw = (merged.raw || '') + '\n' + String(po);
            }
        }
        return { output: merged, stepInfo: merged };
    },

    'api-consumer': async (node, inputText) => {
        let config = {};
        try { config = node.config ? JSON.parse(node.config) : {}; } catch (e) { }

        const method = (config.method || 'GET').toUpperCase();
        const url = config.url;
        if (!url) throw new Error('API Consumer requires a URL configuration.');

        let hdrs = {};
        if (config.headers) {
            try { hdrs = typeof config.headers === 'string' ? JSON.parse(config.headers) : config.headers; }
            catch (e) { }
        }

        const fetchOptions = { method, headers: { ...hdrs } };
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            fetchOptions.body = typeof inputText === 'string' ? inputText : JSON.stringify(inputText);
            if (!fetchOptions.headers['Content-Type']) {
                fetchOptions.headers['Content-Type'] = 'application/json';
            }
        }

        const response = await fetch(url, fetchOptions);
        const respText = await response.text();
        let respData = respText;
        try { respData = JSON.parse(respText); } catch (e) { }

        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${respText}`);
        }

        return { output: respData, stepInfo: respData };
    },

    'printer': async (node, inputText) => {
        let data = inputText;
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) { }
        }

        let printResult = data;
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            const keys = Object.keys(data);
            if (keys.length === 1) {
                printResult = data[keys[0]];
            }
        }
        return { output: printResult, stepInfo: printResult };
    },

    'json-converter': async (node, inputText) => {
        let data = inputText;
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return { output: parsed, stepInfo: parsed };
            } catch (e) {
                return { output: data, stepInfo: data };
            }
        } else {
            const stringified = JSON.stringify(data, null, 2);
            return { output: stringified, stepInfo: stringified };
        }
    },

    'json-entity-extractor': async (node, inputText) => {
        let data = inputText;
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) { /* ignore */ }
        }

        const findEntities = (obj) => {
            if (Array.isArray(obj)) {
                // If it's an array of objects, assume these are the entities
                if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) return obj;
                return [];
            }
            if (typeof obj !== 'object' || obj === null) return [];

            // Prioritize common collection keys
            const priorityKeys = ['items', 'data', 'rows', 'results', 'entities', 'entries', 'objects'];
            for (const key of priorityKeys) {
                if (Array.isArray(obj[key])) {
                    const found = findEntities(obj[key]);
                    if (found.length > 0) return found;
                }
            }

            // Fallback: look at any array property
            for (const key in obj) {
                if (Array.isArray(obj[key])) {
                    const found = findEntities(obj[key]);
                    if (found.length > 0) return found;
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    // One level deeper search
                    const found = findEntities(obj[key]);
                    if (found.length > 0) return found;
                }
            }
            return [];
        };

        const entities = findEntities(data);
        const finalOutput = entities.length > 0 ? entities : (typeof data === 'object' ? [data] : []);

        return {
            output: finalOutput,
            stepInfo: { entitiesFound: entities.length, type: Array.isArray(data) ? 'array' : 'object' }
        };
    }
};

/**
 * Main execution entry point for engines.
 */
const executeEngine = async (node, inputText, parentOutputs, context = {}) => {
    const slug = node.Engine?.slug;
    console.log(`[PARKO] Executing Pure Code Engine: ${slug}`);
    const executionFn = engines[slug];

    if (!executionFn) {
        // Fallback for unknown engines
        return { output: inputText, stepInfo: inputText };
    }

    return await executionFn(node, inputText, parentOutputs, context);
};

module.exports = {
    executeEngine,
    availableEngines: Object.keys(engines)
};
