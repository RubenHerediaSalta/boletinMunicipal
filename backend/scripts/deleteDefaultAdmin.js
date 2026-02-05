const { Client } = require('pg');
require('dotenv').config();

const deleteDefaultAdmin = async () => {
  console.log('🗑️  Eliminando usuario admin por defecto');
  console.log('=========================================\n');

  try {
    console.log('📡 Conectando a la base de datos...');

    // Configurar conexión
    const config = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
        };

    const client = new Client(config);
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // Eliminar usuario admin por defecto
    const result = await client.query(
      `DELETE FROM usuarios WHERE email = 'admin@municipio.com' RETURNING id, email`
    );

    if (result.rows.length > 0) {
      console.log('✅ Usuario admin por defecto eliminado:');
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   ID: ${result.rows[0].id}\n`);
    } else {
      console.log('ℹ️  No se encontró el usuario admin por defecto\n');
    }

    // Listar usuarios restantes
    const users = await client.query(
      'SELECT id, nombre, email, rol FROM usuarios ORDER BY id'
    );

    console.log('📋 Usuarios actuales en el sistema:');
    console.log('=========================================');
    if (users.rows.length === 0) {
      console.log('   (No hay usuarios)');
    } else {
      users.rows.forEach(user => {
        console.log(`   ${user.id}. ${user.nombre} (${user.email}) - ${user.rol}`);
      });
    }
    console.log('=========================================\n');

    await client.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Ejecutar
deleteDefaultAdmin();
