import { BASE_API_URL } from "./config.js";
import { guardarPuntaje } from "./api.js";

const JUEGO_ID = "dd56a125-cc89-44d1-8627-3e2b8a7fc2ed";
const usuarioId = localStorage.getItem("usuario_id");

let dificultad = "facil";
let ejercicioActual = null;
let tiempoInicio = null;
let cronometroIntervalo = null;
let tiempoTotal = 0;

document.addEventListener("DOMContentLoaded", () => {
  const origen = document.getElementById("terminos-origen");
  const destinoX = document.getElementById("contenedor-x");
  const destinoY = document.getElementById("contenedor-y");
  const objetivoEl = document.getElementById("objetivo");
  const feedback = document.getElementById("feedback-juego");
  const btnIniciar = document.getElementById("btn-iniciar");
  const btnVerificar = document.getElementById("btn-verificar");
  const cronometroEl = document.getElementById("cronometro");

  /* ==================== CRONÓMETRO ==================== */
  function iniciarCronometro() {
    tiempoInicio = Date.now();
    cronometroIntervalo = setInterval(() => {
      const transcurrido = ((Date.now() - tiempoInicio) / 1000).toFixed(1);
      cronometroEl.textContent = `⏱️ Tiempo: ${transcurrido}s`;
    }, 100);
  }

  function detenerCronometro() {
    clearInterval(cronometroIntervalo);
    if (tiempoInicio) {
      tiempoTotal += Date.now() - tiempoInicio;
      tiempoInicio = null;
    }
  }

  /* ==================== GENERAR EJERCICIO ==================== */
  function generarEjercicioAleatorio() {
    let cantidad;
    if (dificultad === "facil") {
      cantidad = 6;
    } else if (dificultad === "medio") {
      cantidad = 8;
    } else {
      cantidad = 10;
    }

    const variables = ["x", "y"];
    const terminos = [];
    const resultado = { x: 0, y: 0 };

    for (let i = 0; i < cantidad; i++) {
      const variable = variables[Math.floor(Math.random() * variables.length)];
      let coef;
      if (dificultad === "facil") {
        coef = Math.floor(Math.random() * 6) - 2;
      } else if (dificultad === "medio") {
        coef = Math.floor(Math.random() * 11) - 5;
      } else {
        coef = Math.floor(Math.random() * 15) - 7;
      }
      if (coef === 0) coef = 1;

      terminos.push({ coef, var: variable });
      resultado[variable] += coef;
    }

    return { terminos, resultado };
  }

  /* ==================== RENDERIZAR ==================== */
  function renderizarTerminos(terminos) {
    origen.innerHTML = "";
    terminos.forEach((t, i) => {
      const div = document.createElement("div");
      div.className = "termino-card";
      div.draggable = true;
      div.dataset.var = t.var;
      div.dataset.coef = t.coef;
      div.textContent = formatoMonomio(t.coef, t.var);
      origen.appendChild(div);
    });
  }

  function formatoMonomio(coef, variable) {
    if (coef === 1) return variable;
    if (coef === -1) return `-${variable}`;
    return `${coef}${variable}`;
  }

  function renderizarObjetivo(resultado) {
    const partes = [];
    if (resultado.x !== 0) partes.push(formatoMonomio(resultado.x, "x"));
    if (resultado.y !== 0) partes.push(formatoMonomio(resultado.y, "y"));
    objetivoEl.textContent = `🎯 Objetivo: ${partes
      .join(" + ")
      .replace(/\+\s\-/, "- ")}`;
  }

  function limpiarTableros() {
    destinoX.innerHTML = "";
    destinoY.innerHTML = "";
    feedback.textContent = "";
  }

  /* ==================== INICIAR JUEGO ==================== */
  function iniciarJuego() {
    detenerCronometro();
    tiempoTotal = 0;
    cronometroEl.textContent = "⏱️ Tiempo: 0.0s";
    feedback.textContent = "";
    limpiarTableros();
    ejercicioActual = generarEjercicioAleatorio();
    renderizarTerminos(ejercicioActual.terminos);
    renderizarObjetivo(ejercicioActual.resultado);
    iniciarCronometro();
  }

  /* ==================== DRAG & DROP ==================== */
  function allowDrop(e) {
    e.preventDefault();
  }

  function dragStart(e) {
    if (e.target.classList.contains("termino-card")) {
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          coef: e.target.dataset.coef,
          var: e.target.dataset.var,
        })
      );
      e.target.classList.add("dragging");
    }
  }

  function dragEnd(e) {
    e.target.classList.remove("dragging");
  }

  function drop(e, destino) {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    const div = document.createElement("div");
    div.className = "termino-card";
    div.draggable = true;
    div.dataset.coef = data.coef;
    div.dataset.var = data.var;
    div.textContent = formatoMonomio(parseInt(data.coef), data.var);
    destino.appendChild(div);
  }

  /* ==================== EVENTOS ==================== */
  origen.addEventListener("dragstart", dragStart);
  origen.addEventListener("dragend", dragEnd);

  [destinoX, destinoY].forEach((destino) => {
    destino.addEventListener("dragover", allowDrop);
    destino.addEventListener("drop", (e) => drop(e, destino));
  });

  btnIniciar.addEventListener("click", iniciarJuego);

  /* ==================== BOTONES DE NIVEL ==================== */
  document.querySelectorAll(".btn-nivel").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".btn-nivel")
        .forEach((b) => b.classList.remove("seleccionado"));
      btn.classList.add("seleccionado");
      dificultad = btn.id.replace("btn-", "");
    });
  });

  document.getElementById("btn-facil").classList.add("seleccionado");

  /* ==================== VERIFICAR ==================== */
  btnVerificar.addEventListener("click", async () => {
    detenerCronometro();

    let sumaX = 0;
    let sumaY = 0;

    destinoX.querySelectorAll(".termino-card").forEach((el) => {
      sumaX += parseInt(el.dataset.coef);
    });
    destinoY.querySelectorAll(".termino-card").forEach((el) => {
      sumaY += parseInt(el.dataset.coef);
    });

    if (
      sumaX === ejercicioActual.resultado.x &&
      sumaY === ejercicioActual.resultado.y
    ) {
      feedback.textContent = "✅ ¡Correcto!";
      feedback.style.color = "#2e7d32";
      await guardarPuntajeReduccion(
        1,
        (tiempoTotal / 1000).toFixed(1),
        dificultad
      );
    } else {
      feedback.textContent = `❌ Incorrecto. Propuesto: ${sumaX}x + ${sumaY}y`;
      feedback.style.color = "#c62828";
      iniciarCronometro();
    }
  });

  /* ==================== GUARDAR ==================== */
  async function guardarPuntajeReduccion(puntajeFinal, tiempoTotal, nivel) {
    if (!usuarioId) {
      alert("⚠️ Debes iniciar sesión para guardar tu puntaje.");
      return;
    }

    try {
      await guardarPuntaje(
        usuarioId,
        JUEGO_ID,
        Number(puntajeFinal),
        Number(tiempoTotal),
        nivel
      );
      console.log("✅ Puntaje guardado correctamente en backend");
    } catch (err) {
      console.error("❌ Error al guardar puntaje:", err);
      alert("❌ No se pudo guardar el puntaje. Intenta de nuevo más tarde.");
    }
  }

  /* ==================== INICIO ==================== */
  cronometroEl.textContent = "⏱️ Tiempo: 0.0s";
});
