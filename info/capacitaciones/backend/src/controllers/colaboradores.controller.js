const mysql = require('mysql2/promise');
const { encrypt, decrypt } = require('../utils/crypto/aes');
const { validateRUT } = require('../utils/validators/rut');

/**
 * Controller for GET /api/v1/colaboradores
 */
const getColaboradores = async (req, res) => {
  const { servicio, q } = req.query;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    let sql = `
      SELECT 
        c.id, 
        c.nombre, 
        c.rut, 
        s.nombre as servicio, 
        s.color_hex,
        (SELECT COUNT(*) FROM asignaciones a WHERE a.colaborador_id = c.id) as total,
        (SELECT COUNT(*) FROM asignaciones a WHERE a.colaborador_id = c.id AND a.estado = 'Completado') as completados,
        (SELECT COUNT(*) FROM asignaciones a WHERE a.colaborador_id = c.id AND a.estado = 'En proceso') as en_proceso
      FROM colaboradores c
      JOIN servicios s ON c.servicio_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (servicio && servicio !== 'Todos') {
      sql += ' AND s.nombre = ?';
      params.push(servicio);
    }

    if (q) {
      sql += ' AND (c.nombre LIKE ? OR s.nombre LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    sql += ' ORDER BY c.nombre ASC';

    const [rows] = await connection.execute(sql, params);

    // Decrypt RUT before sending to client (if required by role/view)
    const result = rows.map(row => ({
      ...row,
      rut: row.rut ? decrypt(row.rut) : ''
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching colaboradores:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    await connection.end();
  }
};

/**
 * Controller for GET /api/v1/colaboradores/:id
 */
const getColaboradorById = async (req, res) => {
  const { id } = req.params;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // 1. Basic Info & KPIs
    const [people] = await connection.execute(`
      SELECT 
        c.id, c.nombre, c.rut, s.nombre as servicio, s.color_hex,
        (SELECT COUNT(*) FROM asignaciones a WHERE a.colaborador_id = c.id) as total,
        (SELECT COUNT(*) FROM asignaciones a WHERE a.colaborador_id = c.id AND a.estado = 'Completado') as completados,
        (SELECT COUNT(*) FROM asignaciones a WHERE a.colaborador_id = c.id AND a.estado = 'En proceso') as en_proceso,
        (SELECT COUNT(*) FROM asignaciones a WHERE a.colaborador_id = c.id AND a.estado = 'Por coordinar') as por_coordinar
      FROM colaboradores c
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.id = ?
    `, [id]);

    if (people.length === 0) {
      return res.status(404).json({ message: 'Colaborador no encontrado.' });
    }

    const persona = people[0];
    persona.rut = persona.rut ? decrypt(persona.rut) : '';

    // 2. Courses
    const [cursos] = await connection.execute(`
      SELECT 
        a.id as asig_id, 
        cur.id, 
        cur.nombre, 
        a.estado,
        a.completion_pct
      FROM asignaciones a
      JOIN cursos cur ON a.curso_id = cur.id
      WHERE a.colaborador_id = ?
      ORDER BY cur.nombre ASC
    `, [id]);

    persona.cursos = cursos;

    res.json(persona);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  } finally {
    await connection.end();
  }
};

const createColaborador = async (req, res) => {
  const { nombre, rut, servicio_id } = req.body;
  if (!validateRUT(rut)) return res.status(400).json({ message: 'RUT inválido' });

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const encryptedRUT = encrypt(rut);
    const [result] = await connection.execute(
      'INSERT INTO colaboradores (nombre, rut, servicio_id) VALUES (?, ?, ?)',
      [nombre, encryptedRUT, servicio_id]
    );
    res.status(201).json({ id: result.insertId, nombre, rut, servicio_id });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear: ' + error.message });
  } finally {
    await connection.end();
  }
};

const updateColaborador = async (req, res) => {
  const { id } = req.params;
  const { nombre, rut, servicio_id } = req.body;
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    let updateQuery = 'UPDATE colaboradores SET nombre = ?, servicio_id = ?';
    let params = [nombre, servicio_id];

    if (rut) {
      if (!validateRUT(rut)) return res.status(400).json({ message: 'RUT inválido' });
      updateQuery += ', rut = ?';
      params.push(encrypt(rut));
    }

    updateQuery += ' WHERE id = ?';
    params.push(id);

    await connection.execute(updateQuery, params);
    res.json({ message: 'Colaborador actualizado' });
  } finally {
    await connection.end();
  }
};

const deleteColaborador = async (req, res) => {
  const { id } = req.params;
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.execute('DELETE FROM colaboradores WHERE id = ?', [id]);
    res.json({ message: 'Colaborador eliminado' });
  } finally {
    await connection.end();
  }
};

module.exports = {
  getColaboradores,
  getColaboradorById,
  createColaborador,
  updateColaborador,
  deleteColaborador
};
