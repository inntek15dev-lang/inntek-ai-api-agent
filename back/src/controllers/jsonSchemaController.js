const { JsonSchema } = require('../models');

exports.getSchemas = async (req, res) => {
    try {
        const schemas = await JsonSchema.findAll();
        res.json({ success: true, data: schemas });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createSchema = async (req, res) => {
    try {
        const schema = await JsonSchema.create(req.body);
        res.json({ success: true, data: schema });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSchema = async (req, res) => {
    try {
        const schema = await JsonSchema.findByPk(req.params.id);
        if (!schema) return res.status(404).json({ success: false, message: 'Schema not found' });
        res.json({ success: true, data: schema });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSchema = async (req, res) => {
    try {
        const schema = await JsonSchema.findByPk(req.params.id);
        if (!schema) return res.status(404).json({ success: false, message: 'Schema not found' });
        await schema.update(req.body);
        res.json({ success: true, data: schema });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteSchema = async (req, res) => {
    try {
        const schema = await JsonSchema.findByPk(req.params.id);
        if (!schema) return res.status(404).json({ success: false, message: 'Schema not found' });
        await schema.destroy();
        res.json({ success: true, message: 'Schema deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
