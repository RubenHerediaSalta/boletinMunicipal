const db = require('../config/database');

class Resolucion {
  static async findAll(filters = {}) {
    const {
      categoria,
      fechaDesde,
      fechaHasta,
      fechaPromulgacionDesde,
      fechaPromulgacionHasta,
      fechaSancionDesde,
      fechaSancionHasta,
      estado = 'publicado',
      page = 1,
      limit = 10,
      search = '',
      tags = []
    } = filters;

    let query = `
      SELECT r.*, c.nombre as categoria_nombre 
      FROM resoluciones r 
      LEFT JOIN categorias c ON r.categoria_id = c.id 
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 0;

    if (categoria) {
      paramCount++;
      query += ` AND r.categoria_id = $${paramCount}`;
      values.push(categoria);
    }

    if (fechaDesde) {
      paramCount++;
      query += ` AND r.fecha_publicacion >= $${paramCount}`;
      values.push(fechaDesde);
    }

    if (fechaHasta) {
      paramCount++;
      query += ` AND r.fecha_publicacion <= $${paramCount}`;
      values.push(fechaHasta);
    }

    if (fechaPromulgacionDesde) {
      paramCount++;
      query += ` AND r.fecha_promulgacion >= $${paramCount}`;
      values.push(fechaPromulgacionDesde);
    }

    if (fechaPromulgacionHasta) {
      paramCount++;
      query += ` AND r.fecha_promulgacion <= $${paramCount}`;
      values.push(fechaPromulgacionHasta);
    }

    if (fechaSancionDesde) {
      paramCount++;
      query += ` AND r.fecha_sancion >= $${paramCount}`;
      values.push(fechaSancionDesde);
    }

    if (fechaSancionHasta) {
      paramCount++;
      query += ` AND r.fecha_sancion <= $${paramCount}`;
      values.push(fechaSancionHasta);
    }

    if (estado) {
      paramCount++;
      query += ` AND r.estado = $${paramCount}`;
      values.push(estado);
    }

    if (search) {
      paramCount++;
      query += ` AND (
        r.numero ILIKE $${paramCount} OR 
        r.titulo ILIKE $${paramCount} OR 
        r.contenido ILIKE $${paramCount}
      )`;
      values.push(`%${search}%`);
    }

    if (tags && tags.length > 0) {
      paramCount++;
      query += ` AND r.tags && $${paramCount}::text[]`;
      values.push(tags);
    }

    query += ` ORDER BY r.fecha_publicacion DESC, r.created_at DESC`;

    if (limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(limit);
    }

    if (page && limit) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push((page - 1) * limit);
    }

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error en Resolucion.findAll:', error);
      throw error;
    }
  }

  static async count(filters = {}) {
    const { 
      categoria, 
      fechaDesde, 
      fechaHasta, 
      fechaPromulgacionDesde,
      fechaPromulgacionHasta,
      fechaSancionDesde,
      fechaSancionHasta,
      estado = 'publicado',
      search = '',
      tags = []
    } = filters;

    let query = 'SELECT COUNT(*) FROM resoluciones r WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (categoria) {
      paramCount++;
      query += ` AND r.categoria_id = $${paramCount}`;
      values.push(categoria);
    }

    if (fechaDesde) {
      paramCount++;
      query += ` AND r.fecha_publicacion >= $${paramCount}`;
      values.push(fechaDesde);
    }

    if (fechaHasta) {
      paramCount++;
      query += ` AND r.fecha_publicacion <= $${paramCount}`;
      values.push(fechaHasta);
    }

    if (fechaPromulgacionDesde) {
      paramCount++;
      query += ` AND r.fecha_promulgacion >= $${paramCount}`;
      values.push(fechaPromulgacionDesde);
    }

    if (fechaPromulgacionHasta) {
      paramCount++;
      query += ` AND r.fecha_promulgacion <= $${paramCount}`;
      values.push(fechaPromulgacionHasta);
    }

    if (fechaSancionDesde) {
      paramCount++;
      query += ` AND r.fecha_sancion >= $${paramCount}`;
      values.push(fechaSancionDesde);
    }

    if (fechaSancionHasta) {
      paramCount++;
      query += ` AND r.fecha_sancion <= $${paramCount}`;
      values.push(fechaSancionHasta);
    }

    if (estado) {
      paramCount++;
      query += ` AND r.estado = $${paramCount}`;
      values.push(estado);
    }

    if (search) {
      paramCount++;
      query += ` AND (
        r.numero ILIKE $${paramCount} OR 
        r.titulo ILIKE $${paramCount} OR 
        r.contenido ILIKE $${paramCount}
      )`;
      values.push(`%${search}%`);
    }

    if (tags && tags.length > 0) {
      paramCount++;
      query += ` AND r.tags && $${paramCount}::text[]`;
      values.push(tags);
    }

    try {
      const result = await db.query(query, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error en Resolucion.count:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await db.query(`
        SELECT r.*, c.nombre as categoria_nombre 
        FROM resoluciones r 
        LEFT JOIN categorias c ON r.categoria_id = c.id 
        WHERE r.id = $1
      `, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error en Resolucion.findById:', error);
      throw error;
    }
  }

  static async getAllTags() {
    try {
      const result = await db.query(`
        SELECT DISTINCT unnest(tags) as tag 
        FROM resoluciones 
        WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
        ORDER BY tag
      `);
      return result.rows.map(row => row.tag);
    } catch (error) {
      console.error('Error en Resolucion.getAllTags:', error);
      throw error;
    }
  }

  static async create(resolucionData) {
    const {
      titulo,
      contenido,
      categoria_id,
      fecha_publicacion,
      fecha_promulgacion,
      fecha_sancion,
      numero,
      archivo_adjunto,
      anexos,
      tags,
      estado = 'publicado'
    } = resolucionData;

    try {
      const result = await db.query(
        `INSERT INTO resoluciones 
         (titulo, contenido, categoria_id, fecha_publicacion, fecha_promulgacion, fecha_sancion, numero, archivo_adjunto, anexos, tags, estado) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         RETURNING *`,
        [titulo, contenido, categoria_id, fecha_publicacion, fecha_promulgacion, fecha_sancion, numero, archivo_adjunto, anexos, tags, estado]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error en Resolucion.create:', error);
      throw error;
    }
  }

  static async update(id, resolucionData) {
    const {
      titulo,
      contenido,
      categoria_id,
      fecha_publicacion,
      fecha_promulgacion,
      fecha_sancion,
      numero,
      archivo_adjunto,
      anexos,
      tags,
      estado
    } = resolucionData;

    try {
      const result = await db.query(
        `UPDATE resoluciones 
         SET titulo = $1, contenido = $2, categoria_id = $3, fecha_publicacion = $4, 
             fecha_promulgacion = $5, fecha_sancion = $6, numero = $7, archivo_adjunto = $8, 
             anexos = $9, tags = $10, estado = $11, updated_at = CURRENT_TIMESTAMP
         WHERE id = $12 
         RETURNING *`,
        [titulo, contenido, categoria_id, fecha_publicacion, fecha_promulgacion, fecha_sancion, numero, archivo_adjunto, anexos, tags, estado, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error en Resolucion.update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await db.query('DELETE FROM resoluciones WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error en Resolucion.delete:', error);
      throw error;
    }
  }

  // Métodos para los vínculos
  static async getVinculos(resolucionId) {
    try {
      const result = await db.query(`
        SELECT rv.*, r.numero, r.titulo, r.fecha_publicacion
        FROM resoluciones_vinculos rv
        JOIN resoluciones r ON rv.resolucion_vinculada_id = r.id
        WHERE rv.resolucion_id = $1
        ORDER BY rv.tipo_vinculo, r.fecha_publicacion DESC
      `, [resolucionId]);
      return result.rows;
    } catch (error) {
      console.error('Error en Resolucion.getVinculos:', error);
      throw error;
    }
  }

  static async getVinculosHacia(resolucionId) {
    try {
      const result = await db.query(`
        SELECT rv.*, r.numero, r.titulo, r.fecha_publicacion
        FROM resoluciones_vinculos rv
        JOIN resoluciones r ON rv.resolucion_id = r.id
        WHERE rv.resolucion_vinculada_id = $1
        ORDER BY rv.tipo_vinculo, r.fecha_publicacion DESC
      `, [resolucionId]);
      return result.rows;
    } catch (error) {
      console.error('Error en Resolucion.getVinculosHacia:', error);
      throw error;
    }
  }

  static async addVinculo(resolucionId, resolucionVinculadaId, tipoVinculo) {
    try {
      const result = await db.query(
        `INSERT INTO resoluciones_vinculos (resolucion_id, resolucion_vinculada_id, tipo_vinculo)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [resolucionId, resolucionVinculadaId, tipoVinculo]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error en Resolucion.addVinculo:', error);
      throw error;
    }
  }

  static async removeVinculo(id) {
    try {
      const result = await db.query('DELETE FROM resoluciones_vinculos WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error en Resolucion.removeVinculo:', error);
      throw error;
    }
  }
}

module.exports = Resolucion;