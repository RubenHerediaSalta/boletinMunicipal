const { Client } = require('pg');
require('dotenv').config();

const restoreEmailColumn = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('🔧 Restaurando columna email...');

    // Paso 1: Verificar si la columna email existe
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' AND column_name = 'email'
    `);

    if (checkResult.rows.length === 0) {
      console.log('📧 Columna email no encontrada. Creándola...');
      
      // Paso 2: Agregar la columna email
      await client.query(`
        ALTER TABLE usuarios 
        ADD COLUMN email VARCHAR(100)
      `);
      console.log('✅ Columna email agregada.');

      // Paso 3: Poblar la columna con el email del administrador
      await client.query(`
        UPDATE usuarios 
        SET email = 'admin@municipio.com' 
        WHERE nombre = 'Administrador'
      `);
      console.log('✅ Email del administrador actualizado.');

      // Paso 4: Agregar constraint UNIQUE
      await client.query(`
        ALTER TABLE usuarios 
        ADD CONSTRAINT usuarios_email_unique UNIQUE (email)
      `);
      console.log('✅ Constraint UNIQUE agregado.');

      // Paso 5: Hacer la columna NOT NULL
      await client.query(`
        ALTER TABLE usuarios 
        ALTER COLUMN email SET NOT NULL
      `);
      console.log('✅ Columna email marcada como NOT NULL.');

    } else {
      console.log('✅ La columna email ya existe.');
      
      // Verificar si el usuario administrador tiene email
      const userCheck = await client.query(`
        SELECT email FROM usuarios WHERE nombre = 'Administrador'
      `);
      
      if (!userCheck.rows[0]?.email) {
        console.log('📧 Actualizando email del administrador...');
        await client.query(`
          UPDATE usuarios 
          SET email = 'admin@municipio.com' 
          WHERE nombre = 'Administrador'
        `);
        console.log('✅ Email del administrador actualizado.');
      }
    }

    // Verificar el estado final
    const finalCheck = await client.query(`
      SELECT nombre, email, rol 
      FROM usuarios 
      WHERE nombre = 'Administrador'
    `);
    
    console.log('🎉 Estado final del usuario administrador:');
    console.log('   Nombre:', finalCheck.rows[0].nombre);
    console.log('   Email:', finalCheck.rows[0].email);
    console.log('   Rol:', finalCheck.rows[0].rol);

  } catch (error) {
    console.error('❌ Error restaurando la columna email:', error.message);
    
    // Intentar solución alternativa si hay error de constraint
    if (error.code === '23505') { // unique constraint violation
      console.log('💡 Intentando solución alternativa...');
      await alternativeSolution(client);
    }
  } finally {
    await client.end();
  }
};

// Solución alternativa para casos complejos
const alternativeSolution = async (client) => {
  try {
    // Eliminar constraint si existe
    await client.query(`
      ALTER TABLE usuarios 
      DROP CONSTRAINT IF EXISTS usuarios_email_unique
    `);
    
    // Actualizar emails duplicados
    await client.query(`
      UPDATE usuarios 
      SET email = 'admin@municipio.com' 
      WHERE nombre = 'Administrador'
    `);
    
    // Recrear constraint
    await client.query(`
      ALTER TABLE usuarios 
      ADD CONSTRAINT usuarios_email_unique UNIQUE (email)
    `);
    
    console.log('✅ Solución alternativa aplicada.');
  } catch (altError) {
    console.error('❌ Error en solución alternativa:', altError.message);
  }
};

restoreEmailColumn();