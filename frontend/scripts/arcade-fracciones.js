// scripts/arcade-fracciones.js

import {
  generarFraccionAleatoria,
  generarFraccionObjetivo,
  sumarFracciones,
  sonIguales,
} from "./utils/fracciones.js";

const sonidoCorrecto = new Audio("assets/sonidos/correcto.mp3");

function generarFraccionHomogenea(denominador) {
  const num = Math.floor(Math.random() * (denominador - 1)) + 1;
  return { num, den: denominador };
}

document.addEventListener("DOMContentLoaded", () => {
  const zonaJuego = document.getElementById("zona-juego");
  const objetivoEl = document.getElementById("fraccion-objetivo");
  const puntajeEl = document.getElementById("puntaje");
  const feedbackEl = document.getElementById("feedback-juego");
  const btnReiniciar = document.getElementById("reiniciar");

  let bloques = [];
  let seleccionados = [];
  let puntaje = 0;
  let objetivo = { num: 1, den: 1 };
  let dificultad = "facil";

  function fraccionToLatex({ num, den }) {
    return `\\( \\frac{${num}}{${den}} \\)`;
  }

  function actualizarVista() {
    objetivoEl.innerHTML = `Objetivo: ${fraccionToLatex(objetivo)}`;
    puntajeEl.textContent = `Puntaje: ${puntaje}`;
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
      if (puntaje === 5) {
        const mensaje = document.getElementById("mensaje-final");
        mensaje.textContent =
          "🎉 ¡Excelente! Has resuelto 5 fracciones correctamente.";
        mensaje.style.display = "block";
      }

      feedbackEl.textContent = "¡Correcto!";
      feedbackEl.style.color = "#2e7d32";
      sonidoCorrecto.play();
      seleccionados.forEach((b) => {
        b.classList.add("animar-salida");
        setTimeout(() => b.remove(), 300);
      });
      seleccionados = [];
      const siguiente = generarFraccionObjetivo(dificultad);
      objetivo = siguiente.objetivo;
      generarBloques(siguiente.partes);
      actualizarVista();
    }
  }

  function iniciarJuego() {
    puntaje = 0;
    const objetivoInfo = generarFraccionObjetivo(dificultad);
    objetivo = objetivoInfo.objetivo;
    generarBloques(objetivoInfo.partes);
    actualizarVista();
    feedbackEl.textContent = "";

    // Marcar botón seleccionado
    const niveles = ["facil", "medio", "dificil"];
    niveles.forEach((n) =>
      document.getElementById(`btn-${n}`)?.classList.remove("seleccionado")
    );
    document.getElementById(`btn-${dificultad}`)?.classList.add("seleccionado");
  }

  btnReiniciar.addEventListener("click", iniciarJuego);

  const niveles = ["facil", "medio", "dificil"];
  niveles.forEach((nivel) => {
    const btn = document.getElementById(`btn-${nivel}`);
    if (btn) {
      btn.addEventListener("click", () => {
        dificultad = nivel;
        iniciarJuego();
      });
    }
  });

  iniciarJuego();
});
