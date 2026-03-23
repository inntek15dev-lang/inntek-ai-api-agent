const { Input } = require('../models');

exports.getInputs = async (req, res) => {
    try {
        const inputs = await Input.findAll({ where: { activo: true } });
        res.json({ success: true, data: inputs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getInput = async (req, res) => {
    try {
        const input = await Input.findByPk(req.params.id);
        if (!input) return res.status(404).json({ success: false, message: 'Input not found' });
        res.json({ success: true, data: input });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
