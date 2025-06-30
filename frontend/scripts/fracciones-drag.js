import { BASE_API_URL } from "./config.js";
import { guardarPuntaje } from "./api.js";

const usuarioId = localStorage.getItem("usuario_id");
const ID_JUEGO_FRACCIONES = "67b7222b-868a-4895-834f-beb65b8269cd"; // Reemplaza con tu UUID real
const BACKEND = BASE_API_URL;

document.addEventListener("DOMContentLoaded", () => {
  const origen = document.getElementById("fracciones-origen");
  const destino = document.getElementById("fracciones-destino");
  const feedback = document.getElementById("feedback-juego");
  const niveles = ["facil", "medio", "dificil"];
  let nivelActual = "facil";

  const btnIniciar = document.getElementById("btn-iniciar");
  const contenedorBoton = document.getElementById("contenedor-boton-iniciar");
  const bloqueNiveles = document.getElementById("bloque-niveles");
  const instrucciones = document.getElementById("instrucciones");
  const tablero = document.querySelector(".tablero");

  const cronometroBox = document.createElement("div");
  cronometroBox.id = "cronometro";
  cronometroBox.className = "cronometro";
  cronometroBox.textContent = "⏱️ 0.0 s";
  feedback.before(cronometroBox);

  const puntajeBox = document.createElement("div");
  puntajeBox.id = "puntaje";
  puntajeBox.className = "puntaje";
  puntajeBox.textContent = "Puntaje: 0/0";
  cronometroBox.after(puntajeBox);

  const sonidos = {
    acierto: new Audio("assets/sonidos/acierto.mp3"),
    error: new Audio("assets/sonidos/error.mp3"),
    final: new Audio("assets/sonidos/final.mp3"),
  };

  const nivelPares = {
    facil: 5,
    medio: 7,
    dificil: 10,
  };

  const fraccionesEquivalentes = {
    facil: [
      ["1/2", "2/4"],
      ["1/3", "2/6"],
      ["3/4", "6/8"],
      ["1/4", "2/8"],
      ["2/3", "4/6"],
      ["3/5", "6/10"],
    ],
    medio: [
      ["2/5", "4/10"],
      ["3/5", "6/10"],
      ["3/8", "6/16"],
      ["4/7", "8/14"],
      ["5/6", "10/12"],
      ["7/8", "14/16"],
      ["5/9", "10/18"],
      ["7/10", "14/20"],
    ],
    dificil: [
      ["5/9", "10/18"],
      ["7/10", "14/20"],
      ["5/8", "15/24"],
      ["9/12", "27/36"],
      ["11/15", "22/30"],
      ["3/7", "9/21"],
      ["8/9", "16/18"],
      ["4/9", "8/18"],
      ["2/7", "4/14"],
      ["5/12", "10/24"],
    ],
  };

  let seleccionadas = [];
  let aciertos = 0;
  let startTime = null;
  let intervalID = null;
  let juegoTerminado = false;
  let seleccionActual = null;

  btnIniciar.addEventListener("click", () => {
    contenedorBoton.style.display = "none";
    bloqueNiveles.style.display = "flex";
    feedback.textContent = "";
  });

  const startTimer = () => {
    if (intervalID) clearInterval(intervalID);
    startTime = Date.now();
    intervalID = setInterval(() => {
      const s = ((Date.now() - startTime) / 1000).toFixed(1);
      cronometroBox.textContent = `⏱️ ${s} s`;
    }, 100);
  };

  const stopTimer = () => clearInterval(intervalID);

  const crearElemento = (clase, contenido, atributo, valor) => {
    const div = document.createElement("div");
    div.className = clase;
    div.setAttribute(atributo, valor);
    div.innerHTML = `\\(${contenido}\\)`;
    return div;
  };

  const generarJuego = (nivel) => {
    nivelActual = nivel;
    bloqueNiveles.style.display = "none";
    instrucciones.style.display = "block";
    tablero.style.display = "flex";
    origen.innerHTML = "";
    destino.innerHTML = "";
    feedback.textContent = "";
    aciertos = 0;
    juegoTerminado = false;
    seleccionActual = null;
    stopTimer();
    startTime = null;
    cronometroBox.textContent = "⏱️ 0.0 s";
    puntajeBox.textContent = `Puntaje: 0/${nivelPares[nivel]}`;

    seleccionadas = fraccionesEquivalentes[nivel]
      .sort(() => 0.5 - Math.random())
      .slice(0, nivelPares[nivel]);

    const tarjetas = [];
    const objetivos = [];

    seleccionadas.forEach(([base, equivalente]) => {
      tarjetas.push({ valor: equivalente, equivalente: base });
      objetivos.push({ valor: base, objetivo: base });
    });

    tarjetas
      .sort(() => 0.5 - Math.random())
      .forEach((f) => {
        const card = crearElemento(
          "fraccion-card",
          f.valor,
          "data-equivalente",
          f.equivalente
        );
        card.setAttribute("draggable", "true");
        origen.appendChild(card);
      });

    objetivos
      .sort(() => 0.5 - Math.random())
      .forEach((f) => {
        const slot = crearElemento(
          "fraccion-target",
          f.valor,
          "data-objetivo",
          f.objetivo
        );
        destino.appendChild(slot);
      });

    MathJax.typesetPromise();
  };

  niveles.forEach((n) => {
    const btn = document.getElementById(`btn-${n}`);
    if (btn) {
      btn.addEventListener("click", () => {
        niveles.forEach((b) =>
          document.getElementById(`btn-${b}`).classList.remove("seleccionado")
        );
        btn.classList.add("seleccionado");
        generarJuego(n);
      });
    }
  });

  /* DRAG & DROP DESKTOP */
  origen.addEventListener("dragstart", (e) => {
    if (juegoTerminado) return;
    const card = e.target.closest(".fraccion-card");
    if (!card) return;
    e.dataTransfer.setData("text/plain", card.dataset.equivalente);
    e.dataTransfer.effectAllowed = "move";
    card.classList.add("dragging");
    if (!startTime) startTimer();
  });

  origen.addEventListener("dragend", (e) => {
    const card = e.target.closest(".fraccion-card");
    if (card) card.classList.remove("dragging");
  });

  destino.addEventListener("dragover", (e) => {
    if (!juegoTerminado) e.preventDefault();
  });

  destino.addEventListener("drop", (e) => {
    if (juegoTerminado) return;
    e.preventDefault();

    const target = e.target.closest(".fraccion-target");
    if (!target || target.classList.contains("completo")) return;

    const data = e.dataTransfer.getData("text/plain");
    verificarMatch(target, data);
  });

  /* TOUCH / CLICK PARA MÓVIL */
  origen.addEventListener("click", (e) => {
    if (juegoTerminado) return;
    const card = e.target.closest(".fraccion-card");
    if (!card) return;
    seleccionActual = card;
    feedback.textContent = "✅ Ahora toca la fracción destino correcta";
  });

  destino.addEventListener("click", (e) => {
    if (juegoTerminado || !seleccionActual) return;
    const target = e.target.closest(".fraccion-target");
    if (!target || target.classList.contains("completo")) return;

    const data = seleccionActual.dataset.equivalente;
    verificarMatch(target, data);
  });

  const verificarMatch = (target, data) => {
    const objetivo = target.dataset.objetivo;
    const card = document.querySelector(
      `.fraccion-card[data-equivalente="${data}"]`
    );

    if (!startTime) startTimer();

    if (data === objetivo && card) {
      target.innerHTML = card.innerHTML;
      target.classList.add("completo");
      card.remove();
      aciertos++;
      puntajeBox.textContent = `Puntaje: ${aciertos}/${nivelPares[nivelActual]}`;
      feedback.textContent = "¡Correcto!";
      feedback.style.color = "#2e7d32";
      sonidos.acierto.play();
      MathJax.typesetPromise();
    } else {
      feedback.textContent = "Inténtalo otra vez";
      feedback.style.color = "#c62828";
      sonidos.error.play();
    }

    seleccionActual = null;

    if (aciertos === nivelPares[nivelActual]) {
      juegoTerminado = true;
      stopTimer();
      const total = ((Date.now() - startTime) / 1000).toFixed(1);
      feedback.textContent = `✅ ¡Completado en ${total} s! 🎉`;
      feedback.style.color = "#1b5e20";
      sonidos.final.play();
      guardarPuntajeFracciones(aciertos, Number(total), nivelActual);
    }
  };

  async function guardarPuntajeFracciones(puntajeFinal, tiempoTotal, nivel) {
    if (!usuarioId) {
      alert("⚠️ Debes iniciar sesión para guardar tu puntaje.");
      return;
    }

    try {
      await guardarPuntaje(
        usuarioId,
        ID_JUEGO_FRACCIONES,
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

  function cargarTopPorDificultad(claseId = null) {
    ["facil", "medio", "dificil"].forEach((nivel) => {
      let url = `${BACKEND}/scores/top?juego=${ID_JUEGO_FRACCIONES}&nivel=${nivel}`;
      if (claseId) url += `&clase_id=${claseId}`;

      fetch(url)
        .then((r) => r.json())
        .then((lista) => {
          const ul = document.getElementById(`lista-top-${nivel}`);
          if (!ul) return;

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
          const ul = document.getElementById(`lista-top-${nivel}`);
          if (ul)
            ul.innerHTML =
              "<li class='list-group-item text-danger'>Error al cargar.</li>";
        });
    });
  }

  // INICIO
  document.getElementById("btn-facil").classList.add("seleccionado");
  cargarTopPorDificultad();
});
