import { BASE_API_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const usuarioId = localStorage.getItem("usuario_id");
  const usuarioRol = localStorage.getItem("usuario_rol");

  if (!usuarioId || !usuarioRol) {
    alert("Usuario no autenticado. Por favor, inicia sesión.");
    window.location.href = "login.html";
    return;
  }
  // Cargar datos personales
  cargarDatosPersonales(usuarioId);

  // Mostrar el área del usuario

  if (usuarioRol === "docente") {
    document.getElementById("panel-docente").style.display = "block";
    cargarPanelDocente(usuarioId);
  } else if (usuarioRol === "estudiante") {
    document.getElementById("panel-estudiante").style.display = "block";
    cargarPanelEstudiante(usuarioId);
  }
});

/* ========== DOCENTE ========== */
async function cargarPanelDocente(docenteId) {
  await mostrarClasesDocente(docenteId);
  await mostrarResumenClasesDocente(docenteId);

  // Botón crear
  document
    .getElementById("btn-crear-clase")
    .addEventListener("click", async () => {
      const nombreClase = document.getElementById("nombre-clase").value.trim();
      if (!nombreClase) return alert("Debes escribir un nombre para la clase.");

      try {
        const res = await fetch(`${BASE_API_URL}/clases/crear`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre_clase: nombreClase,
            docente_id: docenteId,
          }),
        });
        const data = await res.json();

        if (res.ok) {
          document.getElementById(
            "codigo-clase-generado"
          ).textContent = `✅ Código generado: ${data.clase.codigo}`;
          document.getElementById("nombre-clase").value = "";
          await mostrarClasesDocente(docenteId);
        } else {
          alert(data.error || "Error al crear la clase.");
        }
      } catch (err) {
        console.error(err);
        alert("Error de conexión con el servidor.");
      }
    });
}

async function mostrarClasesDocente(docenteId) {
  const ul = document.getElementById("lista-clases-docente");
  ul.innerHTML = "<li class='list-group-item'>Cargando...</li>";

  try {
    const res = await fetch(`${BASE_API_URL}/clases/docente/${docenteId}`);
    const data = await res.json();

    if (res.ok) {
      renderClasesDocente(data.clases);
    } else {
      ul.innerHTML = `<li class='list-group-item text-danger'>${data.error}</li>`;
    }
  } catch (err) {
    console.error(err);
    ul.innerHTML =
      "<li class='list-group-item text-danger'>Error al cargar clases.</li>";
  }
}

