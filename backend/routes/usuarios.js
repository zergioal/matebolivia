const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

// POST: Registrar usuario
router.post("/registro", async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nombre,
          rol,
        },
      });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // Insertar en la tabla `usuarios`
    const { error: dbError } = await supabase.from("usuarios").insert([
      {
        id: userId,
        nombre,
        correo: email, // O "email" si tu tabla tiene esa columna
        rol,
        monedas: 0,
        xp: 0,
        fecha_registro: new Date().toISOString(),
      },
    ]);

    if (dbError) {
      return res.status(500).json({
        error: "Usuario creado, pero no se pudo insertar en la base de datos",
      });
    }

    res.status(201).json({ mensaje: "Usuario registrado exitosamente" });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Login (generar token)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(401).json({ error: error.message });
  res.json({
    mensaje: "Login exitoso",
    session: data.session,
    user: data.user,
  });
});

// POST /api/usuarios
router.post("/", async (req, res) => {
  const { nombre, rol, correo } = req.body;

  if (!nombre || !rol || !correo) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  const { data, error } = await supabase
    .from("usuarios")
    .insert([{ nombre, rol, correo, monedas: 0 }])
    .select();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ mensaje: "Usuario creado", usuario: data[0] });
});

//GET /api/usuarios/:id/resumen-estudiante
router.get("/:id/resumen-estudiante", async (req, res) => {
  const { id } = req.params;

  // Traer todos los juegos
  const { data: juegos, error: errJuegos } = await supabase
    .from("juegos")
    .select("id, nombre");

  if (errJuegos) return res.status(500).json({ error: errJuegos.message });

  const resumen = [];

  for (const juego of juegos) {
    // Todos los puntajes de ese juego
    const { data: puntajesJuego, error: errPuntajes } = await supabase
      .from("puntajes")
      .select("puntaje, tiempo, fecha")
      .eq("usuario_id", id)
      .eq("juego_id", juego.id);

    if (errPuntajes)
      return res.status(500).json({ error: `Error en ${juego.nombre}` });

    if (puntajesJuego.length === 0) continue;

    // Calcular mejor puntaje y menor tiempo
    let mejor = puntajesJuego.reduce((acc, curr) => {
      if (
        curr.puntaje > acc.puntaje ||
        (curr.puntaje === acc.puntaje && curr.tiempo < acc.tiempo)
      ) {
        return curr;
      }
      return acc;
    });

    const totalIntentos = puntajesJuego.length;
    const tiempoPromedio =
      puntajesJuego.reduce((acc, p) => acc + p.tiempo, 0) / totalIntentos;

    // Calcular progreso por nivel
    const { data: nivelesData, error: errNiveles } = await supabase
      .from("puntajes")
      .select("nivel")
      .eq("usuario_id", id)
      .eq("juego_id", juego.id);

    if (errNiveles)
      return res
        .status(500)
        .json({ error: `Error al obtener niveles de ${juego.nombre}` });

    const niveles = [...new Set(nivelesData.map((p) => p.nivel))];

    // Calcular puesto del ranking en ese juego
    const { data: topJugadores } = await supabase
      .from("puntajes")
      .select("usuario_id, puntaje, tiempo")
      .eq("juego_id", juego.id);

    const ordenados = topJugadores
      .sort((a, b) => {
        if (b.puntaje !== a.puntaje) return b.puntaje - a.puntaje;
        return a.tiempo - b.tiempo;
      })
      .map((p) => p.usuario_id);

    const puesto = ordenados.indexOf(id) + 1;

    resumen.push({
      juego: juego.nombre,
      mejor_puntaje: mejor.puntaje,
      tiempo_promedio: Number(tiempoPromedio.toFixed(2)),
      fecha_mejor_intento: mejor.fecha,
      intentos: totalIntentos,
      niveles_jugados: niveles.length,
      puesto_ranking: puesto,
    });
  }

  res.json({ estudiante_id: id, resumen });
});

// GET /api/usuarios/:id/intentos-por-juego
router.get("/:id/intentos-por-juego", async (req, res) => {
  const { id } = req.params;

  // Traer todos los juegos
  const { data: juegos, error: errJuegos } = await supabase
    .from("juegos")
    .select("id, nombre");

  if (errJuegos) return res.status(500).json({ error: errJuegos.message });

  const resultado = [];

  for (const juego of juegos) {
    const { data: intentos, error: errIntentos } = await supabase
      .from("puntajes")
      .select("puntaje, tiempo, fecha, nivel")
      .eq("usuario_id", id)
      .eq("juego_id", juego.id)
      .order("fecha", { ascending: false });

    if (errIntentos)
      return res.status(500).json({ error: `Error en ${juego.nombre}` });

    if (intentos.length > 0) {
      resultado.push({
        juego: juego.nombre,
        intentos,
      });
    }
  }

  res.json({ usuario_id: id, juegos: resultado });
});

