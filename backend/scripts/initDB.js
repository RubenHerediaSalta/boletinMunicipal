const { Client } = require('pg');
require('dotenv').config();

const initDB = async () => {
  console.log('🔧 Inicializando base de datos...');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres'
  };

  let adminClient = null;
  let client = null;

  try {
    console.log('📡 Conectando a PostgreSQL...');
    adminClient = new Client(config);
    await adminClient.connect();
    console.log('✅ Conectado a PostgreSQL');

    console.log(`📁 Verificando base de datos: ${process.env.DB_NAME}`);
    const dbCheck = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME]
    );

    if (dbCheck.rows.length === 0) {
      console.log(`📝 Creando base de datos: ${process.env.DB_NAME}`);
      await adminClient.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log('✅ Base de datos creada');
    } else {
      console.log('✅ Base de datos ya existe');
    }

    await adminClient.end();

    console.log(`📡 Conectando a la base de datos: ${process.env.DB_NAME}`);
    client = new Client({
      ...config,
      database: process.env.DB_NAME
    });
    await client.connect();
    console.log(`✅ Conectado a la base de datos: ${process.env.DB_NAME}`);

    console.log('📋 Creando tablas...');
    
    // Tabla categorías (solo las 3 nuevas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla "categorias" creada/verificada');

    // Tabla usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(20) DEFAULT 'editor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla "usuarios" creada/verificada');

    // Tabla resoluciones (CON LAS NUEVAS COLUMNAS)
    await client.query(`
      CREATE TABLE IF NOT EXISTS resoluciones (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        contenido TEXT NOT NULL,
        categoria_id INTEGER REFERENCES categorias(id),
        fecha_publicacion DATE DEFAULT CURRENT_DATE,
        fecha_promulgacion DATE,
        fecha_sancion DATE,
        numero VARCHAR(50) UNIQUE NOT NULL,
        archivo_adjunto VARCHAR(255),
        anexos TEXT[] DEFAULT '{}',
        tags TEXT[],
        estado VARCHAR(20) DEFAULT 'publicado',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla "resoluciones" creada/verificada');

    // Tabla resoluciones_vinculos
    await client.query(`
      CREATE TABLE IF NOT EXISTS resoluciones_vinculos (
        id SERIAL PRIMARY KEY,
        resolucion_id INTEGER REFERENCES resoluciones(id) ON DELETE CASCADE,
        resolucion_vinculada_id INTEGER REFERENCES resoluciones(id) ON DELETE CASCADE,
        tipo_vinculo VARCHAR(20) NOT NULL CHECK (tipo_vinculo IN ('modifica', 'reemplaza', 'deroga', 'complementa')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(resolucion_id, resolucion_vinculada_id, tipo_vinculo)
      );
    `);
    console.log('✅ Tabla "resoluciones_vinculos" creada/verificada');

    console.log('📝 Insertando datos iniciales...');

    // Insertar solo las 3 categorías nuevas
    await client.query(`
      INSERT INTO categorias (nombre, descripcion) VALUES 
      ('Ordenanzas', 'Ordenanzas sancionadas por el concejo deliberante'),
      ('Declaraciones', 'Declaraciones oficiales del municipio'),
      ('Resoluciones', 'Resoluciones de diferentes áreas municipales')
      ON CONFLICT (nombre) DO NOTHING;
    `);
    console.log('✅ Categorías insertadas');

    // Usuario administrador
    await client.query(`
      INSERT INTO usuarios (nombre, email, password, rol) VALUES 
      ('Administrador', 'admin@municipio.com', '$2a$12$LQv3c1yqBWVHxkd0L6kZrOa7TUYr2R4mhL2yF4zG4k8bQJ4rY9WXa', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log('✅ Usuario administrador creado');

    console.log('🎉 Base de datos inicializada correctamente!');
    console.log('============================================');
    console.log('📧 Credenciales de acceso:');
    console.log('   Email: admin@municipio.com');
    console.log('   Contraseña: admin123');
    console.log('============================================');

  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error.message);
    throw error;
  } finally {
    if (adminClient && !adminClient._ended) await adminClient.end();
    if (client && !client._ended) await client.end();
  }
};

if (require.main === module) {
  initDB().catch(error => {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  });
}

module.exports = initDB;