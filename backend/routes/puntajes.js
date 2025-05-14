import express from "express";
import Puntaje from "../models/Puntaje.js";

const router = express.Router();

// POST: Guardar puntaje
router.post("/", async (req, res) => {
  try {
    const nuevo = new Puntaje(req.body);
    await nuevo.save();
    res.status(201).json({ message: "Puntaje guardado" });
  } catch (err) {
    res.status(500).json({ error: "Error al guardar puntaje" });
  }
});

// GET: Top 10 por juego y nivel
router.get("/top", async (req, res) => {
  try {
    const { juego, nivel } = req.query;
    const top = await Puntaje.find({ juego, nivel })
      .sort({ puntaje: -1, tiempo: 1 }) // mayor puntaje, menor tiempo
      .limit(10)
      .select("nombre unidad puntaje tiempo");
    res.json(top);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener top" });
  }
});

export default router;