// GET /api/usuarios/:id/clases-inscritas
router.get("/:id/clases-inscritas", async (req, res) => {
  const { id } = req.params;

  // 1. Obtener inscripciones del estudiante
  const { data: inscripciones, error: errIns } = await supabase
    .from("inscripciones")
    .select("clase_id, fecha_inscripcion, clases(nombre_clase, docente_id)")
    .eq("estudiante_id", id);

  if (errIns) return res.status(500).json({ error: errIns.message });

  const resultado = [];

  for (const ins of inscripciones) {
    const clase = ins.clases;

    // 2. Obtener nombre del docente
    const { data: docente, error: errDoc } = await supabase
      .from("usuarios")
      .select("nombre")
      .eq("id", clase.docente_id)
      .single();

    if (errDoc) return res.status(500).json({ error: errDoc.message });

    // 3. Obtener puntajes del estudiante para juegos de esta clase
    const { data: puntajes, error: errPunt } = await supabase
      .from("puntajes")
      .select("puntaje")
      .eq("usuario_id", id);

    if (errPunt) return res.status(500).json({ error: errPunt.message });

    const promedio =
      puntajes.length > 0
        ? puntajes.reduce((acc, p) => acc + p.puntaje, 0) / puntajes.length
        : null;

    resultado.push({
      clase_id: ins.clase_id,
      nombre_clase: clase.nombre_clase,
      docente: docente.nombre,
      fecha_inscripcion: ins.fecha_inscripcion,
      juegos_jugados: puntajes.length,
      promedio_puntaje: promedio !== null ? Number(promedio.toFixed(2)) : null,
    });
  }

  res.json({ estudiante_id: id, clases: resultado });
});

// GET /api/usuarios/:id/progreso-juego/:juego_id
router.get("/:id/progreso-juego/:juego_id", async (req, res) => {
  const { id, juego_id } = req.params;

  try {
    // Obtener todos los intentos por nivel
    const { data: intentos, error } = await supabase
      .from("puntajes")
      .select("nivel, puntaje, tiempo, fecha")
      .eq("usuario_id", id)
      .eq("juego_id", juego_id);

    if (error) return res.status(500).json({ error: error.message });

    // Agrupar por nivel
    const progresoPorNivel = {};

    for (const intento of intentos) {
      const nivel = intento.nivel;
      if (!progresoPorNivel[nivel]) progresoPorNivel[nivel] = [];

      progresoPorNivel[nivel].push({
        puntaje: intento.puntaje,
        tiempo: intento.tiempo,
        fecha: intento.fecha,
      });
    }

    // Armar respuesta ordenada por nivel
    const resultado = Object.entries(progresoPorNivel)
      .map(([nivel, intentos]) => ({
        nivel,
        intentos,
        mejor_puntaje: Math.max(...intentos.map((i) => i.puntaje)),
        intentos_totales: intentos.length,
      }))
      .sort((a, b) =>
        a.nivel.localeCompare(b.nivel, undefined, { numeric: true })
      );

    res.json({
      usuario_id: id,
      juego_id,
      progreso: resultado,
    });
  } catch (err) {
    console.error("Error en progreso-juego:", err);
    res.status(500).json({ error: "Error al obtener progreso del juego" });
  }
});

