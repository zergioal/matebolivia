// scripts/juego-monomios.js

import { BASE_API_URL } from "./config.js";
import { guardarPuntaje } from "./api.js";

// UUID de este juego en tu tabla "juegos"
const JUEGO_ID_MONOMIOS = "018d4001-bbbb-cccc-dddd-013f00000002";

let nivel = "facil";
let ejerciciosResueltos = 0;
let puntaje = 0;
let tiempoInicio = null;
let tiempoTotal = 0;
const TOTAL_EJERCICIOS = 5;

let monomiosDisponibles = [];
let seleccionados = [];

document.addEventListener("DOMContentLoaded", () => {
  const zonaMonomios = document.getElementById("zona-monomios");
  const seleccionadosEl = document.getElementById("seleccionados");
  const inputRespuesta = document.getElementById("input-respuesta");
  const btnVerificar = document.getElementById("btn-verificar");
  const btnReiniciar = document.getElementById("btn-reiniciar");
  const feedbackEl = document.getElementById("feedback-juego");
  const puntajeEl = document.getElementById("puntaje");
  const cronometroEl = document.getElementById("cronometro");
  const nivelesBtns = document.querySelectorAll(".btn-nivel");

  function startTimer() {
    tiempoInicio = Date.now();
    tiempoTotal = 0;
    updateTimer();
  }

  function stopTimer() {
    if (tiempoInicio) {
      tiempoTotal += Date.now() - tiempoInicio;
      tiempoInicio = null;
    }
  }

  function updateTimer() {
    if (tiempoInicio) {
      const interval = setInterval(() => {
        if (!tiempoInicio) {
          clearInterval(interval);
          return;
        }
        const s = ((Date.now() - tiempoInicio) / 1000).toFixed(1);
        cronometroEl.textContent = `⏱️ ${s} s`;
      }, 100);
    } else {
      cronometroEl.textContent = `⏱️ 0.0 s`;
    }
  }

  function generarMonomioAleatorio() {
    let coef = 0;
    let exp = 0;

    if (nivel === "facil") {
      coef = Math.floor(Math.random() * 5) + 1;
      exp = Math.floor(Math.random() * 3); // 0,1,2
    } else if (nivel === "medio") {
      coef = Math.floor(Math.random() * 11) - 5;
      if (coef === 0) coef = 2;
      exp = Math.floor(Math.random() * 4); // 0..3
    } else if (nivel === "dificil") {
      coef = Math.floor(Math.random() * 21) - 10;
      if (coef === 0) coef = 3;
      exp = Math.floor(Math.random() * 6) - 2; // exponente puede ser negativo
    }

    return { coef, exp };
  }

  function monomioToLatex({ coef, exp }) {
    if (exp === 0) return `\\(${coef}\\)`;
    if (exp === 1) return `\\(${coef}x\\)`;
    return `\\(${coef}x^{${exp}}\\)`;
  }

  function renderMonomios() {
    zonaMonomios.innerHTML = "";
    seleccionados = [];
    seleccionadosEl.innerHTML = "Seleccionados: (elige 2)";
    inputRespuesta.value = "";
    feedbackEl.textContent = "";

    monomiosDisponibles = [];
    for (let i = 0; i < 8; i++) {
      const m = generarMonomioAleatorio();
      monomiosDisponibles.push(m);

      const div = document.createElement("div");
      div.className = "monomio-card";
      div.dataset.index = i;
      div.innerHTML = monomioToLatex(m);
      div.addEventListener("click", () => seleccionarMonomio(i));
      zonaMonomios.appendChild(div);
    }
    MathJax.typesetPromise();
  }

  function seleccionarMonomio(index) {
    if (seleccionados.length >= 2) return;

    const m = monomiosDisponibles[index];
    seleccionados.push(m);

    document
      .querySelectorAll(`.monomio-card[data-index='${index}']`)[0]
      .classList.add("seleccionado");

    const text = seleccionados
      .map((mono) => `${mono.coef}x^${mono.exp}`)
      .join(" , ");
    seleccionadosEl.textContent = `Seleccionados: ${text}`;
  }

  function verificarRespuesta() {
    if (seleccionados.length !== 2) {
      feedbackEl.textContent = "⚠️ Selecciona dos monomios primero.";
      feedbackEl.style.color = "#c62828";
      return;
    }

    const m1 = seleccionados[0];
    const m2 = seleccionados[1];
    const correctoCoef = m1.coef * m2.coef;
    const correctoExp = m1.exp + m2.exp;

    const respuesta = inputRespuesta.value.trim();
    const regex = /^(-?\d+)\s*\*?\s*x\^(-?\d+)$/i;
    const match = respuesta.match(regex);

    if (!match) {
      feedbackEl.textContent = "❌ Formato inválido. Usa por ejemplo: 6x^3";
      feedbackEl.style.color = "#c62828";
      return;
    }

    const resCoef = parseInt(match[1]);
    const resExp = parseInt(match[2]);

    if (resCoef === correctoCoef && resExp === correctoExp) {
      feedbackEl.textContent = "✅ ¡Correcto!";
      feedbackEl.style.color = "#2e7d32";
      puntaje++;
    } else {
      feedbackEl.textContent = `❌ Incorrecto. Era ${correctoCoef}x^${correctoExp}`;
      feedbackEl.style.color = "#c62828";
    }

    ejerciciosResueltos++;
    puntajeEl.textContent = `Puntaje: ${puntaje}/${TOTAL_EJERCICIOS}`;

    if (ejerciciosResueltos >= TOTAL_EJERCICIOS) {
      stopTimer();
      guardarPuntajeMonomios(puntaje, (tiempoTotal / 1000).toFixed(1), nivel);
      feedbackEl.textContent += " - ¡Juego finalizado!";
    } else {
      renderMonomios();
    }
  }

  async function guardarPuntajeMonomios(puntajeFinal, tiempoTotal, nivel) {
    if (!usuarioId) {
      alert("⚠️ Debes iniciar sesión para guardar tu puntaje.");
      return;
    }

    try {
      await guardarPuntaje(
        usuarioId,
        JUEGO_ID_MONOMIOS,
        Number(puntajeFinal),
        Number(tiempoTotal),
        nivel
      );

      console.log("✅ Puntaje guardado correctamente");
    } catch (err) {
      console.error("❌ Error al guardar puntaje:", err);
      alert("❌ No se pudo guardar el puntaje. Intenta de nuevo más tarde.");
    }
  }

  function iniciarJuego() {
    ejerciciosResueltos = 0;
    puntaje = 0;
    tiempoInicio = Date.now();
    updateTimer();
    puntajeEl.textContent = `Puntaje: 0/${TOTAL_EJERCICIOS}`;
    renderMonomios();
  }

  btnVerificar.addEventListener("click", verificarRespuesta);
  btnReiniciar.addEventListener("click", iniciarJuego);

  nivelesBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      nivel = btn.dataset.nivel;
      nivelesBtns.forEach((b) => b.classList.remove("seleccionado"));
      btn.classList.add("seleccionado");
      iniciarJuego();
    });
  });

  iniciarJuego();
});
