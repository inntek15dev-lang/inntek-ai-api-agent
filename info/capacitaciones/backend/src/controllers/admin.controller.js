const mysql = require('mysql2/promise');

const getDb = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
};

// --- SERVICIOS ---

const getServicios = async (req, res) => {
  const conn = await getDb();
  try {
    const [rows] = await conn.execute('SELECT * FROM servicios ORDER BY nombre');
    res.json(rows);
  } finally {
    await conn.end();
  }
};

const createServicio = async (req, res) => {
  const { nombre, color_hex } = req.body;
  const conn = await getDb();
  try {
    const [result] = await conn.execute(
      'INSERT INTO servicios (nombre, color_hex) VALUES (?, ?)',
      [nombre, color_hex]
    );
    res.status(201).json({ id: result.insertId, nombre, color_hex });
  } finally {
    await conn.end();
  }
};

const updateServicio = async (req, res) => {
  const { id } = req.params;
  const { nombre, color_hex } = req.body;
  const conn = await getDb();
  try {
    await conn.execute(
      'UPDATE servicios SET nombre = ?, color_hex = ? WHERE id = ?',
      [nombre, color_hex, id]
    );
    res.json({ message: 'Servicio actualizado' });
  } finally {
    await conn.end();
  }
};

const deleteServicio = async (req, res) => {
  const { id } = req.params;
  const conn = await getDb();
  try {
    await conn.execute('DELETE FROM servicios WHERE id = ?', [id]);
    res.json({ message: 'Servicio eliminado' });
  } finally {
    await conn.end();
  }
};

// --- CURSOS ---

const getCursos = async (req, res) => {
  const conn = await getDb();
  try {
    const [rows] = await conn.execute('SELECT * FROM cursos ORDER BY nombre');
    res.json(rows);
  } finally {
    await conn.end();
  }
};

const createCurso = async (req, res) => {
  const { nombre } = req.body;
  const conn = await getDb();
  try {
    const [result] = await conn.execute(
      'INSERT INTO cursos (nombre) VALUES (?)',
      [nombre]
    );
    res.status(201).json({ id: result.insertId, nombre });
  } finally {
    await conn.end();
  }
};

const updateCurso = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  const conn = await getDb();
  try {
    await conn.execute(
      'UPDATE cursos SET nombre = ? WHERE id = ?',
      [nombre, id]
    );
    res.json({ message: 'Curso actualizado' });
  } finally {
    await conn.end();
  }
};

const deleteCurso = async (req, res) => {
  const { id } = req.params;
  const conn = await getDb();
  try {
    await conn.execute('DELETE FROM cursos WHERE id = ?', [id]);
    res.json({ message: 'Curso eliminado' });
  } finally {
    await conn.end();
  }
};

module.exports = {
  getServicios, createServicio, updateServicio, deleteServicio,
  getCursos, createCurso, updateCurso, deleteCurso
};
