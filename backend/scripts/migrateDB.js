const { Client } = require('pg');
require('dotenv').config();

const migrateDB = async () => {
  console.log('🚀 Ejecutando migración de base de datos...');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  };

  let client = null;

  try {
    console.log('📡 Conectando a PostgreSQL...');
    client = new Client(config);
    await client.connect();
    console.log('✅ Conectado a PostgreSQL');

    // Paso 1: Agregar columnas nuevas a la tabla resoluciones
    console.log('📋 Agregando nuevas columnas a la tabla resoluciones...');

    // Verificar y agregar fecha_promulgacion
    const checkPromulgacion = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'resoluciones' AND column_name = 'fecha_promulgacion'
    `);

    if (checkPromulgacion.rows.length === 0) {
      await client.query(`ALTER TABLE resoluciones ADD COLUMN fecha_promulgacion DATE`);
      console.log('✅ Columna fecha_promulgacion agregada');
    } else {
      console.log('✅ Columna fecha_promulgacion ya existe');
    }

    // Verificar y agregar fecha_sancion
    const checkSancion = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'resoluciones' AND column_name = 'fecha_sancion'
    `);

    if (checkSancion.rows.length === 0) {
      await client.query(`ALTER TABLE resoluciones ADD COLUMN fecha_sancion DATE`);
      console.log('✅ Columna fecha_sancion agregada');
    } else {
      console.log('✅ Columna fecha_sancion ya existe');
    }

    // Verificar y agregar anexos
    const checkAnexos = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'resoluciones' AND column_name = 'anexos'
    `);

    if (checkAnexos.rows.length === 0) {
      await client.query(`ALTER TABLE resoluciones ADD COLUMN anexos TEXT[] DEFAULT '{}'`);
      console.log('✅ Columna anexos agregada');
    } else {
      console.log('✅ Columna anexos ya existe');
    }

    // Paso 2: Actualizar categorías (eliminar las viejas, agregar las nuevas)
    console.log('🔄 Actualizando categorías...');
    
    // Eliminar todas las categorías existentes
    await client.query('DELETE FROM categorias');
    console.log('✅ Categorías antiguas eliminadas');

    // Insertar las nuevas categorías
    await client.query(`
      INSERT INTO categorias (nombre, descripcion) VALUES 
      ('Ordenanzas', 'Ordenanzas sancionadas por el concejo deliberante'),
      ('Declaraciones', 'Declaraciones oficiales del municipio'),
      ('Resoluciones', 'Resoluciones de diferentes áreas municipales')
    `);
    console.log('✅ Nuevas categorías insertadas');

    // Paso 3: Verificar que la tabla de vínculos existe
    const checkVinculos = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'resoluciones_vinculos'
    `);

    if (checkVinculos.rows.length === 0) {
      console.log('📋 Creando tabla resoluciones_vinculos...');
      await client.query(`
        CREATE TABLE resoluciones_vinculos (
          id SERIAL PRIMARY KEY,
          resolucion_id INTEGER REFERENCES resoluciones(id) ON DELETE CASCADE,
          resolucion_vinculada_id INTEGER REFERENCES resoluciones(id) ON DELETE CASCADE,
          tipo_vinculo VARCHAR(20) NOT NULL CHECK (tipo_vinculo IN ('modifica', 'reemplaza', 'deroga', 'complementa')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(resolucion_id, resolucion_vinculada_id, tipo_vinculo)
        );
      `);
      console.log('✅ Tabla resoluciones_vinculos creada');
    } else {
      console.log('✅ Tabla resoluciones_vinculos ya existe');
    }

    console.log('🎉 Migración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    throw error;
  } finally {
    if (client && !client._ended) {
      await client.end();
    }
  }
};

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  migrateDB().catch(error => {
    console.error('❌ Error fatal en migración:', error.message);
    process.exit(1);
  });
}

module.exports = migrateDB;