const { Client } = require('pg');
require('dotenv').config();

const verifyUser = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('🔍 Verificando usuario administrador...');

    const result = await client.query('SELECT * FROM usuarios WHERE email = $1', ['admin@municipio.com']);
    
    if (result.rows.length === 0) {
      console.log('❌ Usuario administrador no encontrado');
    } else {
      const user = result.rows[0];
      console.log('✅ Usuario encontrado:');
      console.log('   ID:', user.id);
      console.log('   Nombre:', user.nombre);
      console.log('   Email:', user.email);
      console.log('   Rol:', user.rol);
      console.log('   Password Hash:', user.password);
    }

    // Verificar categorías
    const categorias = await client.query('SELECT * FROM categorias');
    console.log(`\n📂 Categorías encontradas: ${categorias.rows.length}`);
    categorias.rows.forEach(cat => {
      console.log(`   - ${cat.nombre}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
};

verifyUser();