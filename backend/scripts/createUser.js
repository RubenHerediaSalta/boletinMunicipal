const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createUser = async () => {
  console.log('🔧 Creación de Usuario Administrador');
  console.log('=====================================\n');

  try {
    // Solicitar datos del usuario
    const nombre = await question('Nombre completo: ');
    const email = await question('Email: ');
    const password = await question('Contraseña: ');
    
    if (!nombre || !email || !password) {
      console.error('❌ Todos los campos son requeridos');
      process.exit(1);
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Email inválido');
      process.exit(1);
    }

    // Validar contraseña
    if (password.length < 6) {
      console.error('❌ La contraseña debe tener al menos 6 caracteres');
      process.exit(1);
    }

    console.log('\n📡 Conectando a la base de datos...');

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

    // Verificar si el email ya existe
    const checkUser = await client.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (checkUser.rows.length > 0) {
      console.error('❌ Ya existe un usuario con ese email');
      await client.end();
      process.exit(1);
    }

    // Hash de la contraseña
    console.log('🔐 Encriptando contraseña...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insertar usuario
    console.log('💾 Creando usuario...');
    const result = await client.query(
      `INSERT INTO usuarios (nombre, email, password, rol) 
       VALUES ($1, $2, $3, 'admin') 
       RETURNING id, nombre, email, rol, created_at`,
      [nombre, email, hashedPassword]
    );

    const newUser = result.rows[0];

    console.log('\n✅ ¡Usuario creado exitosamente!');
    console.log('=====================================');
    console.log(`ID: ${newUser.id}`);
    console.log(`Nombre: ${newUser.nombre}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Rol: ${newUser.rol}`);
    console.log(`Creado: ${newUser.created_at}`);
    console.log('=====================================\n');

    console.log('💡 Guarda estas credenciales en un lugar seguro:');
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: [la que ingresaste]\n`);

    await client.end();
    rl.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
};

// Ejecutar
createUser();