// GET /api/usuarios/:id/estadisticas-generales
router.get("/:id/estadisticas-generales", async (req, res) => {
  const { id } = req.params;

  try {
    const { data: puntajes, error } = await supabase
      .from("puntajes")
      .select("juego_id, puntaje, tiempo");

    if (error) return res.status(500).json({ error: error.message });

    // Filtrar por el usuario
    const misPuntajes = puntajes.filter((p) => p.usuario_id === id);

    if (misPuntajes.length === 0) {
      return res.json({
        usuario_id: id,
        mensaje: "Este usuario aún no tiene datos",
      });
    }

    const totalIntentos = misPuntajes.length;
    const promedioPuntaje =
      misPuntajes.reduce((acc, p) => acc + p.puntaje, 0) / totalIntentos;
    const promedioTiempo =
      misPuntajes.reduce((acc, p) => acc + p.tiempo, 0) / totalIntentos;

    // Juego con mayor puntaje
    const maxPuntajePorJuego = {};

    for (const p of misPuntajes) {
      if (!maxPuntajePorJuego[p.juego_id]) {
        maxPuntajePorJuego[p.juego_id] = p.puntaje;
      } else {
        maxPuntajePorJuego[p.juego_id] = Math.max(
          maxPuntajePorJuego[p.juego_id],
          p.puntaje
        );
      }
    }

    const juegoMayorPuntaje = Object.entries(maxPuntajePorJuego).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    // Juego con más intentos
    const intentosPorJuego = {};

    for (const p of misPuntajes) {
      if (!intentosPorJuego[p.juego_id]) {
        intentosPorJuego[p.juego_id] = 1;
      } else {
        intentosPorJuego[p.juego_id]++;
      }
    }

    const juegoMasIntentado = Object.entries(intentosPorJuego).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    // Traer nombres de juegos
    const { data: juegosData, error: errJuegos } = await supabase
      .from("juegos")
      .select("id, nombre");

    const getNombreJuego = (id) =>
      juegosData.find((j) => j.id === id)?.nombre || "Desconocido";

    res.json({
      usuario_id: id,
      total_intentos: totalIntentos,
      promedio_puntaje: Number(promedioPuntaje.toFixed(2)),
      promedio_tiempo: Number(promedioTiempo.toFixed(2)),
      juego_con_mayor_puntaje: getNombreJuego(juegoMayorPuntaje),
      juego_con_mas_intentos: getNombreJuego(juegoMasIntentado),
    });
  } catch (err) {
    console.error("Error en estadísticas generales:", err);
    res.status(500).json({ error: "Error al obtener estadísticas generales" });
  }
});

// GET /api/docente/:id/resumen-clases
router.get("/docente/:id/resumen-clases", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Obtener clases del docente
    const { data: clases, error: errClases } = await supabase
      .from("clases")
      .select("id, nombre_clase")
      .eq("docente_id", id);

    if (errClases) return res.status(500).json({ error: errClases.message });

    const resultado = [];

    for (const clase of clases) {
      const clase_id = clase.id;

      // 2. Estudiantes inscritos
      const { data: inscripciones, error: errIns } = await supabase
        .from("inscripciones")
        .select("estudiante_id")
        .eq("clase_id", clase_id);

      if (errIns) return res.status(500).json({ error: errIns.message });

      const estudiantes = inscripciones.map((i) => i.estudiante_id);

      if (estudiantes.length === 0) {
        resultado.push({
          clase_id,
          nombre_clase: clase.nombre_clase,
          estudiantes: 0,
          promedio_puntaje: 0,
          intentos_totales: 0,
          juego_mas_jugado: "Ninguno",
        });
        continue;
      }

      // 3. Obtener puntajes de los estudiantes
      const { data: puntajes, error: errPuntajes } = await supabase
        .from("puntajes")
        .select("juego_id, usuario_id, puntaje")
        .in("usuario_id", estudiantes);

      if (errPuntajes)
        return res.status(500).json({ error: errPuntajes.message });

      const totalIntentos = puntajes.length;

      const promedioPuntaje =
        totalIntentos > 0
          ? puntajes.reduce((acc, p) => acc + p.puntaje, 0) / totalIntentos
          : 0;

      // Contar juegos más jugados
      const juegosContador = {};
      for (const p of puntajes) {
        juegosContador[p.juego_id] = (juegosContador[p.juego_id] || 0) + 1;
      }

      const juegoMasJugadoId =
        Object.entries(juegosContador).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        null;

      // Traer nombre del juego
      let nombreJuego = "Ninguno";
      if (juegoMasJugadoId) {
        const { data: juegoData } = await supabase
          .from("juegos")
          .select("nombre")
          .eq("id", juegoMasJugadoId)
          .single();

        nombreJuego = juegoData?.nombre || "Desconocido";
      }

      resultado.push({
        clase_id,
        nombre_clase: clase.nombre_clase,
        estudiantes: estudiantes.length,
        promedio_puntaje: Number(promedioPuntaje.toFixed(2)),
        intentos_totales: totalIntentos,
        juego_mas_jugado: nombreJuego,
      });
    }

    res.json({ docente_id: id, clases: resultado });
  } catch (err) {
    console.error("Error en resumen de clases:", err);
    res.status(500).json({ error: "Error al obtener resumen de clases" });
  }
});

