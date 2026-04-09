const { 
    CapacitacionServicio, 
    CapacitacionColaborador, 
    CapacitacionCurso, 
    CapacitacionAsignacion 
} = require('../models');
const fs = require('fs');
const path = require('path');

const SVC_COLORS = {
    'Doc. Controlada': '#1F4E79',
    'INNTEK': '#2E75B6',
    'RyCE': '#5B9BD5',
    'Transversal': '#7030A0',
    'Verif. Chile': '#375623',
    'Verif. Uruguay': '#70AD47',
};

const seedCapacitaciones = async () => {
    try {
        console.log('[CAPACITACIONES] Starting seed...');
        
        const dataPath = path.join(__dirname, '../../scripts/capacitaciones_data.json');
        if (!fs.existsSync(dataPath)) {
            console.error('[CAPACITACIONES] Data file not found. Run extract_capacitaciones.js first.');
            return;
        }

        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        // 1. Create Services
        const servicesSet = new Set();
        data.personas.forEach(p => servicesSet.add(p.servicio));
        
        const servicesMap = {};
        for (const svcName of servicesSet) {
            const slug = svcName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const [svc] = await CapacitacionServicio.findOrCreate({
                where: { slug },
                defaults: {
                    nombre: svcName,
                    color: SVC_COLORS[svcName] || '#888'
                }
            });
            servicesMap[svcName] = svc.id;
        }

        // 2. Create Courses (Unique list from all assignments)
        const coursesMap = {}; // name -> id
        const uniqueCourses = {};
        data.personas.forEach(p => {
            p.cursos.forEach(c => {
                if (!uniqueCourses[c.nombre]) {
                    uniqueCourses[c.nombre] = true;
                }
            });
        });

        for (const courseName of Object.keys(uniqueCourses)) {
            const [course] = await CapacitacionCurso.findOrCreate({
                where: { nombre: courseName },
                defaults: { descripcion: `Curso de ${courseName}` }
            });
            coursesMap[courseName] = course.id;
        }

        // 3. Create Collaborators and Assignments
        for (const p of data.personas) {
            const [colab] = await CapacitacionColaborador.findOrCreate({
                where: { nombre: p.nombre },
                defaults: {
                    rut: p.rut || null,
                    servicio_id: servicesMap[p.servicio],
                    avatar_color: SVC_COLORS[p.servicio] || '#888'
                }
            });

            // Clean previous assignments for this collaborator to avoid duplicates on re-seed
            await CapacitacionAsignacion.destroy({ where: { colaborador_id: colab.id } });

            for (const c of p.cursos) {
                await CapacitacionAsignacion.create({
                    colaborador_id: colab.id,
                    curso_id: coursesMap[c.nombre],
                    estado: c.estado || 'Por coordinar'
                });
            }
        }

        console.log('[CAPACITACIONES] Seed completed successfully!');
    } catch (error) {
        console.error('[CAPACITACIONES] Seed error:', error);
    }
};

module.exports = { seedCapacitaciones };
