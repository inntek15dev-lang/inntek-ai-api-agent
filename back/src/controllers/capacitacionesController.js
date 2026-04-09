const { 
    CapacitacionColaborador, 
    CapacitacionServicio, 
    CapacitacionCurso, 
    CapacitacionAsignacion 
} = require('../models');

/**
 * Get consolidated data for the dashboard
 */
exports.getDashboardData = async (req, res) => {
    try {
        const personas = await CapacitacionColaborador.findAll({
            include: [
                { model: CapacitacionServicio },
                { 
                    model: CapacitacionAsignacion,
                    include: [{ model: CapacitacionCurso }]
                }
            ],
            order: [['nombre', 'ASC']]
        });

        // Format to match the expected structure in the frontend (based on HTML)
        const formatted = personas.map(p => {
            const courses = p.CapacitacionAsignacions.map(a => ({
                id: a.CapacitacionCurso.id,
                nombre: a.CapacitacionCurso.nombre,
                estado: a.estado
            }));

            const total = courses.length;
            const completados = courses.filter(c => c.estado === 'Completado').length;
            const en_proceso = courses.filter(c => c.estado === 'En proceso').length;
            const por_coordinar = courses.filter(c => c.estado === 'Por coordinar').length;

            return {
                id: p.id,
                nombre: p.nombre,
                rut: p.rut,
                servicio: p.CapacitacionServicio ? p.CapacitacionServicio.nombre : 'Sin Servicio',
                avatar_color: p.avatar_color,
                cursos: courses,
                total,
                completados,
                en_proceso,
                por_coordinar
            };
        });

        res.json({ personas: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Master Data: Get Services
 */
exports.getServicios = async (req, res) => {
    try {
        const servicios = await CapacitacionServicio.findAll({ order: [['nombre', 'ASC']] });
        res.json(servicios);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Master Data: Get Courses
 */
exports.getCursos = async (req, res) => {
    try {
        const cursos = await CapacitacionCurso.findAll({ order: [['nombre', 'ASC']] });
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Master Data: Create/Update/Delete (Basic implementations)
 */
exports.createColaborador = async (req, res) => {
    try {
        const colab = await CapacitacionColaborador.create(req.body);
        res.json(colab);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAsignacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        await CapacitacionAsignacion.update({ estado }, { where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
