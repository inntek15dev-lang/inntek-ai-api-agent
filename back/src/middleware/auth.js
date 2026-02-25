const jwt = require('jsonwebtoken');
const { User, Role, Privilegio } = require('../models');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
            include: [{ model: Role, include: [Privilegio] }]
        });

        if (!user) return res.status(401).json({ success: false, message: 'Invalid token' });

        req.user = user;

        // Attach capability methods as per privilegios-engine
        const privileges = user.Role.Privilegios;

        const hasPrivilege = (module, action) => {
            const wildcard = privileges.find(p => p.ref_modulo === '*');
            if (wildcard && wildcard[action]) return true;
            const priv = privileges.find(p => p.ref_modulo === module);
            return priv?.[action] === true;
        };

        req.user.canRead = (module) => hasPrivilege(module, 'read');
        req.user.canWrite = (module) => hasPrivilege(module, 'write');
        req.user.canExec = (module) => hasPrivilege(module, 'exec');

        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
};

const requirePrivilege = (moduleName, action = 'read') => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ success: false, message: 'Auth required' });

        const actionMethod = `can${action.charAt(0).toUpperCase() + action.slice(1)}`;
        const hasAccess = req.user[actionMethod]?.(moduleName);

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: `Denied. Missing ${action} for ${moduleName}`
            });
        }
        next();
    };
};

module.exports = { authMiddleware, requirePrivilege };
