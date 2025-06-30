const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

// POST /api/clases/crear

router.post("/crear", async (req, res) => {
  console.info("[CLASES] [POST /crear] Body recibido:", req.body);

  const { nombre_clase, docente_id } = req.body;

  if (!nombre_clase?.trim() || !docente_id?.trim()) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from("clases")
    .insert([{ nombre_clase, docente_id, codigo }])
    .select();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ mensaje: "Clase creada", clase: data[0] });
});

// POST /api/clases/unirse
router.post("/unirse", async (req, res) => {
  const { estudiante_id, codigo } = req.body;
  console.log("BODY RECIBIDO:", req.body);

  if (!estudiante_id || !codigo) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  // Buscar clase por código
  const { data: clase, error: errClase } = await supabase
    .from("clases")
    .select("id")
    .eq("codigo", codigo)
    .single();

  if (errClase || !clase) {
    return res.status(404).json({ error: "Clase no encontrada" });
  }

  // Verificar si ya está inscrito
  const { data: yaInscrito, error: errVerif } = await supabase
    .from("inscripciones")
    .select("*")
    .eq("clase_id", clase.id)
    .eq("estudiante_id", estudiante_id)
    .maybeSingle();

  if (errVerif) {
    return res
      .status(500)
      .json({ error: "Error al verificar inscripción previa" });
  }

  if (yaInscrito) {
    return res
      .status(409)
      .json({ error: "El estudiante ya está inscrito en esta clase" });
  }

  // Insertar nueva inscripción
  const { data, error } = await supabase
    .from("inscripciones")
    .insert([{ clase_id: clase.id, estudiante_id }])
    .select();

  if (error) return res.status(500).json({ error: error.message });

  res
    .status(200)
    .json({ mensaje: "Inscripción exitosa", inscripcion: data[0] });
});

// GET /api/clases/docente/:id
router.get("/docente/:id", async (req, res) => {
  const { id } = req.params;

  if (!id?.trim()) {
    return res.status(400).json({ error: "ID de docente requerido" });
  }

  const { data, error } = await supabase
    .from("clases")
    .select("*")
    .eq("docente_id", id);

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ clases: data });
});

// GET /api/clases/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id?.trim()) {
    return res.status(400).json({ error: "ID de clase requerido" });
  }

  const { data, error } = await supabase
    .from("clases")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ clase: data });
});

// GET /api/clases/estudiante/:id
router.get("/estudiante/:id", async (req, res) => {
  const { id } = req.params;

  if (!id?.trim()) {
    return res.status(400).json({ error: "ID de estudiante requerido" });
  }

  const { data, error } = await supabase
    .from("inscripciones")
    .select(
      `
      clases (
        id,
        nombre_clase,
        codigo,
        usuarios:docente_id (
          id,
          nombre,
          correo
        )
      )
    `
    )
    .eq("estudiante_id", id);

  if (error) return res.status(500).json({ error: error.message });

  const clases = data.map((item) => item.clases);

  res.status(200).json({ clases });
});

// GET /api/clases/:id/estudiantes-puntajes
router.get("/:id/estudiantes-puntajes", async (req, res) => {
  const { id } = req.params;

  if (!id?.trim()) {
    return res.status(400).json({ error: "ID de clase requerido" });
  }

  // Paso 1: Obtener estudiantes inscritos a la clase
  const { data: inscripciones, error: errorInscripciones } = await supabase
    .from("inscripciones")
    .select("estudiante_id, usuarios (nombre, correo)")
    .eq("clase_id", id);

  if (errorInscripciones)
    return res.status(500).json({ error: errorInscripciones.message });

  // Paso 2: Para cada estudiante, buscar sus puntajes en esta clase
  const resultados = [];

  for (const insc of inscripciones) {
    const estudianteId = insc.estudiante_id;

    const { data: puntajes, error: errorPuntajes } = await supabase
      .from("puntajes")
      .select("puntaje")
      .eq("clase_id", id)
      .eq("estudiante_id", estudianteId);

    const totalPuntaje = puntajes?.reduce((sum, p) => sum + p.puntaje, 0) || 0;

    resultados.push({
      estudiante_id: estudianteId,
      nombre: insc.usuarios.nombre,
      correo: insc.usuarios.correo,
      puntaje_total: totalPuntaje,
    });
  }

  res.status(200).json({ estudiantes: resultados });
});

// GET /api/clases/:id/estudiantes
router.get("/:id/estudiantes", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Obtener estudiantes inscritos
    const { data: inscripciones, error: errIns } = await supabase
      .from("inscripciones")
      .select("estudiante_id")
      .eq("clase_id", id);

    if (errIns) return res.status(500).json({ error: errIns.message });
    if (!inscripciones || inscripciones.length === 0)
      return res.json({ estudiantes: [] });

    const idsEstudiantes = inscripciones.map((i) => i.estudiante_id);

    // 2. Traer info básica del usuario
    const { data: usuarios, error: errUsuarios } = await supabase
      .from("usuarios")
      .select("id, nombre, correo, xp, monedas")
      .in("id", idsEstudiantes);

    if (errUsuarios)
      return res.status(500).json({ error: errUsuarios.message });

    // 3. Calcular juegos jugados y promedio
    const { data: puntajes, error: errPuntajes } = await supabase
      .from("puntajes")
      .select("usuario_id, puntaje, fecha")
      .in("usuario_id", idsEstudiantes);

    if (errPuntajes)
      return res.status(500).json({ error: errPuntajes.message });

    const resultado = usuarios.map((u) => {
      const intentos = puntajes.filter((p) => p.usuario_id === u.id);
      const juegos_jugados = intentos.length;

      const promedio_puntaje =
        juegos_jugados > 0
          ? intentos.reduce((acc, p) => acc + p.puntaje, 0) / juegos_jugados
          : null;

      const ultimo_intento =
        juegos_jugados > 0
          ? intentos
              .map((p) => new Date(p.fecha))
              .sort((a, b) => b - a)[0]
              .toISOString()
          : null;

      return {
        estudiante_id: u.id,
        nombre: u.nombre,
        correo: u.correo,
        nivel: Math.floor((u.xp || 0) / 100),
        xp: u.xp || 0,
        juegos_jugados,
        promedio_puntaje:
          promedio_puntaje !== null ? Number(promedio_puntaje.toFixed(2)) : 0,
        ultimo_intento: ultimo_intento || null,
      };
    });
    console.log("Resultado estudiantes:", resultado);

    res.json({ estudiantes: resultado });
  } catch (err) {
    console.error("Error al obtener estudiantes de la clase:", err);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;
