const { Deploy } = require('../models');

exports.getDeploys = async (req, res) => {
    try {
        const deploys = await Deploy.findAll();
        res.json({ success: true, data: deploys });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createDeploy = async (req, res) => {
    try {
        const deploy = await Deploy.create(req.body);
        res.status(201).json({ success: true, data: deploy });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateDeploy = async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await Deploy.update(req.body, { where: { id } });
        if (updated) {
            const updatedDeploy = await Deploy.findByPk(id);
            return res.json({ success: true, data: updatedDeploy });
        }
        res.status(404).json({ success: false, message: 'Deploy setting not found' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteDeploy = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Deploy.destroy({ where: { id } });
        if (deleted) {
            return res.json({ success: true, message: 'Deploy setting deleted' });
        }
        res.status(404).json({ success: false, message: 'Deploy setting not found' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
