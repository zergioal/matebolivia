// juego-suma.js (versión optimizada con configuración editable)

// RANGOS CONFIGURABLES
const FACIL_RANGO = 10;
const MEDIO_RANGO = 20;
const DIFICIL_RANGO = 25;

let dificultad = "facil";
let tiempoInicio = null;
let cronometroIntervalo = null;
let tiempoTotal = 0;
let puntaje = 0;
let actual = 0;
let preguntas = [];
const totalPreguntas = 10;

window.prepararJuego = function prepararJuego() {
  document.getElementById("contenedor-boton-iniciar").style.display = "none";
  document.getElementById("bloque-juego").style.display = "block";
  iniciarJuego();
};

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
  cargarTopSumaGlobal();
}

function formatoParentesis(n) {
  if (n < 0) return `(${n})`;
  if (Math.random() < 0.5) return `(+${n})`;
  return `${n}`;
}

function generarPregunta(nivel, usarRangoGrande) {
  let min = -100,
    max = 100,
    cantidad = 2;

  if (nivel === "facil") {
    min = -FACIL_RANGO;
    max = FACIL_RANGO;
    cantidad = 2;
  } else if (nivel === "medio") {
    min = usarRangoGrande ? -100 : -MEDIO_RANGO;
    max = usarRangoGrande ? 100 : MEDIO_RANGO;
    cantidad = 3;
  } else if (nivel === "dificil") {
    min = usarRangoGrande ? -100 : -DIFICIL_RANGO;
    max = usarRangoGrande ? 100 : DIFICIL_RANGO;
    cantidad = Math.floor(Math.random() * 3) + 4;
  }

  const numeros = Array.from(
    { length: cantidad },
    () => Math.floor(Math.random() * (max - min + 1)) + min
  );

  let expr = `\\(${numeros[0]}`;
  let correcta = numeros[0];
  for (let i = 1; i < numeros.length; i++) {
    expr += ` + ${formatoParentesis(numeros[i])}`;
    correcta += numeros[i];
  }
  expr += "\\)";

  const opciones = [correcta];
  while (opciones.length < 4) {
    const distractor = correcta + Math.floor(Math.random() * 21) - 10;
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

function mostrarPregunta() {
  const p = preguntas[actual];
  document.getElementById("pregunta").innerHTML = p.enunciado;
  const opcionesHTML = p.opciones
    .map(
      (op) =>
        `<button class="opcion" onclick="verificarRespuesta(${op})">\\(${op}\\)</button>`
    )
    .join("");
  document.getElementById("opciones").innerHTML = opcionesHTML;
  document.getElementById("feedback").textContent = "";
  MathJax.typesetPromise();
  iniciarCronometro();
}

window.verificarRespuesta = function verificarRespuesta(seleccionada) {
  document.querySelectorAll(".opcion").forEach((btn) => (btn.disabled = true));
  detenerCronometro();
  const correcta = preguntas[actual].correcta;
  const feedback = document.getElementById("feedback");

  if (seleccionada === correcta) {
    puntaje++;
    feedback.textContent = "¡Correcto!";
    feedback.style.color = "green";
    document
      .querySelector(`.opcion[onclick*="${seleccionada}"]`)
      .classList.add("correcta");
  } else {
    feedback.textContent = `Incorrecto. Era ${correcta}`;
    feedback.style.color = "red";
    document
      .querySelector(`.opcion[onclick*="${seleccionada}"]`)
      .classList.add("incorrecta");
  }

  setTimeout(() => siguientePregunta(), 1500);
};

function siguientePregunta() {
  actual++;
  if (actual < totalPreguntas) {
    mostrarPregunta();
  } else {
    document.getElementById("pregunta").textContent = "";
    document.getElementById("opciones").innerHTML = "";
    document.getElementById("feedback").textContent = "";
    detenerCronometro();
    document.getElementById("cronometro").textContent = `⏱️ Tiempo total: ${(
      tiempoTotal / 1000
    ).toFixed(1)} s`;
    document.getElementById(
      "puntaje-final"
    ).textContent = `Tu puntaje: ${puntaje} / ${totalPreguntas}`;

    // Guardar en base de datos
    guardarPuntajeSuma(puntaje, (tiempoTotal / 1000).toFixed(1), dificultad);
  }
}

window.reiniciarJuego = function reiniciarJuego() {
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
};

const BACKEND = "https://juegosbackend.onrender.com"; //Url RENDER del backend

function cargarTopSumaGlobal() {
  fetch(`${BACKEND}/api/scores/top?juego=suma-enteros`)
    .then((r) => r.json())
    .then((lista) => {
      const ul = document.getElementById("lista-top-suma");
      ul.innerHTML = "";
      lista.forEach((p, i) => {
        ul.innerHTML += `<li>#${i + 1} ${p.nombre} (${p.unidad}) - ${
          p.puntaje
        } pts / ${p.tiempo}s [${p.nivel}]</li>`;
      });
    })
    .catch((err) => console.error("Top 10 global error:", err));
}

function guardarPuntajeSuma(puntajeFinal, tiempoTotal, nivel) {
  const datos = {
    nombre: prompt("Tu nombre:") || "Anónimo",
    unidad: prompt("Unidad Educativa:") || "Sin unidad",
    puntaje: puntajeFinal,
    tiempo: tiempoTotal,
    nivel,
    juego: "suma-enteros",
  };
  fetch(`${BACKEND}/api/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  })
    .then((r) => {
      if (r.ok) cargarTopSuma(nivel);
    })
    .catch((err) => console.error("Guardar puntaje error:", err));
}

document.addEventListener("DOMContentLoaded", () => {
  cargarTopSumaGlobal(); // Carga el ranking al abrir la página
});
