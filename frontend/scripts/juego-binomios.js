// scripts/juego-binomios.js

import { BASE_API_URL } from "./config.js";
import { guardarPuntaje } from "./api.js";

const JUEGO_ID_BINOMIOS = "018d4003-eeee-ffff-aaaa-013f00000003";
const usuarioId = localStorage.getItem("usuario_id");

let nivel = "facil";
let puntaje = 0;
let ejerciciosResueltos = 0;
let tiempoInicio = null;
let tiempoTotal = 0;
const TOTAL_EJERCICIOS = 5;

document.addEventListener("DOMContentLoaded", () => {
  const problemaEl = document.getElementById("problema-bin");
  const inputRespuesta = document.getElementById("input-respuesta-bin");
  const btnVerificar = document.getElementById("btn-verificar-bin");
  const btnReiniciar = document.getElementById("btn-reiniciar-bin");
  const feedbackEl = document.getElementById("feedback-juego-bin");
  const puntajeEl = document.getElementById("puntaje-bin");
  const cronometroEl = document.getElementById("cronometro-bin");
  const nivelesBtns = document.querySelectorAll(".btn-nivel");

  let binomioActual = null;
  let solucionActual = null;

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

  function randInt(min, max) {
    let n = Math.floor(Math.random() * (max - min + 1)) + min;
    if (n === 0) n = 1;
    return n;
  }

  function generarBinomioAleatorio() {
    let range = 5;
    if (nivel === "medio") range = 10;
    if (nivel === "dificil") range = 15;

    return {
      a: randInt(-range, range),
      b: randInt(-range, range),
    };
  }

  function binomioToLatex({ a, b }) {
    let partA = a === 1 ? "x" : a === -1 ? "-x" : `${a}x`;
    let partB = b >= 0 ? `+${b}` : `${b}`;
    return `${partA} ${partB}`;
  }

  function expandirBinomios(b1, b2) {
    // (ax + b)(cx + d) = acx^2 + (ad + bc)x + bd
    const a = b1.a;
    const b = b1.b;
    const c = b2.a;
    const d = b2.b;

    const coef2 = a * c;
    const coef1 = a * d + b * c;
    const constTerm = b * d;

    return { coef2, coef1, constTerm };
  }

  function resultadoToString({ coef2, coef1, constTerm }) {
    let res = "";
    if (coef2 !== 0) res += `${coef2}x^2`;
    if (coef1 !== 0) {
      res += res ? (coef1 > 0 ? `+${coef1}x` : `${coef1}x`) : `${coef1}x`;
    }
    if (constTerm !== 0) {
      res += res
        ? constTerm > 0
          ? `+${constTerm}`
          : `${constTerm}`
        : `${constTerm}`;
    }
    return res || "0";
  }

  function generarNuevoProblema() {
    const b1 = generarBinomioAleatorio();
    const b2 = generarBinomioAleatorio();
    binomioActual = { b1, b2 };
    solucionActual = expandirBinomios(b1, b2);

    problemaEl.innerHTML = `\\( (${binomioToLatex(b1)})(${binomioToLatex(
      b2
    )}) \\)`;
    inputRespuesta.value = "";
    feedbackEl.textContent = "";
    MathJax.typesetPromise();
  }

  function verificarRespuesta() {
    let respuesta = inputRespuesta.value.trim();
    respuesta = respuesta.replace(/\s+/g, "").replace(/\*\*/g, "^");

    // Expresión esperada
    const esperado = resultadoToString(solucionActual).replace(/\s+/g, "");

    if (respuesta === esperado) {
      feedbackEl.textContent = "✅ ¡Correcto!";
      feedbackEl.style.color = "#2e7d32";
      puntaje++;
    } else {
      feedbackEl.textContent = `❌ Incorrecto. Era ${esperado}`;
      feedbackEl.style.color = "#c62828";
    }

    ejerciciosResueltos++;
    puntajeEl.textContent = `Puntaje: ${puntaje}/${TOTAL_EJERCICIOS}`;

    if (ejerciciosResueltos >= TOTAL_EJERCICIOS) {
      stopTimer();
      guardarPuntajeBinomios(puntaje, (tiempoTotal / 1000).toFixed(1), nivel);
      feedbackEl.textContent += " - ¡Juego finalizado!";
    } else {
      generarNuevoProblema();
    }
  }

  async function guardarPuntajeBinomios(puntajeFinal, tiempoTotal, nivel) {
    if (!usuarioId) {
      alert("⚠️ Debes iniciar sesión para guardar tu puntaje.");
      return;
    }

    try {
      await guardarPuntaje(
        usuarioId,
        JUEGO_ID_BINOMIOS,
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
    generarNuevoProblema();
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
