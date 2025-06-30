const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

// POST /api/juegos/cargar
router.post("/cargar", async (req, res) => {
  const juegos = [
    { nombre: "Suma de enteros" },
    { nombre: "Resta de enteros" },
    { nombre: "Multiplicación de enteros" },
    { nombre: "División de enteros" },
    { nombre: "Fracciones equivalentes" },
    { nombre: "Juego de porcentajes" },
    { nombre: "Juego de razones" },
    { nombre: "Aventura algebraica" },
    { nombre: "Tablas de multiplicar" },
    { nombre: "Carrera de funciones" },
  ];

  const { data, error } = await supabase.from("juegos").insert(juegos).select();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ mensaje: "Juegos insertados correctamente", data });
});

// GET /api/juegos/:juego_id/ranking?clase_id=...
router.get("/:juego_id/ranking", async (req, res) => {
  const { juego_id } = req.params;
  const { clase_id } = req.query;

  if (!juego_id || !clase_id) {
    return res.status(400).json({ error: "Faltan parámetros requeridos" });
  }

  try {
    // 1. Obtener todos los estudiantes inscritos en la clase
    const { data: inscripciones, error: errIns } = await supabase
      .from("inscripciones")
      .select("estudiante_id, usuarios:estudiante_id ( nombre )")
      .eq("clase_id", clase_id);

    if (errIns) throw errIns;

    const estudianteIds = inscripciones.map((i) => i.estudiante_id);

    // 2. Obtener el mejor intento (mayor puntaje y menor tiempo) por estudiante
    const { data: puntajesRaw, error: errPuntajes } = await supabase
      .from("puntajes")
      .select("usuario_id, puntaje, tiempo, fecha")
      .eq("juego_id", juego_id)
      .in("usuario_id", estudianteIds);

    if (errPuntajes) throw errPuntajes;

    // 3. Reducir a mejor intento por estudiante
    const mejoresPorEstudiante = {};
    for (const p of puntajesRaw) {
      const actual = mejoresPorEstudiante[p.usuario_id];
      if (
        !actual ||
        p.puntaje > actual.puntaje ||
        (p.puntaje === actual.puntaje && p.tiempo < actual.tiempo)
      ) {
        mejoresPorEstudiante[p.usuario_id] = p;
      }
    }

    // 4. Ordenar y asignar puestos
    const ranking = Object.entries(mejoresPorEstudiante)
      .map(([usuario_id, datos]) => {
        const nombre =
          inscripciones.find((i) => i.estudiante_id === usuario_id)?.usuarios
            .nombre || "Desconocido";

        return {
          usuario_id,
          nombre,
          puntaje: datos.puntaje,
          tiempo: datos.tiempo,
          fecha: datos.fecha,
        };
      })
      .sort((a, b) => {
        if (b.puntaje !== a.puntaje) return b.puntaje - a.puntaje;
        return a.tiempo - b.tiempo;
      })
      .map((item, index) => ({
        ...item,
        puesto: index + 1,
      }));

    res.status(200).json({ juego_id, clase_id, ranking });
  } catch (err) {
    console.error("Error en ranking:", err);
    res.status(500).json({ error: "Error al obtener ranking" });
  }
});

module.exports = router;
