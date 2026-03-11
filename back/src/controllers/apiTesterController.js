const { Tool, JsonSchema, AiProvider } = require('../models');
const { executeSingleTool } = require('../utils/aiExecutor');
const fs = require('fs');

/**
 * APITESTER Controller
 * Allows executing tools with dynamic parameter overrides.
 */
exports.executeCustomTool = async (req, res) => {
    try {
        const {
            tool_id,
            training_prompt,
            behavior_prompt,
            ai_provider_id,
            json_schema_id,
            response_format,
            output_format_id,
            prompt
        } = req.body;

        // 1. Resolve Base Tool if provided, or start from scratch
        let virtualTool = {
            training_prompt: training_prompt || '',
            behavior_prompt: behavior_prompt || '',
            response_format: response_format || 'JSON'
        };

        if (tool_id && tool_id !== 'null' && tool_id !== '') {
            const dbTool = await Tool.findByPk(tool_id);
            if (dbTool) {
                // Use overrides if provided, else database values
                virtualTool.training_prompt = training_prompt !== undefined && training_prompt !== '' ? training_prompt : dbTool.training_prompt;
                virtualTool.behavior_prompt = behavior_prompt !== undefined && behavior_prompt !== '' ? behavior_prompt : dbTool.behavior_prompt;
                virtualTool.response_format = response_format !== undefined && response_format !== '' ? response_format : dbTool.response_format;
                virtualTool.output_format_id = output_format_id !== undefined && output_format_id !== '' ? output_format_id : dbTool.output_format_id;
            }
        }

        // 2. Resolve Provider (Override)
        if (ai_provider_id && ai_provider_id !== 'null' && ai_provider_id !== '') {
            virtualTool.AiProvider = await AiProvider.findByPk(ai_provider_id);
        }

        // 3. Resolve Schema (Override)
        if (json_schema_id && json_schema_id !== 'null' && json_schema_id !== '') {
            virtualTool.JsonSchema = await JsonSchema.findByPk(json_schema_id);
        }

        // 3.1 Resolve OutputFormat (Override or from Tool)
        const finalOutputFormatId = output_format_id || virtualTool.output_format_id;
        let usedOutputFormat = null;
        if (finalOutputFormatId && finalOutputFormatId !== 'null' && finalOutputFormatId !== '') {
            const { OutputFormat } = require('../models');
            usedOutputFormat = await OutputFormat.findByPk(finalOutputFormatId);
            virtualTool.OutputFormat = usedOutputFormat;
        }

        // 4. Execute using core AI logic
        const result = await executeSingleTool(virtualTool, prompt, req.files || []);

        // Cleanup temp files
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
            });
        }

        res.json({
            success: true,
            data: {
                response: result.response,
                provider: result.provider,
                configUsed: {
                    tool_id,
                    provider_id: ai_provider_id,
                    schema_id: json_schema_id,
                    response_format: virtualTool.response_format,
                    output_format: usedOutputFormat
                }
            }
        });

    } catch (error) {
        // Cleanup temp files on error
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
            });
        }

        console.error('APITESTER Error:', error.message);
        res.status(500).json({
            success: false,
            message: `Neural Testing Failed: ${error.message}`
        });
    }
};
