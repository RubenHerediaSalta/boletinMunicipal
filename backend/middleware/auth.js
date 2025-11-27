const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const auth = async (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ message: 'No hay token, autorización denegada' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Usuario.findById(decoded.user.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Token no válido' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Error en middleware auth:', error);
    res.status(401).json({ message: 'Token no válido' });
  }
};

module.exports = auth;