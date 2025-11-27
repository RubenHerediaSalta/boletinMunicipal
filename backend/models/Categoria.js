const db = require('../config/database');

class Categoria {
  static async findAll() {
    try {
      const result = await db.query('SELECT * FROM categorias ORDER BY nombre');
      return result.rows;
    } catch (error) {
      console.error('Error en Categoria.findAll:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await db.query('SELECT * FROM categorias WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Categoria.findById:', error);
      throw error;
    }
  }
}

module.exports = Categoria;