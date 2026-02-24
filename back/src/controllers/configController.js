const { Config } = require('../models');

exports.getConfig = async (req, res) => {
    try {
        const config = await Config.findAll();
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.saveConfig = async (req, res) => {
    const { configs } = req.body; // Array of { key, value }
    try {
        for (const item of configs) {
            await Config.upsert(item);
        }
        res.json({ success: true, message: 'Configuration saved' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
