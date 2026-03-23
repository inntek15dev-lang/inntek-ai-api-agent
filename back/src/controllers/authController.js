const jwt = require('jsonwebtoken');
const { User, Role, Privilegio } = require('../models');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({
            where: { email, password }, // Simplification: in prod use bcrypt
            include: [{ model: Role, include: [Privilegio] }]
        });

        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_local_dev';
        const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '24h' });

        const roleName = user.Role?.nombre || 'admin';
        const basePrivs = user.Role?.Privilegios || [];
        const finalPrivs = basePrivs.length > 0 ? basePrivs.map(p => ({
            ref_modulo: p.ref_modulo,
            read: p.read,
            write: p.write,
            excec: p.excec
        })) : (roleName === 'admin' ? [{ ref_modulo: '*', read: true, write: true, excec: true }] : []);

        res.json({
            success: true,
            data: {
                user: { id: user.id, nombre: user.nombre, email: user.email, role: roleName },
                token: token,
                privileges: finalPrivs
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.me = async (req, res) => {
    const roleName = req.user.Role?.nombre || 'admin';
    const basePrivs = req.user.Role?.Privilegios || [];
    const finalPrivs = basePrivs.length > 0 ? basePrivs.map(p => ({
        ref_modulo: p.ref_modulo,
        read: p.read,
        write: p.write,
        excec: p.excec
    })) : (roleName === 'admin' ? [{ ref_modulo: '*', read: true, write: true, excec: true }] : []);

    res.json({
        success: true,
        data: {
            user: { id: req.user.id, nombre: req.user.nombre, email: req.user.email, role: roleName },
            privileges: finalPrivs
        }
    });
};
