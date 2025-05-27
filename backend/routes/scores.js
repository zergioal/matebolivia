const express = require("express");
const router = express.Router();
const Puntaje = require("../models/Puntaje"); // Esto está bien

// POST: guardar puntaje
router.post("/", async (req, res) => {
  try {
    const nuevo = new Puntaje(req.body);
    await nuevo.save();
    res.status(201).json({ message: "Puntaje guardado correctamente" });
  } catch (err) {
    console.error("Error al guardar puntaje:", err);
    res.status(500).json({ error: "Error al guardar puntaje" });
  }
});

// GET: obtener top 10 por juego y nivel
router.get("/top", async (req, res) => {
  try {
    const { juego, nivel } = req.query;

    if (!juego || !nivel) {
      return res
        .status(400)
        .json({ error: "Faltan parámetros: juego o nivel" });
    }

    // ✅ Cambiar Score por Puntaje aquí
    const scores = await Puntaje.find({ juego, nivel })
      .sort({ puntaje: -1, tiempo: 1 })
      .limit(10);

    res.json(scores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener los puntajes" });
  }
});

module.exports = router;