/* ========== ESTUDIANTE ========== */
async function cargarPanelEstudiante(estudianteId) {
  await cargarDatosPersonales(estudianteId);
  await mostrarClasesEstudiante(estudianteId);
  await mostrarResumenJuegosEstudiante(estudianteId);

  // Botón unirse
  document
    .getElementById("btn-unirse-clase")
    .addEventListener("click", async () => {
      const codigo = document.getElementById("codigo-clase").value.trim();
      const mensaje = document.getElementById("mensaje-inscripcion");
      if (!codigo) return alert("Debes ingresar un código de clase.");

      try {
        const res = await fetch(`${BASE_API_URL}/clases/unirse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estudiante_id: estudianteId, codigo }),
        });
        const data = await res.json();

        // Resetear estilos
        mensaje.className = "alert";
        mensaje.classList.add("d-none");

        if (res.ok) {
          mensaje.textContent = "✅ Inscripción exitosa.";
          mensaje.classList.remove("d-none", "alert-danger");
          mensaje.classList.add("alert-success");
          document.getElementById("codigo-clase").value = "";
          await mostrarClasesEstudiante(estudianteId);
        } else {
          mensaje.textContent = `❌ ${data.error}`;
          mensaje.classList.remove("d-none", "alert-success");
          mensaje.classList.add("alert-danger");
        }
      } catch (err) {
        console.error(err);
        mensaje.textContent = "❌ Error de conexión con el servidor.";
        mensaje.classList.add("text-danger");
      }
    });
}

async function mostrarClasesEstudiante(estudianteId) {
  const contenedor = document.getElementById("lista-clases-estudiante");
  contenedor.innerHTML = `<p class="text-muted">Cargando...</p>`;

  try {
    const res = await fetch(
      `${BASE_API_URL}/usuarios/${estudianteId}/clases-inscritas`
    );
    const data = await res.json();

    if (res.ok) {
      if (!data.clases || data.clases.length === 0) {
        contenedor.innerHTML = `<p class="text-muted">No estás inscrito en ninguna clase aún.</p>`;
        return;
      }

      // Construir HTML más bonito
      let html = `<div class="row g-3">`;
      data.clases.forEach((clase) => {
        const fecha = new Date(clase.fecha_inscripcion).toLocaleDateString(
          "es-BO",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }
        );

        html += `
          <div class="col-md-6">
            <div class="card shadow-sm border-primary h-100">
              <div class="card-body">
                <h5 class="card-title">${clase.nombre_clase}</h5>
                <p class="card-text mb-1"><strong>Docente:</strong> ${
                  clase.docente
                }</p>
                <p class="card-text mb-1"><strong>Fecha de inscripción:</strong> ${fecha}</p>
                <p class="card-text mb-1"><strong>Juegos jugados:</strong> ${
                  clase.juegos_jugados
                }</p>
                <p class="card-text"><strong>Promedio de puntaje:</strong> ${
                  clase.promedio_puntaje ?? "N/A"
                }</p>
              </div>
            </div>
          </div>
        `;
      });
      html += `</div>`;

      contenedor.innerHTML = html;
    } else {
      contenedor.innerHTML = `<p class="text-danger">${
        data.error || "Error al obtener datos"
      }</p>`;
    }
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p class="text-danger">❌ Error al conectar con el servidor.</p>`;
  }
}

async function mostrarResumenJuegosEstudiante(estudianteId) {
  const contenedor = document.getElementById("resumen-juegos-estudiante");
  contenedor.innerHTML = `<p class="text-muted">Cargando datos de progreso...</p>`;

  try {
    const res = await fetch(
      `${BASE_API_URL}/usuarios/${estudianteId}/resumen-estudiante`
    );
    const data = await res.json();

    if (res.ok) {
      if (data.resumen.length === 0) {
        contenedor.innerHTML = `<p class="text-muted">Aún no tienes datos de juegos registrados.</p>`;
        return;
      }

      // Construir la tabla
      let html = `
        <div class="table-responsive">
          <table class="table table-striped table-bordered">
            <thead class="table-dark">
              <tr>
                <th>Juego</th>
                <th>Mejor Puntaje</th>
                <th>Tiempo Promedio (s)</th>
                <th>Intentos</th>
                <th>Niveles Jugados</th>
                <th>Puesto Ranking</th>
              </tr>
            </thead>
            <tbody>
      `;

      data.resumen.forEach((juego) => {
        html += `
          <tr>
            <td>${juego.juego}</td>
            <td>${juego.mejor_puntaje}</td>
            <td>${juego.tiempo_promedio}</td>
            <td>${juego.intentos}</td>
            <td>${juego.niveles_jugados}</td>
            <td>${juego.puesto_ranking}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;

      contenedor.innerHTML = html;
    } else {
      contenedor.innerHTML = `<p class="text-danger">${
        data.error || "Error al obtener datos"
      }</p>`;
    }
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p class="text-danger">❌ Error al conectar con el servidor.</p>`;
  }
}

async function mostrarResumenClasesDocente(docenteId) {
  const contenedor = document.getElementById("resumen-clases-docente");
  contenedor.innerHTML = `<p class="text-muted">Cargando datos de resumen...</p>`;

  try {
    const res = await fetch(
      `${BASE_API_URL}/usuarios/docente/${docenteId}/resumen-clases`
    );
    const data = await res.json();

    if (res.ok) {
      renderResumenClasesDocente(data.clases);
    } else {
      contenedor.innerHTML = `<p class="text-danger">${
        data.error || "Error al obtener datos"
      }</p>`;
    }
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p class="text-danger">❌ Error al conectar con el servidor.</p>`;
  }
}

async function cargarDatosPersonales(usuarioId) {
  try {
    const res = await fetch(
      `${BASE_API_URL}/usuarios/${usuarioId}/perfil-completo`
    );
    if (!res.ok) throw new Error("Error al obtener datos personales");
    const data = await res.json();

    // Avatar
    const avatarImg = document.getElementById("user-avatar");
    if (data.avatares && data.avatares.length > 0) {
      const activo = data.avatares.find((a) => a.activo) || data.avatares[0];
      avatarImg.src = activo.imagen_url || "assets/avatar-default.png";
    } else {
      avatarImg.src = "assets/avatar-default.png";
    }

    // Nombre, nivel, monedas, xp
    document.getElementById("user-nombre").textContent = data.usuario.nombre;
    document.getElementById("user-nivel").textContent = data.usuario.nivel;
    document.getElementById("user-monedas").textContent = data.usuario.monedas;
    document.getElementById("user-xp").textContent = data.usuario.xp;

    // Insignias
    const listaInsignias = document.getElementById("lista-insignias");
    listaInsignias.innerHTML = "";
    if (data.insignias && data.insignias.length > 0) {
      data.insignias.forEach((ins) => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex align-items-center gap-2";
        li.innerHTML = `
          <img src="${ins.imagen_url}" alt="${ins.nombre}" style="width: 30px; height: 30px; object-fit: cover;">
          <div>
            <strong>${ins.nombre}</strong><br/>
            <small>${ins.descripcion}</small>
          </div>
        `;
        listaInsignias.appendChild(li);
      });
    } else {
      listaInsignias.innerHTML =
        "<li class='list-group-item'>Sin insignias aún.</li>";
    }

    // Avatares comprados
    const listaAvatares = document.getElementById("lista-avatares");
    listaAvatares.innerHTML = "";
    if (data.avatares && data.avatares.length > 0) {
      data.avatares.forEach((av) => {
        const div = document.createElement("div");
        div.className = "avatar-item border p-2 text-center";
        div.style.width = "80px";
        div.innerHTML = `
          <img src="${av.imagen_url}" alt="${
          av.nombre
        }" class="img-fluid rounded-circle mb-1" style="width: 50px; height: 50px; object-fit: cover;">
          <div class="small">${av.nombre}</div>
          ${av.activo ? '<div class="badge bg-success mt-1">Activo</div>' : ""}
        `;
        listaAvatares.appendChild(div);
      });
    } else {
      listaAvatares.innerHTML =
        "<p class='text-muted'>No has comprado avatares aún.</p>";
    }
  } catch (err) {
    console.error(err);
    alert("Error al cargar datos del perfil");
  }
}

function renderClasesDocente(clases) {
  const lista = document.getElementById("lista-clases-docente");
  lista.innerHTML = "";

  if (!clases || clases.length === 0) {
    lista.innerHTML =
      "<li class='list-group-item'>No tienes clases creadas aún.</li>";
    return;
  }

  clases.forEach((clase) => {
    const li = document.createElement("li");
    li.className = "list-group-item list-group-item-action";
    li.innerHTML = `
      <div>
        <strong>🏫 ${clase.nombre_clase}</strong>
        <br/>
        Código: <code>${clase.codigo}</code>
      </div>
    `;

    // Agregar click handler
    li.addEventListener("click", () => {
      mostrarEstudiantesDeClase(clase.id, clase.nombre_clase);
    });

    lista.appendChild(li);
  });
}

function renderResumenClasesDocente(resumen) {
  const contenedor = document.getElementById("resumen-clases-docente");
  contenedor.innerHTML = "";

  if (!resumen || resumen.length === 0) {
    contenedor.innerHTML = "<p class='text-muted'>No hay datos aún.</p>";
    return;
  }

  resumen.forEach((item) => {
    const div = document.createElement("div");
    div.className = "resumen-clase-item";
    div.innerHTML = `
      <strong>🏫 ${item.nombre_clase}</strong><br/>
      👥 Estudiantes: ${item.estudiantes}<br/>
      🎯 Promedio Puntaje: ${item.promedio_puntaje}<br/>
      🧮 Intentos Totales: ${item.intentos_totales}<br/>
      🎮 Juego más jugado: ${item.juego_mas_jugado}
    `;
    contenedor.appendChild(div);
  });
}

async function mostrarEstudiantesDeClase(claseId, nombreClase) {
  const contenedor = document.getElementById("resumen-clases-docente");
  contenedor.innerHTML = `<p class="text-muted">Cargando estudiantes de ${nombreClase}...</p>`;

  try {
    const res = await fetch(`${BASE_API_URL}/clases/${claseId}/estudiantes`);
    const data = await res.json();

    if (res.ok) {
      if (!data.estudiantes || data.estudiantes.length === 0) {
        contenedor.innerHTML = `<p class="text-muted">No hay estudiantes inscritos en ${nombreClase}.</p>`;
        return;
      }

      let html = `
        <h5>👥 Estudiantes de ${nombreClase}</h5>
        <div class="table-responsive">
          <table class="table table-striped table-bordered">
            <thead class="table-dark">
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Nivel</th>
                <th>XP</th>
                <th>Juegos Jugados</th>
                <th>Promedio Puntaje</th>
                <th>Último Intento</th>
              </tr>
            </thead>
            <tbody>
      `;

      data.estudiantes.forEach((e) => {
        html += `
          <tr>
            <td>${e.nombre}</td>
            <td>${e.correo}</td>
            <td>${e.nivel ?? 0}</td>
<td>${e.xp ?? 0}</td>
<td>${e.juegos_jugados ?? 0}</td>
<td>${e.promedio_puntaje ?? 0}</td>
<td>${
          e.ultimo_intento
            ? new Date(e.ultimo_intento).toLocaleDateString("es-BO")
            : "N/A"
        }</td>

          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;

      contenedor.innerHTML = html;
    } else {
      contenedor.innerHTML = `<p class="text-danger">${
        data.error || "Error al obtener datos"
      }</p>`;
    }
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p class="text-danger">❌ Error al conectar con el servidor.</p>`;
  }
}
