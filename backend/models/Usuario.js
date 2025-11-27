const db = require('../config/database');
const bcrypt = require('bcryptjs');

class Usuario {
  static async findByEmail(email) {
    try {
      const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Usuario.findByEmail:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await db.query(
        'SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = $1', 
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error en Usuario.findById:', error);
      throw error;
    }
  }

  static async comparePassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error en Usuario.comparePassword:', error);
      throw error;
    }
  }
}

module.exports = Usuario;