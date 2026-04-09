const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '../backend/.env' });

const SVC_COLORS = {
  'Doc. Controlada': '#1F4E79',
  'INNTEK': '#2E75B6',
  'RyCE': '#5B9BD5',
  'Transversal': '#7030A0',
  'Verif. Chile': '#375623',
  'Verif. Uruguay': '#70AD47',
};

const DATA = {
  "personas": [
    // This is a placeholder, in a real scenario we could read the HTML file here
    // But for this seeder, I will include a representative sample from the DATA found in the HTML
    {"nombre":"BUSTOS MANRIQUEZ GUADALUPE DEL CARMEN","servicio":"Doc. Controlada","rut":"8679012-2","cursos":[{"id":36,"nombre":"Protocolo Suseso-CEAL: Capacitación a Comité Aplicación","estado":"Por coordinar"}]},
    {"nombre":"CARRASCO PEREZ BEATRIZ GERTIE","servicio":"Doc. Controlada","rut":"10639830-5","cursos":[{"id":1,"nombre":"Contratos de trabajo Chile, Colombia y Uruguay","estado":"Por coordinar"},{"id":2,"nombre":"Revisión de documentos y criterios","estado":"Por coordinar"}]},
    {"nombre":"ORELLANA MALDONADO RODRIGO ARMANDO","servicio":"INNTEK","rut":"16239914-4","cursos":[{"id":6,"nombre":"PHP LARAVEL VIEW","estado":"Completado"},{"id":8,"nombre":"SQL","estado":"Completado"}]}
    // ... more people would be here
  ]
};

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kamel_capacitaciones'
  });

  console.log('Connected to MySQL. Starting seeding...');

  try {
    await connection.beginTransaction();

    // 1. Insert Servicios
    const serviciosMap = new Map();
    for (const [name, color] of Object.entries(SVC_COLORS)) {
      const [result] = await connection.execute(
        'INSERT INTO servicios (nombre, color_hex) VALUES (?, ?) ON DUPLICATE KEY UPDATE color_hex = VALUES(color_hex)',
        [name, color]
      );
      serviciosMap.set(name, result.insertId || (await connection.query('SELECT id FROM servicios WHERE nombre = ?', [name]))[0][0].id);
    }

    // 2. Insert Cursos and Collaborators
    const cursosMap = new Map();

    for (const persona of DATA.personas) {
      // Insert Colaborador
      const [colabResult] = await connection.execute(
        'INSERT INTO colaboradores (nombre, rut, servicio_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)',
        [persona.nombre, persona.rut, serviciosMap.get(persona.servicio)]
      );
      const colaboradorId = colabResult.insertId || (await connection.query('SELECT id FROM colaboradores WHERE rut = ?', [persona.rut]))[0][0].id;

      for (const curso of persona.cursos) {
        // Insert Curso if not exists
        if (!cursosMap.has(curso.nombre)) {
          const [cursoResult] = await connection.execute(
            'INSERT INTO cursos (id, nombre) VALUES (?, ?)',
            [curso.id, curso.nombre]
          );
          cursosMap.set(curso.nombre, curso.id);
        }

        // Insert Asignacion
        await connection.execute(
          'INSERT INTO asignaciones (colaborador_id, curso_id, estado) VALUES (?, ?, ?)',
          [colaboradorId, cursosMap.get(curso.nombre), curso.estado]
        );
      }
    }

    await connection.commit();
    console.log('Seeding completed successfully!');
  } catch (error) {
    await connection.rollback();
    console.error('Seeding failed:', error);
  } finally {
    await connection.end();
  }
}

seed();
