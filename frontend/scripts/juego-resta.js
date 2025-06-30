import { BASE_API_URL } from "./config.js";
import { guardarPuntaje } from "./api.js";

// Sonidos
const sonidos = {
  acierto: new Audio("assets/sonidos/acierto.mp3"),
  error: new Audio("assets/sonidos/error.mp3"),
  final: new Audio("assets/sonidos/final.mp3"),
};

const usuarioId = localStorage.getItem("usuario_id");

// 👇 USA TU UUID REAL DEL JUEGO "Resta de enteros" (ajústalo al valor correcto de tu base de datos)
const ID_JUEGO_RESTA_ENTEROS = "cf8b8aa3-ce5b-4d52-989f-cfb0ead5df2b";

const totalPreguntas = 10;
const BACKEND = BASE_API_URL;

let dificultad = "facil";
let tiempoInicio = null;
let cronometroIntervalo = null;
let tiempoTotal = 0;
let puntaje = 0;
let actual = 0;
let preguntas = [];

/* ========== INICIO JUEGO ========== */
export function prepararJuego() {
  document.getElementById("contenedor-boton-iniciar").style.display = "none";
  document.getElementById("bloque-juego").style.display = "block";
  iniciarJuego();
}

window.setDificultad = function setDificultad(nivel) {
  dificultad = nivel;
  document
    .querySelectorAll(".btn-nivel")
    .forEach((btn) => btn.classList.remove("seleccionado"));
  document.getElementById(`btn-${nivel}`).classList.add("seleccionado");
};

function iniciarJuego() {
  puntaje = 0;
  actual = 0;
  preguntas = [];
  tiempoTotal = 0;
  clearInterval(cronometroIntervalo);
  document.getElementById("cronometro").textContent = "⏱️ Tiempo: 0.0 s";

  for (let i = 0; i < totalPreguntas; i++) {
    const usarRangoGrande = i === Math.floor(Math.random() * totalPreguntas);
    preguntas.push(generarPregunta(dificultad, usarRangoGrande));
  }

  document.getElementById("puntaje-final").textContent = "";
  mostrarPregunta();

  document.querySelectorAll(".btn-nivel").forEach((btn) => {
    btn.disabled = true;
    btn.classList.remove("seleccionado");
  });
  document.getElementById(`btn-${dificultad}`).classList.add("seleccionado");
}

/* ========== PREGUNTAS ========== */
function formatoParentesis(n) {
  if (n < 0) return `(${n})`;
  if (Math.random() < 0.5) return `(+${n})`;
  return `${n}`;
}

function generarPregunta(nivel) {
  let cantidad = 2;
  let min = -12;
  let max = 12;

  if (nivel === "facil") {
    cantidad = 2;
    min = -8;
    max = 8;
  } else if (nivel === "medio") {
    cantidad = 2;
    min = -15;
    max = 15;
  } else if (nivel === "dificil") {
    cantidad = 3;
    min = -12;
    max = 12;
  }

  // Generar los números aleatorios
  const numeros = Array.from(
    { length: cantidad },
    () => Math.floor(Math.random() * (max - min + 1)) + min
  );

  // Construir la expresión en formato LaTeX
  let expr = `\\(${numeros[0]}`;
  let correcta = numeros[0];
  for (let i = 1; i < numeros.length; i++) {
    expr += ` - ${formatoParentesis(numeros[i])}`;
    correcta -= numeros[i];
  }
  expr += "\\)";

  // Crear opciones con distractores
  const opciones = [correcta];
  while (opciones.length < 4) {
    const distractor = correcta + Math.floor(Math.random() * 11) - 5;
    if (!opciones.includes(distractor)) {
      opciones.push(distractor);
    }
  }

  return {
    enunciado: expr,
    correcta,
    opciones: opciones.sort(() => Math.random() - 0.5),
  };
}

/* ========== CRONÓMETRO ========== */
function iniciarCronometro() {
  tiempoInicio = Date.now();
  actualizarCronometro();
  cronometroIntervalo = setInterval(actualizarCronometro, 100);
}

function detenerCronometro() {
  clearInterval(cronometroIntervalo);
  if (tiempoInicio) {
    tiempoTotal += Date.now() - tiempoInicio;
    tiempoInicio = null;
  }
}

function actualizarCronometro() {
  if (tiempoInicio) {
    const segundos = ((Date.now() - tiempoInicio) / 1000).toFixed(1);
    document.getElementById(
      "cronometro"
    ).textContent = `⏱️ Tiempo: ${segundos} s`;
  }
}

/* ========== MOSTRAR PREGUNTA ========== */
function mostrarPregunta() {
  const p = preguntas[actual];
  const opcionesContainer = document.getElementById("opciones");
  document.getElementById("pregunta").innerHTML = p.enunciado;

  opcionesContainer.innerHTML = "";
  document.getElementById("feedback").textContent = "";

  p.opciones.forEach((op) => {
    const btn = document.createElement("button");
    btn.classList.add("opcion");
    btn.dataset.respuesta = op;
    btn.innerHTML = `\\(${op}\\)`;
    btn.addEventListener("click", () => verificarRespuesta(Number(op), btn));
    opcionesContainer.appendChild(btn);
  });

  MathJax.typesetPromise();
  iniciarCronometro();
}

