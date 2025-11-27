import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Boletín Municipal</h3>
          <p>Portal oficial de transparencia y acceso a la información pública</p>
        </div>
        
        <div className="footer-section">
          <h4>Contacto</h4>
          <p>📧 info@municipio.gob.ar</p>
          <p>📞 (123) 456-7890</p>
        </div>
        
        <div className="footer-section">
          <h4>Horario de Atención</h4>
          <p>Lunes a Viernes: 8:00 - 14:00</p>
          <p>Municipalidad de la Ciudad</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Gobierno Municipal. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;