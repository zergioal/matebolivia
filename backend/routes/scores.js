const express = require("express");
const router = express.Router();
const Puntaje = require("../models/Puntaje");

// POST: guardar puntaje
router.post("/", async (req, res) => {
  try {
    const { nombre, unidad, puntaje, tiempo, nivel, juego } = req.body;

    // 🔒 Validaciones básicas contra trampas
    if (typeof nombre !== "string" || nombre.trim() === "") {
      return res.status(400).json({ error: "Nombre inválido" });
    }

    if (typeof unidad !== "string" || unidad.trim() === "") {
      return res.status(400).json({ error: "Unidad inválida" });
    }

    if (typeof puntaje !== "number" || puntaje < 0 || puntaje > 10) {
      return res.status(400).json({ error: "Puntaje fuera de rango (0-10)" });
    }

    if (typeof tiempo !== "number" || tiempo < 8 || tiempo > 600) {
      return res.status(400).json({ error: "Tiempo fuera de rango" });
    }

    const nivelesPermitidos = ["facil", "medio", "dificil"];
    if (!nivelesPermitidos.includes(nivel)) {
      return res.status(400).json({ error: "Nivel inválido" });
    }

    const juegosPermitidos = [
      "suma-enteros",
      "resta-enteros",
      "multiplicacion-enteros",
      "division-enteros",
      "fracciones-equivalentes",
    ];
    if (!juegosPermitidos.includes(juego)) {
      return res.status(400).json({ error: "Juego inválido" });
    }

    const nuevo = new Puntaje({
      nombre: nombre.trim(),
      unidad: unidad.trim(),
      puntaje,
      tiempo,
      nivel,
      juego,
    });

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
