const express = require('express');
const router = express.Router();
const Resolucion = require('../models/Resolucion');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { body, validationResult } = require('express-validator');

router.get('/', async (req, res) => {
  try {
    const {
      categoria,
      fechaDesde,
      fechaHasta,
      fechaPromulgacionDesde,
      fechaPromulgacionHasta,
      fechaSancionDesde,
      fechaSancionHasta,
      page = 1,
      limit = 10,
      search = '',
      tags = []
    } = req.query;

    const filters = {
      categoria,
      fechaDesde,
      fechaHasta,
      fechaPromulgacionDesde,
      fechaPromulgacionHasta,
      fechaSancionDesde,
      fechaSancionHasta,
      page: parseInt(page),
      limit: parseInt(limit),
      search: search.trim()
    };

    if (!req.user) {
      filters.estado = 'publicado';
    } else {
      filters.estado = req.query.estado || 'publicado';
    }

    if (tags) {
      if (typeof tags === 'string') {
        filters.tags = tags.split(',');
      } else if (Array.isArray(tags)) {
        filters.tags = tags;
      }
    }

    console.log('🔍 Filtros aplicados:', filters);

    const [resoluciones, total] = await Promise.all([
      Resolucion.findAll(filters),
      Resolucion.count(filters)
    ]);

    res.json({
      resoluciones,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error obteniendo resoluciones:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/tags', async (req, res) => {
  try {
    const tags = await Resolucion.getAllTags();
    res.json(tags);
  } catch (error) {
    console.error('Error obteniendo etiquetas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const resolucion = await Resolucion.findById(req.params.id);
    if (!resolucion) {
      return res.status(404).json({ message: 'Resolución no encontrada' });
    }

    const [vinculosSalientes, vinculosEntrantes] = await Promise.all([
      Resolucion.getVinculos(req.params.id),
      Resolucion.getVinculosHacia(req.params.id)
    ]);

    resolucion.vinculos_salientes = vinculosSalientes;
    resolucion.vinculos_entrantes = vinculosEntrantes;

    res.json(resolucion);
  } catch (error) {
    console.error('Error obteniendo resolución:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post(
  '/',
  auth,
  upload,
  [
    body('titulo').notEmpty().withMessage('El título es requerido'),
    body('contenido').notEmpty().withMessage('El contenido es requerido'),
    body('categoria_id').isInt().withMessage('La categoría es requerida'),
    body('numero').notEmpty().withMessage('El número es requerido')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const archivo_adjunto = req.files['archivo_adjunto'] ? req.files['archivo_adjunto'][0].filename : null;
      const anexos = req.files['anexos'] ? req.files['anexos'].map(file => file.filename) : [];

      const resolucionData = {
        ...req.body,
        archivo_adjunto,
        anexos,
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        fecha_promulgacion: req.body.fecha_promulgacion || null,
        fecha_sancion: req.body.fecha_sancion || null
      };

      const resolucion = await Resolucion.create(resolucionData);

      if (req.body.vinculos) {
        const vinculos = JSON.parse(req.body.vinculos);
        for (const vinculo of vinculos) {
          await Resolucion.addVinculo(resolucion.id, vinculo.resolucion_vinculada_id, vinculo.tipo_vinculo);
        }
      }

      res.status(201).json(resolucion);
    } catch (error) {
      console.error('Error creando resolución:', error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }
);

router.put(
  '/:id',
  auth,
  upload,
  async (req, res) => {
    try {
      const resolucionData = { ...req.body };
      
      if (req.files['archivo_adjunto']) {
        resolucionData.archivo_adjunto = req.files['archivo_adjunto'][0].filename;
      }
      if (req.files['anexos']) {
        resolucionData.anexos = req.files['anexos'].map(file => file.filename);
      } else if (req.body.anexos) {
        resolucionData.anexos = JSON.parse(req.body.anexos);
      }
      
      if (req.body.tags) {
        resolucionData.tags = JSON.parse(req.body.tags);
      }

      resolucionData.fecha_promulgacion = req.body.fecha_promulgacion || null;
      resolucionData.fecha_sancion = req.body.fecha_sancion || null;

      const resolucion = await Resolucion.update(req.params.id, resolucionData);
      if (!resolucion) {
        return res.status(404).json({ message: 'Resolución no encontrada' });
      }

      if (req.body.vinculos) {
        const vinculosExistentes = await Resolucion.getVinculos(req.params.id);
        for (const vinculo of vinculosExistentes) {
          await Resolucion.removeVinculo(vinculo.id);
        }

        const vinculos = JSON.parse(req.body.vinculos);
        for (const vinculo of vinculos) {
          await Resolucion.addVinculo(resolucion.id, vinculo.resolucion_vinculada_id, vinculo.tipo_vinculo);
        }
      }
      
      res.json(resolucion);
    } catch (error) {
      console.error('Error actualizando resolución:', error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }
);

router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Resolucion.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Resolución no encontrada' });
    }
    res.json({ message: 'Resolución eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando resolución:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.get('/:id/vinculos', auth, async (req, res) => {
  try {
    const vinculos = await Resolucion.getVinculos(req.params.id);
    res.json(vinculos);
  } catch (error) {
    console.error('Error obteniendo vínculos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/:id/vinculos', auth, async (req, res) => {
  try {
    const { resolucion_vinculada_id, tipo_vinculo } = req.body;
    const vinculo = await Resolucion.addVinculo(req.params.id, resolucion_vinculada_id, tipo_vinculo);
    res.status(201).json(vinculo);
  } catch (error) {
    console.error('Error agregando vínculo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.delete('/vinculos/:id', auth, async (req, res) => {
  try {
    const deleted = await Resolucion.removeVinculo(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Vínculo no encontrado' });
    }
    res.json({ message: 'Vínculo eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando vínculo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;