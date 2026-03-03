const { Engine } = require('../models');

exports.getEngines = async (req, res) => {
    try {
        const engines = await Engine.findAll({ where: { activo: true }, order: [['nombre', 'ASC']] });
        res.json({ success: true, data: engines });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