// GET /api/usuarios/:id/logros
router.get("/:id/logros", async (req, res) => {
  const { id } = req.params;

  try {
    const logrosCompletados = [];

    // Obtener juegos
    const { data: juegos, error: errJuegos } = await supabase
      .from("juegos")
      .select("id");
    if (errJuegos) throw errJuegos;

    const juegoIds = juegos.map((j) => j.id);

    // Obtener puntajes del usuario
    const { data: puntajes, error: errPuntajes } = await supabase
      .from("puntajes")
      .select("juego_id, puntaje, tiempo, nivel")
      .eq("usuario_id", id);
    if (errPuntajes) throw errPuntajes;

    // Obtener todas las insignias tipo logro
    const { data: insignias, error: errInsig } = await supabase
      .from("insignias")
      .select("*")
      .eq("tipo", "logro");
    if (errInsig) throw errInsig;

    // Obtener insignias ya ganadas por el usuario
    const { data: yaGanadas } = await supabase
      .from("usuario_insignia")
      .select("insignia_id")
      .eq("usuario_id", id);

    const idsGanadas = new Set(yaGanadas.map((i) => i.insignia_id));

    // Mapear logros por nombre
    const mapaInsignias = Object.fromEntries(
      insignias.map((i) => [i.nombre, i])
    );

    // --- Lógica de logros ---

    // 🏆 Constante
    const jugados = new Set(puntajes.map((p) => p.juego_id));
    if (
      jugados.size === juegoIds.length &&
      !idsGanadas.has(mapaInsignias["🏆 Constante"].id)
    ) {
      await registrarInsignia(id, mapaInsignias["🏆 Constante"].id);
    }

    // 💯 Puntaje Perfecto
    if (
      puntajes.some((p) => p.puntaje === 10) &&
      !idsGanadas.has(mapaInsignias["💯 Puntaje Perfecto"].id)
    ) {
      await registrarInsignia(id, mapaInsignias["💯 Puntaje Perfecto"].id);
    }

    // ⚡ Rápido
    if (
      puntajes.some((p) => p.tiempo < 10) &&
      !idsGanadas.has(mapaInsignias["⚡ Rápido"].id)
    ) {
      await registrarInsignia(id, mapaInsignias["⚡ Rápido"].id);
    }

    // 📚 Estudioso
    if (
      puntajes.length >= 50 &&
      !idsGanadas.has(mapaInsignias["📚 Estudioso"].id)
    ) {
      await registrarInsignia(id, mapaInsignias["📚 Estudioso"].id);
    }

    // 🔥 Nivelador
    const nivelesPorJuego = {};
    for (const p of puntajes) {
      if (!nivelesPorJuego[p.juego_id]) nivelesPorJuego[p.juego_id] = new Set();
      nivelesPorJuego[p.juego_id].add(p.nivel);
    }

    const tieneTresNiveles = Object.values(nivelesPorJuego).some(
      (niveles) => niveles.size >= 3
    );
    if (tieneTresNiveles && !idsGanadas.has(mapaInsignias["🔥 Nivelador"].id)) {
      await registrarInsignia(id, mapaInsignias["🔥 Nivelador"].id);
    }

    // --- Devolver insignias ganadas ---

    const { data: logrosFinales, error: errorFinal } = await supabase
      .from("usuario_insignia")
      .select("fecha, insignias (nombre, descripcion, tipo)")
      .eq("usuario_id", id);

    if (errorFinal) throw errorFinal;

    res.json({ usuario_id: id, logros: logrosFinales });
  } catch (err) {
    console.error("Error en logros:", err);
    res.status(500).json({ error: "Error al procesar logros" });
  }
});

// Función auxiliar para registrar insignia si no está
async function registrarInsignia(usuario_id, insignia_id) {
  return await supabase
    .from("usuario_insignia")
    .insert([{ usuario_id, insignia_id }]);
}

// GET /api/usuarios/:id/insignias
router.get("/:id/insignias", async (req, res) => {
  const { id } = req.params;

  if (!id?.trim()) {
    return res.status(400).json({ error: "ID de usuario requerido" });
  }

  const { data, error } = await supabase
    .from("usuario_insignia")
    .select(
      `
      id,
      fecha,
      insignias (
        id,
        nombre,
        descripcion,
        imagen_url,
        tipo
      )
    `
    )
    .eq("usuario_id", id);

  if (error) return res.status(500).json({ error: error.message });

  // Extraemos solo la parte útil de cada objeto
  const insignias = data.map((i) => ({
    id: i.insignias.id,
    nombre: i.insignias.nombre,
    descripcion: i.insignias.descripcion,
    imagen_url: i.insignias.imagen_url,
    tipo: i.insignias.tipo,
    fecha_obtenida: i.fecha,
  }));

  res.status(200).json({ insignias });
});

