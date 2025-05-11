const express = require('express');
const router = express.Router();
const Score = require('../models/Score');

// Guardar puntuación
router.post('/', async (req, res) => {
  try {
    const nuevoScore = new Score(req.body);
    const guardado = await nuevoScore.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo guardar', detalles: err });
  }
});

// Ver los mejores puntajes
router.get('/', async (req, res) => {
  try {
    const scores = await Score.find().sort({ puntaje: -1 }).limit(10);
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

module.exports = router;
