const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Iniciar sesión
router.post('/login', [
  body('email').isEmail().withMessage('Email válido requerido'),
  body('password').exists().withMessage('Contraseña requerida')
], async (req, res) => {
  try {
    console.log('📥 Request body recibido:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Errores de validación:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log('🔐 Intentando login para:', email);

    // Verificar usuario
    const user = await Usuario.findByEmail(email);
    if (!user) {
      console.log('❌ Usuario no encontrado:', email);
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    console.log('✅ Usuario encontrado:', user.email);

    // Verificar contraseña
    const isMatch = await Usuario.comparePassword(password, user.password);
    console.log('🔑 Resultado de comparación de contraseña:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Contraseña incorrecta para usuario:', email);
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    console.log('✅ Login exitoso para:', email);

    // Generar token JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
          }
        });
      }
    );
  } catch (error) {
    console.error('💥 Error en login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener usuario actual
router.get('/user', auth, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id);
    res.json(user);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;