/* ========== VERIFICAR RESPUESTA ========== */
export function verificarRespuesta(seleccionada, botonClickeado) {
  document.querySelectorAll(".opcion").forEach((btn) => (btn.disabled = true));
  detenerCronometro();
  const correcta = preguntas[actual].correcta;
  const feedback = document.getElementById("feedback");

  if (seleccionada === correcta) {
    puntaje++;
    feedback.textContent = "¡Correcto!";
    feedback.style.color = "green";
    botonClickeado.classList.add("correcta");
    sonidos.acierto.play();
  } else {
    feedback.textContent = `Incorrecto. Era ${correcta}`;
    feedback.style.color = "red";
    botonClickeado.classList.add("incorrecta");
    sonidos.error.play();

    document.querySelectorAll(".opcion").forEach((btn) => {
      if (Number(btn.dataset.respuesta) === correcta) {
        btn.classList.add("correcta");
      }
    });
  }

  setTimeout(() => siguientePregunta(), 1500);
}

function siguientePregunta() {
  actual++;
  if (actual < totalPreguntas) {
    mostrarPregunta();
  } else {
    document.getElementById("pregunta").textContent = "";
    document.getElementById("opciones").innerHTML = "";
    document.getElementById("feedback").textContent = "";
    detenerCronometro();
    const tiempoFinal = (tiempoTotal / 1000).toFixed(1);
    document.getElementById(
      "cronometro"
    ).textContent = `⏱️ Tiempo total: ${tiempoFinal} s`;
    document.getElementById(
      "puntaje-final"
    ).textContent = `Tu puntaje: ${puntaje} / ${totalPreguntas}`;
    sonidos.final.play();
    guardarPuntajeResta(puntaje, Number(tiempoFinal), dificultad);
  }
}

/* ========== REINICIAR JUEGO ========== */
export function reiniciarJuego() {
  clearInterval(cronometroIntervalo);
  tiempoInicio = null;
  tiempoTotal = 0;
  document
    .querySelectorAll(".btn-nivel")
    .forEach((btn) => (btn.disabled = false));
  document.getElementById("contenedor-boton-iniciar").style.display = "flex";
  document.getElementById("bloque-juego").style.display = "none";
  document.getElementById("puntaje-final").textContent = "";
  document.getElementById("cronometro").textContent = "⏱️ Tiempo: 0.0 s";
}

/* ========== CARGAR TOP PUNTAJES ========== */
function cargarTopPorDificultad(claseId = null) {
  ["facil", "medio", "dificil"].forEach((nivel) => {
    let url = `${BACKEND}/scores/top?juego=${ID_JUEGO_RESTA_ENTEROS}&nivel=${nivel}`;
    if (claseId) url += `&clase_id=${claseId}`;

    fetch(url)
      .then((r) => r.json())
      .then((lista) => {
        const ul = document.getElementById(`lista-top-${nivel}`);
        ul.innerHTML = "";

        if (!Array.isArray(lista)) {
          console.error("Respuesta inválida:", lista);
          ul.innerHTML =
            "<li class='list-group-item text-danger'>Error en el servidor.</li>";
          return;
        }

        if (lista.length === 0) {
          ul.innerHTML = "<li class='list-group-item'>Sin datos aún.</li>";
          return;
        }

        lista.forEach((p, i) => {
          ul.innerHTML += `
            <li class="list-group-item">
              <div class="d-flex align-items-center">
                <span class="me-2 fw-bold text-secondary">#${i + 1}</span>
                <img src="${
                  p.avatar_url || "assets/avatar-default.png"
                }" alt="Avatar" class="rounded-circle me-2" style="width: 40px; height: 40px; object-fit: cover;">
                <div class="flex-grow-1">
                  <div class="fw-bold">${p.usuario_nombre}</div>
                  <div class="text-muted small">${
                    p.clases ? p.clases.join(", ") : "Sin clase asignada"
                  }</div>
                </div>
                <span class="badge bg-success ms-2">${p.puntaje} pts / ${
            p.tiempo
          }s</span>
              </div>
            </li>
          `;
        });
      })
      .catch((err) => {
        console.error(`Error cargando top ${nivel}:`, err);
        document.getElementById(`lista-top-${nivel}`).innerHTML =
          "<li class='list-group-item text-danger'>Error al cargar.</li>";
      });
  });
}

/* ========== GUARDAR PUNTAJE ========== */
async function guardarPuntajeResta(puntajeFinal, tiempoTotal, nivel) {
  if (!usuarioId) {
    alert("⚠️ Debes iniciar sesión para guardar tu puntaje.");
    return;
  }

  try {
    await guardarPuntaje(
      usuarioId,
      ID_JUEGO_RESTA_ENTEROS,
      Number(puntajeFinal),
      Number(tiempoTotal),
      nivel
    );

    console.log("✅ Puntaje guardado correctamente");
    cargarTopPorDificultad();
  } catch (err) {
    console.error("❌ Error al guardar puntaje:", err);
    alert("❌ No se pudo guardar el puntaje. Intenta de nuevo más tarde.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  cargarTopPorDificultad();
});
