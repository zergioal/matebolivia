const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

// GET /api/ranking/global
// GET /api/ranking/global
router.get("/global", async (req, res) => {
  try {
    const { data, error } = await supabase.from("puntajes").select(`
        usuario_id,
        puntaje,
        usuarios:usuario_id (
          nombre,
          inscripciones (
            clases (
              nombre_clase
            )
          )
        )
      `);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.json({ jugadores: [] });
    }

    // Sumar puntajes por usuario
    const acumulado = {};
    data.forEach((p) => {
      if (!p.usuarios) return;

      if (!acumulado[p.usuario_id]) {
        // Extraer la clase (puede haber varias inscripciones, usamos la primera)
        let claseNombre = null;
        if (p.usuarios.inscripciones && p.usuarios.inscripciones.length > 0) {
          claseNombre =
            p.usuarios.inscripciones[0].clases?.nombre_clase || null;
        }

        acumulado[p.usuario_id] = {
          usuario_id: p.usuario_id,
          nombre: p.usuarios.nombre,
          clase: claseNombre,
          puntos: 0,
        };
      }
      acumulado[p.usuario_id].puntos += p.puntaje;
    });

    // Ordenar y tomar top 10
    const ranking = Object.values(acumulado)
      .sort((a, b) => b.puntos - a.puntos)
      .slice(0, 10);

    res.json({ jugadores: ranking });
  } catch (err) {
    console.error("Error en /api/ranking/global:", err);
    res.status(500).json({ error: err.message || "Error desconocido." });
  }
});

module.exports = router;
