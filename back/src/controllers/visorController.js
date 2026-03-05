const { Visor } = require('../models');

exports.getVisores = async (req, res) => {
    try {
        const visores = await Visor.findAll({ where: { activo: true } });
        res.json(visores);
    } catch (error) {
        console.error('Error fetching visores:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createVisor = async (req, res) => {
    try {
        const visor = await Visor.create(req.body);
        res.status(201).json(visor);
    } catch (error) {
        console.error('Error creating visor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
