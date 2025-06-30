import {
  generarFraccionAleatoria,
  generarFraccionObjetivo,
  sumarFracciones,
  sonIguales,
} from "./utils/fracciones.js";
import { BASE_API_URL } from "./config.js";
import { guardarPuntaje } from "./api.js";

const usuarioId = localStorage.getItem("usuario_id");
const ID_JUEGO_ARCADE_FRACCIONES = "87b3700c-4404-4991-9cf5-2c355a53e559"; // reemplaza con tu UUID real
const BACKEND = BASE_API_URL;

const sonidoCorrecto = new Audio("assets/sonidos/correcto.mp3");
const sonidoFinal = new Audio("assets/sonidos/final.mp3");

document.addEventListener("DOMContentLoaded", () => {
  const zonaJuego = document.getElementById("zona-juego");
  const objetivoEl = document.getElementById("fraccion-objetivo");
  const puntajeEl = document.getElementById("puntaje");
  const feedbackEl = document.getElementById("feedback-juego");
  const btnReiniciar = document.getElementById("reiniciar");
  const btnIniciar = document.getElementById("btn-iniciar");
  const contenedorBoton = document.getElementById("contenedor-boton-iniciar");
  const bloqueNiveles = document.getElementById("bloque-niveles");
  const tableroJuego = document.getElementById("tablero-juego");

  let bloques = [];
  let seleccionados = [];
  let puntaje = 0;
  let objetivo = { num: 1, den: 1 };
  let dificultad = "facil";
  let juegoTerminado = false;

  const niveles = ["facil", "medio", "dificil"];

  btnIniciar.addEventListener("click", () => {
    contenedorBoton.style.display = "none";
    bloqueNiveles.style.display = "flex";
    feedbackEl.textContent = "";
  });

  function fraccionToLatex({ num, den }) {
    return `\\( \\frac{${num}}{${den}} \\)`;
  }

  function actualizarVista() {
    objetivoEl.innerHTML = `Objetivo: ${fraccionToLatex(objetivo)}`;
    puntajeEl.textContent = `Puntaje: ${puntaje} / 5`;
    MathJax.typesetPromise();
  }

  function crearBloque(frac, x, y) {
    const div = document.createElement("div");
    div.className = "bloque-fraccion animar-entrada";
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;
    div.dataset.num = frac.num;
    div.dataset.den = frac.den;
    div.innerHTML = fraccionToLatex(frac);
    zonaJuego.appendChild(div);
    MathJax.typesetPromise();
    return div;
  }

  function generarFraccionHomogenea(denominador) {
    const num = Math.floor(Math.random() * (denominador - 1)) + 1;
    return { num, den: denominador };
  }

  function generarBloques(partes, cantidadExtra = 4) {
    zonaJuego.innerHTML = "";
    bloques = [];
    seleccionados = [];
    const usadas = [...partes];

    for (let i = 0; i < cantidadExtra; i++) {
      if (dificultad === "facil") {
        const den = partes[0].den;
        usadas.push(generarFraccionHomogenea(den));
      } else {
        usadas.push(generarFraccionAleatoria(dificultad));
      }
    }

    usadas
      .sort(() => 0.5 - Math.random())
      .forEach((frac) => {
        let tries = 0,
          maxTries = 50;
        let x, y, overlaps;
        do {
          x = Math.random() * (zonaJuego.clientWidth - 100);
          y = Math.random() * (zonaJuego.clientHeight - 60);
          overlaps = bloques.some((b) => {
            const bx = parseFloat(b.style.left);
            const by = parseFloat(b.style.top);
            return Math.abs(bx - x) < 90 && Math.abs(by - y) < 60;
          });
          tries++;
        } while (overlaps && tries < maxTries);

        const div = crearBloque(frac, x, y);

        div.addEventListener("click", () => {
          if (juegoTerminado) return;
          const alreadySelected = seleccionados.includes(div);
          if (alreadySelected) {
            div.classList.remove("bloque-seleccionado");
            seleccionados = seleccionados.filter((b) => b !== div);
          } else {
            div.classList.add("bloque-seleccionado");
            seleccionados.push(div);
          }
          verificarSuma();
        });

        bloques.push(div);
      });
  }

  function verificarSuma() {
    if (seleccionados.length === 0) return;

    const fracs = seleccionados.map((div) => ({
      num: parseInt(div.dataset.num),
      den: parseInt(div.dataset.den),
    }));

    const resultado = fracs.reduce((acc, curr) => sumarFracciones(acc, curr));

    if (sonIguales(resultado, objetivo)) {
      puntaje++;
      feedbackEl.textContent = "¡Correcto!";
      feedbackEl.style.color = "#2e7d32";
      sonidoCorrecto.play();

      seleccionados.forEach((b) => {
        b.classList.add("animar-salida");
        setTimeout(() => b.remove(), 300);
      });
      seleccionados = [];

      if (puntaje >= 5) {
        feedbackEl.textContent = `🎉 ¡Excelente! Has resuelto 5 fracciones correctamente.`;
        feedbackEl.style.color = "#1b5e20";
        sonidoFinal.play();
        juegoTerminado = true;
        guardarPuntajeArcade(puntaje, dificultad);
        return;
      }

      const siguiente = generarFraccionObjetivo(dificultad);
      objetivo = siguiente.objetivo;
      generarBloques(siguiente.partes);
      actualizarVista();
    } else {
      feedbackEl.textContent = "Inténtalo otra vez.";
      feedbackEl.style.color = "#c62828";
    }
  }

  function iniciarJuego() {
    puntaje = 0;
    juegoTerminado = false;
    feedbackEl.textContent = "";
    tableroJuego.style.display = "block";
    bloqueNiveles.style.display = "none";
    const objetivoInfo = generarFraccionObjetivo(dificultad);
    objetivo = objetivoInfo.objetivo;
    generarBloques(objetivoInfo.partes);
    actualizarVista();

    niveles.forEach((n) =>
      document.getElementById(`btn-${n}`)?.classList.remove("seleccionado")
    );
    document.getElementById(`btn-${dificultad}`)?.classList.add("seleccionado");
  }

  btnReiniciar.addEventListener("click", iniciarJuego);

  niveles.forEach((nivel) => {
    const btn = document.getElementById(`btn-${nivel}`);
    if (btn) {
      btn.addEventListener("click", () => {
        dificultad = nivel;
        iniciarJuego();
      });
    }
  });

  async function guardarPuntajeArcade(puntajeFinal, nivel) {
    if (!usuarioId) {
      alert("⚠️ Debes iniciar sesión para guardar tu puntaje.");
      return;
    }
    try {
      await guardarPuntaje(
        usuarioId,
        ID_JUEGO_ARCADE_FRACCIONES,
        Number(puntajeFinal),
        0,
        nivel
      );
      console.log("✅ Puntaje guardado correctamente");
      cargarTopPorDificultad();
    } catch (err) {
      console.error("❌ Error al guardar puntaje:", err);
      alert("❌ No se pudo guardar el puntaje. Intenta de nuevo más tarde.");
    }
  }

  function cargarTopPorDificultad() {
    ["facil", "medio", "dificil"].forEach((nivel) => {
      let url = `${BACKEND}/scores/top?juego=${ID_JUEGO_ARCADE_FRACCIONES}&nivel=${nivel}`;
      fetch(url)
        .then((r) => r.json())
        .then((lista) => {
          const ul = document.getElementById(`lista-top-${nivel}`);
          if (!ul) return;
          ul.innerHTML = "";
          if (!Array.isArray(lista) || lista.length === 0) {
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
                  <span class="badge bg-success ms-2">${p.puntaje} pts</span>
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
