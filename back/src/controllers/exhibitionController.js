const { Exhibition, ExhibitionSlide, Tool, OutputFormat, JsonSchema } = require('../models');

exports.getExhibitions = async (req, res) => {
    try {
        const exhibitions = await Exhibition.findAll({
            where: { activo: true },
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: exhibitions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createExhibition = async (req, res) => {
    try {
        const exhibition = await Exhibition.create(req.body);
        res.json({ success: true, data: exhibition });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getExhibition = async (req, res) => {
    try {
        const exhibition = await Exhibition.findByPk(req.params.id, {
            include: [{
                model: ExhibitionSlide,
                include: [{ 
                    model: Tool,
                    include: [OutputFormat, JsonSchema]
                }],
                order: [['order', 'ASC']]
            }]
        });
        if (!exhibition) return res.status(404).json({ success: false, message: 'Exhibition not found' });
        res.json({ success: true, data: exhibition });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateExhibition = async (req, res) => {
    try {
        const exhibition = await Exhibition.findByPk(req.params.id);
        if (!exhibition) return res.status(404).json({ success: false, message: 'Exhibition not found' });
        await exhibition.update(req.body);
        res.json({ success: true, data: exhibition });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteExhibition = async (req, res) => {
    try {
        const exhibition = await Exhibition.findByPk(req.params.id);
        if (!exhibition) return res.status(404).json({ success: false, message: 'Exhibition not found' });
        await exhibition.destroy();
        res.json({ success: true, message: 'Exhibition deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Slides Management
exports.addSlide = async (req, res) => {
    try {
        const slide = await ExhibitionSlide.create({
            ...req.body,
            exhibition_id: req.params.id
        });
        res.json({ success: true, data: slide });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSlide = async (req, res) => {
    try {
        const slide = await ExhibitionSlide.findByPk(req.params.slideId);
        if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });
        await slide.update(req.body);
        res.json({ success: true, data: slide });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteSlide = async (req, res) => {
    try {
        const slide = await ExhibitionSlide.findByPk(req.params.slideId);
        if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });
        await slide.destroy();
        res.json({ success: true, message: 'Slide deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
