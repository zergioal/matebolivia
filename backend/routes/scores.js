const express = require("express");
const router = express.Router();
const supabase = require("../supabase");
/* ===============================
   POST /api/scores
=============================== */
router.post("/", async (req, res) => {
  const { usuario_id, juego_id, puntaje, tiempo, nivel } = req.body;

  console.log("🟢 POST /api/scores recibido:", req.body);

  if (!usuario_id || !juego_id || puntaje == null || tiempo == null || !nivel) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  try {
    const nuevoPuntaje = await supabase
      .from("puntajes")
      .insert([{ usuario_id, juego_id, puntaje, tiempo, nivel }])
      .select()
      .single();

    if (!nuevoPuntaje.data) {
      throw new Error(
        nuevoPuntaje.error?.message || "Error al guardar puntaje"
      );
    }

    await supabase.rpc("sumar_xp", {
      p_usuario_id: usuario_id,
      p_cantidad: 10,
    });

    const victoria = await supabase
      .from("usuario_juego_victoria")
      .select("*")
      .eq("usuario_id", usuario_id)
      .eq("juego_id", juego_id)
      .eq("nivel", nivel)
      .maybeSingle();

    if (!victoria.data && puntaje >= 10) {
      await supabase
        .from("usuario_juego_victoria")
        .insert([{ usuario_id, juego_id, nivel }]);

      await supabase.rpc("sumar_monedas", {
        p_usuario_id: usuario_id,
        p_cantidad: 10,
      });
    }

    return res.json({
      mensaje: "✅ Puntaje guardado y actualizado correctamente",
    });
  } catch (error) {
    console.error("❌ Error en POST /api/scores:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

/* ===============================
   GET /api/scores/top
=============================== */
/* ===============================
   GET /api/scores/top
=============================== */
router.get("/top", async (req, res) => {
  const { juego, nivel, clase_id } = req.query;

  if (!juego) {
    return res.status(400).json({ error: 'Parámetro "juego" es obligatorio' });
  }

  try {
    // 1️⃣ Base query SIN limit(10) todavía
    let query = supabase
      .from("puntajes")
      .select(
        `
        usuario_id,
        juego_id,
        puntaje,
        tiempo,
        nivel,
        usuarios (
          nombre
        )
      `
      )
      .eq("juego_id", juego);

    if (nivel) {
      query = query.eq("nivel", nivel);
    }

    // 2️⃣ Ejecutar query (traer TODOS para filtrar mejores)
    const { data: puntajes, error } = await query
      .order("puntaje", { ascending: false })
      .order("tiempo", { ascending: true });

    if (error) throw error;

    if (!puntajes || puntajes.length === 0) {
      return res.json([]);
    }

    // 3️⃣ Filtrar solo mejor intento por usuario
    const mejoresPorUsuario = {};
    puntajes.forEach((p) => {
      const u = mejoresPorUsuario[p.usuario_id];
      if (!u) {
        mejoresPorUsuario[p.usuario_id] = p;
      } else if (
        p.puntaje > u.puntaje ||
        (p.puntaje === u.puntaje && p.tiempo < u.tiempo)
      ) {
        mejoresPorUsuario[p.usuario_id] = p;
      }
    });

    const unicos = Object.values(mejoresPorUsuario)
      .sort((a, b) => {
        if (b.puntaje !== a.puntaje) return b.puntaje - a.puntaje;
        return a.tiempo - b.tiempo;
      })
      .slice(0, 10);

    // 4️⃣ Obtener inscripciones solo de estos usuarios
    const idsUsuarios = unicos.map((p) => p.usuario_id);

    const { data: inscripciones } = await supabase
      .from("inscripciones")
      .select(
        `
        estudiante_id,
        clases (
          nombre_clase
        )
      `
      )
      .in("estudiante_id", idsUsuarios);

    // 5️⃣ Mapear clases por usuario
    const clasesPorUsuario = {};
    if (inscripciones) {
      inscripciones.forEach((i) => {
        if (!clasesPorUsuario[i.estudiante_id]) {
          clasesPorUsuario[i.estudiante_id] = [];
        }
        if (i.clases && i.clases.nombre_clase) {
          clasesPorUsuario[i.estudiante_id].push(i.clases.nombre_clase);
        }
      });
    }

    // 6️⃣ Formatear
    const resultados = unicos.map((p) => ({
      usuario_id: p.usuario_id,
      usuario_nombre: p.usuarios?.nombre || "Anónimo",
      puntaje: p.puntaje,
      tiempo: p.tiempo,
      nivel: p.nivel,
      clases: clasesPorUsuario[p.usuario_id]?.length
        ? clasesPorUsuario[p.usuario_id]
        : ["Sin Clase"],
    }));

    res.json(resultados);
  } catch (err) {
    console.error("Error obteniendo top:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
