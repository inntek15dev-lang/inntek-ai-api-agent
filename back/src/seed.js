const { sequelize, Role, Privilegio, User, Tool } = require('./models');
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
            exec: true,
            role_id: superAdminRole.id
        });

        // Admin Privileges
        const modules = ['Auth', 'AI_Tool_Maker', 'AI_Tool_Catalog', 'AI_Tool_Execution', 'Config'];
        for (const mod of modules) {
            await Privilegio.create({
                ref_modulo: mod,
                read: true,
                write: true,
                exec: true,
                role_id: adminRole.id
            });
        }

        // User Privileges
        await Privilegio.create({ ref_modulo: 'AI_Tool_Catalog', read: true, role_id: userRole.id });
        await Privilegio.create({ ref_modulo: 'AI_Tool_Execution', read: true, exec: true, role_id: userRole.id });

        // 3. Create SuperAdmin User
        const user = await User.create({
            nombre: 'Inntek System',
            email: 'inntek', // As per privilegios-engine requirement
            password: 'admin', // Simplification
            role_id: superAdminRole.id
        });

        // 4. Create Sample AI Tool: Validador de CI Chile
        await Tool.create({
            nombre: 'Validador de CI Chile',
            descripcion: 'Experto Validador de CI Chilenas extraterrestrisimo',
            logo_herramienta: '🆔',
            training_prompt: 'actua como experto validador y analista de cedulas de identidad chilena, analiza la imagen adjunta identifica la data textual y numerica que se indica en #DATA# comparala con la data encontrada e3n la imagen y ejecuta un proceso de validacion de documentacion.',
            behavior_prompt: 'responde siempre con un JSON estructurado que represente el analisis del documento y su match de validacion punto por punto y su nota final.',
            response_format: 'JSON'
        });

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seed();
