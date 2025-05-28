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
// GET: obtener top 10 por juego (opcional: nivel)
router.get("/top", async (req, res) => {
  try {
    const { juego, nivel } = req.query;

    if (!juego) {
      return res.status(400).json({ error: "Falta el parámetro: juego" });
    }

    const filtro = { juego };
    if (nivel) filtro.nivel = nivel;

    const scores = await Puntaje.find(filtro)
      .sort({ puntaje: -1, tiempo: 1 }) // mayor puntaje, menor tiempo
      .limit(10);

    res.json(scores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener los puntajes" });
  }
});

module.exports = router;
