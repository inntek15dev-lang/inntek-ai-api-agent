const { AiProvider } = require('../models');

// Mask API key for security (show only last 4 chars)
const maskKey = (key) => {
    if (!key) return null;
    if (key.length <= 4) return '****';
    return '•'.repeat(key.length - 4) + key.slice(-4);
};

exports.getProviders = async (req, res) => {
    try {
        const providers = await AiProvider.findAll({ order: [['is_default', 'DESC'], ['createdAt', 'ASC']] });
        const masked = providers.map(p => ({
            ...p.toJSON(),
            api_key: maskKey(p.api_key)
        }));
        res.json({ success: true, data: masked });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getProvider = async (req, res) => {
    try {
        const provider = await AiProvider.findByPk(req.params.id);
        if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
        res.json({
            success: true,
            data: { ...provider.toJSON(), api_key: maskKey(provider.api_key) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createProvider = async (req, res) => {
    try {
        const data = { ...req.body };
        // If this is set as default, unset all others
        if (data.is_default) {
            await AiProvider.update({ is_default: false }, { where: {} });
        }
        const provider = await AiProvider.create(data);
        res.json({ success: true, data: provider });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateProvider = async (req, res) => {
    try {
        const provider = await AiProvider.findByPk(req.params.id);
        if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

        const data = { ...req.body };

        // If api_key is masked (unchanged), remove it from update
        if (data.api_key && (data.api_key.includes('•') || data.api_key === '****' || data.api_key === maskKey(provider.api_key))) {
            delete data.api_key;
        }

        // If setting as default, unset all others
        if (data.is_default) {
            await AiProvider.update({ is_default: false }, { where: {} });
        }

        await provider.update(data);
        res.json({
            success: true,
            data: { ...provider.toJSON(), api_key: maskKey(provider.api_key) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteProvider = async (req, res) => {
    try {
        const provider = await AiProvider.findByPk(req.params.id);
        if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

        if (provider.is_default) {
            return res.status(400).json({ success: false, message: 'Cannot delete the default provider. Set another as default first.' });
        }

        await provider.destroy();
        res.json({ success: true, message: 'Provider deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.setDefault = async (req, res) => {
    try {
        const provider = await AiProvider.findByPk(req.params.id);
        if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

        // Unset all defaults, then set this one
        await AiProvider.update({ is_default: false }, { where: {} });
        await provider.update({ is_default: true });

        res.json({
            success: true,
            message: `"${provider.nombre}" is now the default AI provider.`,
            data: { ...provider.toJSON(), api_key: maskKey(provider.api_key) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
