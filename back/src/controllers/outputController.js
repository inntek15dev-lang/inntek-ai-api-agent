const { OutputCategory, OutputFormat } = require('../models');

exports.getCategories = async (req, res) => {
    try {
        const categories = await OutputCategory.findAll({ include: [OutputFormat] });
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const category = await OutputCategory.create(req.body);
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const category = await OutputCategory.findByPk(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        await category.update(req.body);
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await OutputCategory.findByPk(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        await category.destroy();
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getFormats = async (req, res) => {
    try {
        const formats = await OutputFormat.findAll({ include: [OutputCategory] });
        res.json({ success: true, data: formats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createFormat = async (req, res) => {
    try {
        const format = await OutputFormat.create(req.body);
        res.json({ success: true, data: format });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateFormat = async (req, res) => {
    try {
        const format = await OutputFormat.findByPk(req.params.id);
        if (!format) return res.status(404).json({ success: false, message: 'Format not found' });
        await format.update(req.body);
        res.json({ success: true, data: format });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteFormat = async (req, res) => {
    try {
        const format = await OutputFormat.findByPk(req.params.id);
        if (!format) return res.status(404).json({ success: false, message: 'Format not found' });
        await format.destroy();
        res.json({ success: true, message: 'Format deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