// POST /api/usuarios/:id/comprar-avatar
router.post("/:id/comprar-avatar", async (req, res) => {
  const { id } = req.params;
  const { avatar_id } = req.body;

  if (!avatar_id) {
    return res.status(400).json({ error: "Falta avatar_id" });
  }

  // 1. Verificar si ya compró ese avatar
  const { data: yaTiene, error: errorCheck } = await supabase
    .from("usuario_avatar")
    .select("*")
    .eq("usuario_id", id)
    .eq("avatar_id", avatar_id)
    .maybeSingle();

  if (errorCheck) {
    return res.status(500).json({ error: errorCheck.message });
  }

  if (yaTiene) {
    return res.status(409).json({ error: "Avatar ya comprado previamente" });
  }

  // 2. Obtener el avatar y su precio
  const { data: avatar, error: errorAvatar } = await supabase
    .from("avatares")
    .select("precio")
    .eq("id", avatar_id)
    .single();

  if (errorAvatar) {
    return res.status(404).json({ error: "Avatar no encontrado" });
  }

  // 3. Obtener monedas del usuario
  const { data: usuario, error: errorUser } = await supabase
    .from("usuarios")
    .select("monedas")
    .eq("id", id)
    .single();

  if (errorUser) {
    return res.status(500).json({ error: "Usuario no encontrado" });
  }

  if (usuario.monedas < avatar.precio) {
    return res.status(400).json({ error: "Monedas insuficientes" });
  }

  // 4. Descontar monedas y registrar la compra (transacción simulada)
  const nuevasMonedas = usuario.monedas - avatar.precio;

  const { error: errorUpdate } = await supabase
    .from("usuarios")
    .update({ monedas: nuevasMonedas })
    .eq("id", id);

  if (errorUpdate) {
    return res.status(500).json({ error: "Error al descontar monedas" });
  }

  const { error: errorInsert } = await supabase
    .from("usuario_avatar")
    .insert([{ usuario_id: id, avatar_id }]);

  if (errorInsert) {
    return res.status(500).json({ error: "Error al registrar compra" });
  }

  // 5. Obtener todos los avatares comprados
  const { data: avatares, error: errorLista } = await supabase
    .from("usuario_avatar")
    .select("id, avatar_id, avatares(nombre, imagen_url, precio), activo")
    .eq("usuario_id", id);

  if (errorLista) {
    return res.status(500).json({ error: errorLista.message });
  }

  res.status(200).json({
    mensaje: "Avatar comprado exitosamente",
    monedas_restantes: nuevasMonedas,
    avatares_comprados: avatares,
  });
});

// POST /api/usuarios/:id/activar-avatar
router.post("/:id/activar-avatar", async (req, res) => {
  const { id } = req.params;
  const { avatar_id } = req.body;

  if (!avatar_id) {
    return res.status(400).json({ error: "Falta el ID del avatar" });
  }

  // Verificar si el avatar fue comprado por el usuario
  const { data: comprado, error: errCompra } = await supabase
    .from("usuario_avatar")
    .select("*")
    .eq("usuario_id", id)
    .eq("avatar_id", avatar_id)
    .single();

  if (errCompra || !comprado) {
    return res.status(400).json({ error: "Avatar no comprado por el usuario" });
  }

  // Desactivar cualquier avatar activo actualmente
  const { error: errDesactivar } = await supabase
    .from("usuario_avatar")
    .update({ activo: false })
    .eq("usuario_id", id);

  if (errDesactivar) {
    return res
      .status(500)
      .json({ error: "Error al desactivar avatar anterior" });
  }

  // Activar el nuevo avatar
  const { error: errActivar } = await supabase
    .from("usuario_avatar")
    .update({ activo: true })
    .eq("usuario_id", id)
    .eq("avatar_id", avatar_id);

  if (errActivar) {
    return res.status(500).json({ error: "Error al activar nuevo avatar" });
  }

  res.status(200).json({ mensaje: "Avatar activado correctamente" });
});

// GET /api/usuarios/:id/avatares ordenado (activo primero)
router.get("/:id/avatares", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("usuario_avatar")
    .select("avatar_id, activo, avatares(nombre, imagen_url, precio)")
    .eq("usuario_id", id)
    .order("activo", { ascending: false }); // Muestra primero los avatares activos

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ avatares: data });
});

