const { sequelize, Role, Privilegio, User } = require('./models');
require('dotenv').config();

const seed = async () => {
    try {
        await sequelize.sync({ force: true });

        // 1. Create Roles
        const superAdminRole = await Role.create({ nombre: 'SuperAdmin' });
        const adminRole = await Role.create({ nombre: 'Admin' });
        const userRole = await Role.create({ nombre: 'User' });

        // 2. Create Privileges (SuperAdmin wildcard)
        await Privilegio.create({
            ref_modulo: '*',
            read: true,
            write: true,
            excec: true,
            role_id: superAdminRole.id
        });

        // Admin Privileges
        const modules = ['Auth', 'AI_Tool_Maker', 'AI_Tool_Catalog', 'AI_Tool_Execution', 'Config'];
        for (const mod of modules) {
            await Privilegio.create({
                ref_modulo: mod,
                read: true,
                write: true,
                excec: true,
                role_id: adminRole.id
            });
        }

        // User Privileges
        await Privilegio.create({ ref_modulo: 'AI_Tool_Catalog', read: true, role_id: userRole.id });
        await Privilegio.create({ ref_modulo: 'AI_Tool_Execution', read: true, excec: true, role_id: userRole.id });

        // 3. Create SuperAdmin User
        await User.create({
            nombre: 'Inntek System',
            email: 'inntek', // As per privilegios-engine requirement
            password: 'admin', // Simplification
            role_id: superAdminRole.id
        });

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seed();
