// scripts/fracciones-drag.js  ── versión con cronómetro, puntaje, niveles, sonidos y fracciones aleatorias

document.addEventListener("DOMContentLoaded", () => {
  const origen = document.getElementById("fracciones-origen");
  const destino = document.getElementById("fracciones-destino");
  const feedback = document.getElementById("feedback-juego");
  const niveles = ["facil", "medio", "dificil"];

  const cronometroBox = document.createElement("div");
  cronometroBox.id = "cronometro";
  cronometroBox.className = "cronometro";
  cronometroBox.textContent = "⏱️ 0.0 s";
  feedback.before(cronometroBox);

  const puntajeBox = document.createElement("div");
  puntajeBox.id = "puntaje";
  puntajeBox.className = "puntaje";
  puntajeBox.textContent = "Puntaje: 0/4";
  cronometroBox.after(puntajeBox);

  const sonidos = {
    acierto: new Audio("assets/sonidos/acierto.mp3"),
    error: new Audio("assets/sonidos/error.mp3"),
    final: new Audio("assets/sonidos/final.mp3"),
  };

  let aciertos = 0;
  let startTime = null;
  let intervalID = null;

  const fraccionesEquivalentes = {
    facil: [
      ["1/2", "2/4"],
      ["1/3", "2/6"],
      ["3/4", "6/8"],
      ["1/4", "2/8"],
    ],
    medio: [
      ["2/5", "4/10"],
      ["3/5", "6/10"],
      ["3/8", "6/16"],
      ["4/7", "8/14"],
    ],
    dificil: [
      ["5/9", "10/18"],
      ["7/10", "14/20"],
      ["5/8", "15/24"],
      ["9/12", "27/36"],
    ],
  };

  let seleccionadas = [];

  const startTimer = () => {
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
    div.innerHTML = `\\( ${contenido} \\)`;
    return div;
  };

  const generarJuego = (nivel) => {
    origen.innerHTML = "";
    destino.innerHTML = "";
    feedback.textContent = "";
    aciertos = 0;
    startTime = null;
    clearInterval(intervalID);
    cronometroBox.textContent = "⏱️ 0.0 s";
    puntajeBox.textContent = "Puntaje: 0/4";

    // Selección aleatoria de 4 pares
    seleccionadas = fraccionesEquivalentes[nivel]
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);

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

  // Manejo de dificultad
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

  // Eventos drag & drop
  origen.addEventListener("dragstart", (e) => {
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

  destino.addEventListener("dragover", (e) => e.preventDefault());

  destino.addEventListener("drop", (e) => {
    e.preventDefault();
    const target = e.target.closest(".fraccion-target");
    if (!target || target.classList.contains("completo")) return;

    const data = e.dataTransfer.getData("text/plain");
    const objetivo = target.dataset.objetivo;
    const card = document.querySelector(
      `.fraccion-card[data-equivalente="${data}"]`
    );
    if (!card) return;

    if (data === objetivo) {
      target.innerHTML = card.innerHTML;
      target.classList.add("completo");
      card.remove();
      aciertos++;
      puntajeBox.textContent = `Puntaje: ${aciertos}/4`;
      feedback.textContent = "¡Correcto!";
      feedback.style.color = "#2e7d32";
      sonidos.acierto.play();
      MathJax.typesetPromise();
    } else {
      feedback.textContent = "Inténtalo otra vez";
      feedback.style.color = "#c62828";
      sonidos.error.play();
    }

    if (aciertos === 4) {
      stopTimer();
      const total = ((Date.now() - startTime) / 1000).toFixed(1);
      feedback.textContent = `¡Completado en ${total} s! 🎉`;
      feedback.style.color = "#1b5e20";
      sonidos.final.play();
    }
  });

  // Inicializa con nivel fácil por defecto
  generarJuego("facil");
});