// GET /api/usuarios/:id/resumen
router.get("/:id/resumen", async (req, res) => {
  const { id } = req.params;

  const { data: usuario, error: errorUsuario } = await supabase
    .from("usuarios")
    .select("nombre, correo, nivel, xp, monedas")
    .eq("id", id)
    .single();

  const { data: avatar, error: errorAvatar } = await supabase
    .from("usuario_avatar")
    .select("avatares (nombre, imagen_url)")
    .eq("usuario_id", id)
    .eq("activo", true)
    .maybeSingle();

  const { count: logrosCount } = await supabase
    .from("usuario_insignia")
    .select("*", { count: "exact", head: true })
    .eq("usuario_id", id);

  const { count: juegosCount } = await supabase
    .from("puntajes")
    .select("*", { count: "exact", head: true })
    .eq("usuario_id", id);

  const { count: clasesCount } = await supabase
    .from("inscripciones")
    .select("*", { count: "exact", head: true })
    .eq("estudiante_id", id);

  res.status(200).json({
    usuario,
    avatar_activo: avatar?.avatares || null,
    logros: logrosCount,
    juegos_jugados: juegosCount,
    clases_inscritas: clasesCount,
  });
});

// GET /api/usuarios/:id/panel
router.get("/:id/panel", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("nombre, monedas, xp, nivel")

      .eq("id", id)
      .single();

    if (error) {
      return res
        .status(400)
        .json({ error: "Error al obtener datos del usuario" });
    }

    // Si insignias es un array o viene de una tabla relacionada, ajusta según tu estructura.
    res.json({
      nombre: data.nombre,
      monedas: data.monedas,
      nivel: Math.floor(data.xp / 100), // ejemplo
      avatar_url: data.avatar_url,
      insignias: data.insignias || [], // asegúrate que sea un array, o consulta de otra tabla si es FK
    });
  } catch (err) {
    console.error("Error en GET /:id/panel", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// PUT /api/usuarios/:id/actualizar
router.put("/:id/actualizar", async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, password } = req.body;

  if (!nombre || !correo) {
    return res.status(400).json({ error: "Nombre y correo son obligatorios." });
  }

  try {
    // 1️⃣ Actualizar datos en la tabla usuarios
    const { error: errorUpdate } = await supabase
      .from("usuarios")
      .update({ nombre, correo })
      .eq("id", id);

    if (errorUpdate) {
      return res.status(500).json({ error: errorUpdate.message });
    }

    // 2️⃣ Si envió nueva contraseña
    if (password?.trim()) {
      const { error: errorPassword } = await supabase.auth.admin.updateUserById(
        id,
        {
          password,
        }
      );

      if (errorPassword) {
        return res.status(500).json({
          error: "Datos actualizados pero no se pudo cambiar la contraseña.",
        });
      }
    }

    res.json({ mensaje: "Perfil actualizado correctamente." });
  } catch (err) {
    console.error("Error en actualizar perfil:", err);
    res.status(500).json({ error: "Error del servidor." });
  }
});

// GET /api/usuarios/:id/perfil-completo
router.get("/:id/perfil-completo", async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Datos básicos del usuario
    const { data: usuario, error: errorUsuario } = await supabase
      .from("usuarios")
      .select("nombre, monedas, xp, nivel")
      .eq("id", id)
      .single();

    if (errorUsuario || !usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // 2️⃣ Insignias obtenidas
    const { data: insignias, error: errorInsignias } = await supabase
      .from("usuario_insignia")
      .select("insignias (nombre, descripcion, imagen_url)")
      .eq("usuario_id", id);

    if (errorInsignias) {
      return res.status(500).json({ error: errorInsignias.message });
    }

    const listaInsignias = insignias.map((i) => i.insignias);

    // 3️⃣ Avatares comprados
    const { data: avatares, error: errorAvatares } = await supabase
      .from("usuario_avatar")
      .select("activo, avatares (nombre, imagen_url)")
      .eq("usuario_id", id);

    if (errorAvatares) {
      return res.status(500).json({ error: errorAvatares.message });
    }

    const listaAvatares = avatares.map((a) => ({
      nombre: a.avatares.nombre,
      imagen_url: a.avatares.imagen_url,
      activo: a.activo,
    }));

    // 4️⃣ Respuesta
    res.json({
      usuario,
      insignias: listaInsignias,
      avatares: listaAvatares,
    });
  } catch (err) {
    console.error("Error en /:id/perfil-completo:", err);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;
