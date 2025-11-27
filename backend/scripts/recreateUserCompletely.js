const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const recreateUserCompletely = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('🔧 Recreando usuario administrador completamente...');

    // Eliminar usuario si existe
    await client.query('DELETE FROM usuarios WHERE email = $1', ['admin@municipio.com']);
    console.log('✅ Usuario anterior eliminado');

    // Crear nuevo hash de 'admin123'
    const hashedPassword = await bcrypt.hash('admin123', 12);
    console.log('🔑 Nuevo hash generado:', hashedPassword);

    // Insertar nuevo usuario
    const result = await client.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING *',
      ['Administrador', 'admin@municipio.com', hashedPassword, 'admin']
    );

    console.log('✅ Nuevo usuario creado:');
    console.log('   ID:', result.rows[0].id);
    console.log('   Nombre:', result.rows[0].nombre);
    console.log('   Email:', result.rows[0].email);
    console.log('   Rol:', result.rows[0].rol);

    // Verificar que la contraseña funciona
    const verify = await bcrypt.compare('admin123', result.rows[0].password);
    console.log('✅ Verificación de contraseña "admin123":', verify);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
};

recreateUserCompletely();