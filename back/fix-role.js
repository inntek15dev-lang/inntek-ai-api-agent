const { User, Role } = require('./src/models');

async function fixUserRole() {
    try {
        const adminRole = await Role.findOne({ where: { nombre: 'admin' } });
        const user = await User.findOne({ where: { email: 'admin@inntek.cl' } });
        
        if (adminRole && user && !user.role_id) {
            user.role_id = adminRole.id;
            await user.save();
            console.log("Fixed user role assignment!");
        } else {
            console.log("No missing role found or entities missing.");
        }
    } catch(e) {
        console.error(e);
    }
}
fixUserRole();
