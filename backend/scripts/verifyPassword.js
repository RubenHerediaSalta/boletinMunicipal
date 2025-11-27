const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const verifyPassword = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('🔍 Verificando contraseña del administrador...');

    // Obtener el usuario administrador
    const result = await client.query(
      'SELECT id, nombre, email, password FROM usuarios WHERE email = $1',
      ['admin@municipio.com']
    );

    if (result.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    const user = result.rows[0];
    console.log('👤 Usuario encontrado:');
    console.log('   ID:', user.id);
    console.log('   Nombre:', user.nombre);
    console.log('   Email:', user.email);
    console.log('   Password Hash:', user.password);

    // Verificar la contraseña 'admin123'
    const isMatch = await bcrypt.compare('admin123', user.password);
    console.log('🔑 ¿Coincide "admin123" con el hash?:', isMatch);

    // Si no coincide, probar con espacios
    const isMatchWithSpaces = await bcrypt.compare(' admin123', user.password);
    console.log('🔑 ¿Coincide " admin123" (con espacio)?:', isMatchWithSpaces);

    // Generar un nuevo hash de 'admin123' para comparar
    const newHash = await bcrypt.hash('admin123', 12);
    console.log('🆕 Nuevo hash de "admin123":', newHash);
    console.log('🔍 ¿Coincide con el hash de la BD?:', newHash === user.password);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
};

verifyPassword();