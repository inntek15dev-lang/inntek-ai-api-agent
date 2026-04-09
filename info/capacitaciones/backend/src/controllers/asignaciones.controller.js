const mysql = require('mysql2/promise');

/**
 * Controller for PATCH /api/v1/asignaciones/:id
 */
const updateAsignacion = async (req, res) => {
  const { id } = req.params;
  let { estado, completion_pct } = req.body;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // Business Logic: Auto-Status
    if (completion_pct === 100) {
      estado = 'Completado';
    } else if (completion_pct > 0 && completion_pct < 100) {
      estado = 'En proceso';
    }

    const [result] = await connection.execute(
      'UPDATE asignaciones SET estado = ?, completion_pct = ? WHERE id = ?',
      [estado, completion_pct, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Asignación no encontrada.' });
    }

    res.json({ message: 'Asignación actualizada con éxito.', estado, completion_pct });
  } catch (error) {
    console.error('Error updating asignacion:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    await connection.end();
  }
};

/**
 * Controller for POST /api/v1/asignaciones/sync
 * UPSERT Logic from raw JSON
 */
const syncData = async (req, res) => {
  const { personas } = req.body; // Expects DATA format from HTML

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.beginTransaction();

    for (const p of personas) {
      // Find Colaborador ID by RUT (encrypted RUT matching not supported, use raw for search if available)
      // Ideally we search by a stable identifier or unique name in this context
      const [rows] = await connection.execute('SELECT id FROM colaboradores WHERE nombre = ?', [p.nombre]);
      if (rows.length === 0) continue; 
      const colaboradorId = rows[0].id;

      for (const curso of p.cursos) {
        // Find Curso ID
        const [cRows] = await connection.execute('SELECT id FROM cursos WHERE nombre = ?', [curso.nombre]);
        if (cRows.length === 0) continue;
        const cursoId = cRows[0].id;

        // UPSERT Asignacion
        await connection.execute(`
          INSERT INTO asignaciones (colaborador_id, curso_id, estado)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE estado = VALUES(estado)
        `, [colaboradorId, cursoId, curso.estado]);
      }
    }

    await connection.commit();
    res.json({ message: 'Sincronización masiva completada.' });
  } catch (error) {
    await connection.rollback();
    console.error('Sync error:', error);
    res.status(500).json({ message: 'Error en la sincronización.' });
  } finally {
    await connection.end();
  }
};

module.exports = {
  updateAsignacion,
  syncData
};
