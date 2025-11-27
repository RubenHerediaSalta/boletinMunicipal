const { Client } = require('pg');
require('dotenv').config();

const verifyDatabase = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('🔍 Verificando estado de la base de datos...');

    // Verificar estructura de la tabla usuarios
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'usuarios'
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Estructura de la tabla "usuarios":');
    tableStructure.rows.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) - NULL: ${col.is_nullable}`);
    });

    // Verificar usuarios existentes
    const users = await client.query(`
      SELECT id, nombre, email, rol, created_at 
      FROM usuarios 
      ORDER BY id
    `);

    console.log('\n👥 Usuarios en el sistema:');
    users.rows.forEach(user => {
      console.log(`   ID: ${user.id} | ${user.nombre} <${user.email}> [${user.rol}]`);
    });

    // Verificar constraints
    const constraints = await client.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'usuarios'
    `);

    console.log('\n🔒 Constraints de la tabla "usuarios":');
    constraints.rows.forEach(constraint => {
      console.log(`   ${constraint.constraint_name} (${constraint.constraint_type})`);
    });

  } catch (error) {
    console.error('❌ Error verificando la base de datos:', error.message);
  } finally {
    await client.end();
  }
};

verifyDatabase();