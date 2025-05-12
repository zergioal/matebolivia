// juego-division.js (versión con todos los signos y rango ampliado)

const FACIL_DIV = [2, 3, 4, 5, 6, 8, 10, 12];
const SIMBOLOS_DIV = ["÷", "/", "frac"];

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
    preguntas.push(generarPregunta(dificultad));
  }

  document.getElementById("puntaje-final").textContent = "";
  mostrarPregunta();

  document.querySelectorAll(".btn-nivel").forEach((btn) => {
    btn.disabled = true;
    btn.classList.remove("seleccionado");
  });
  document.getElementById(`btn-${dificultad}`).classList.add("seleccionado");
}

function formatoDivision(a, b, simbolo) {
  const divisorPar = b < 0 ? `(${b})` : b;
  const dividendoPar = a < 0 && simbolo !== "frac" ? `(${a})` : a;

  if (simbolo === "frac") {
    return `\\dfrac{${a}}{${b}}`;
  } else {
    return `${dividendoPar} ${simbolo} ${divisorPar}`;
  }
}

function generarMultiplo(base, min, max) {
  const factor = Math.floor(Math.random() * (max - min + 1)) + min;
  return base * factor;
}

function generarPregunta(nivel) {
  const simbolo = SIMBOLOS_DIV[Math.floor(Math.random() * SIMBOLOS_DIV.length)];
  let correcta = 0,
    expr = "\\(";

  if (nivel === "facil") {
    const b =
      FACIL_DIV[Math.floor(Math.random() * FACIL_DIV.length)] *
      (Math.random() < 0.5 ? -1 : 1);
    const a =
      generarMultiplo(Math.abs(b), 2, 10) * (Math.random() < 0.5 ? -1 : 1);
    correcta = a / b;
    expr += `${formatoDivision(a, b, simbolo)}\\)`;
  }

  if (nivel === "medio") {
    const b =
      FACIL_DIV[Math.floor(Math.random() * FACIL_DIV.length)] *
      (Math.random() < 0.5 ? -1 : 1);
    const a =
      generarMultiplo(Math.abs(b), 2, 12) * (Math.random() < 0.5 ? -1 : 1);
    const extra = Math.floor(Math.random() * 13) - 6;
    correcta = a / b + extra;
    expr += `${formatoDivision(a, b, simbolo)} ${
      extra >= 0 ? "+" : "-"
    } ${Math.abs(extra)}\\)`;
  }

  if (nivel === "dificil") {
    const b1 =
      FACIL_DIV[Math.floor(Math.random() * FACIL_DIV.length)] *
      (Math.random() < 0.5 ? -1 : 1);
    const b2 =
      FACIL_DIV[Math.floor(Math.random() * FACIL_DIV.length)] *
      (Math.random() < 0.5 ? -1 : 1);
    const a1 =
      generarMultiplo(Math.abs(b1), 2, 10) * (Math.random() < 0.5 ? -1 : 1);
    const a2 =
      generarMultiplo(Math.abs(b2), 2, 10) * (Math.random() < 0.5 ? -1 : 1);
    const operador = Math.random() < 0.5 ? "+" : "-";

    const div1 = formatoDivision(a1, b1, simbolo);
    const div2 = formatoDivision(a2, b2, simbolo);

    correcta = operador === "+" ? a1 / b1 + a2 / b2 : a1 / b1 - a2 / b2;
    expr += `${div1} ${operador} ${div2}\\)`;
  }

  const opciones = [correcta];
  while (opciones.length < 4) {
    const distractor = correcta + Math.floor(Math.random() * 9) - 4;
    if (!opciones.includes(distractor)) {
      opciones.push(distractor);
    }
  }

  return {
    enunciado: expr,
    correcta: parseFloat(correcta.toFixed(2)),
    opciones: opciones
      .sort(() => Math.random() - 0.5)
      .map((n) => parseFloat(n.toFixed(2))),
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
