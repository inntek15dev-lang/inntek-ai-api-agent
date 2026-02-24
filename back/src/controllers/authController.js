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

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({
            success: true,
            data: {
                user: { id: user.id, nombre: user.nombre, email: user.email, role: user.Role.nombre },
                token: token,
                privileges: user.Role.Privilegios.map(p => ({
                    ref_modulo: p.ref_modulo,
                    read: p.read,
                    write: p.write,
                    excec: p.excec
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.me = async (req, res) => {
    res.json({
        success: true,
        data: {
            user: { id: req.user.id, nombre: req.user.nombre, email: req.user.email, role: req.user.Role.nombre },
            privileges: req.user.Role.Privilegios.map(p => ({
                ref_modulo: p.ref_modulo,
                read: p.read,
                write: p.write,
                excec: p.excec
            }))
        }
    });
};
