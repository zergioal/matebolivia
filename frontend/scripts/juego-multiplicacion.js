// juego-multiplicacion.js (actualizado con operaciones combinadas en nivel difícil)

const FACIL_RANGO = 10;
const DIFICIL_RANGO = 6;

const NUMEROS_FACILES = [2, 3, 4, 5, 10, 11, 12, 15, 20, 25];
const SIMBOLOS = ["×", "·", "*", "()"];

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

function formatoParentesis(n) {
  if (n < 0) return `(${n})`;
  if (Math.random() < 0.5) return `(+${n})`;
  return `${n}`;
}

function generarPregunta(nivel) {
  let factores = [],
    expr = "\\(",
    correcta = 1;
  const simbolo = SIMBOLOS[Math.floor(Math.random() * SIMBOLOS.length)];

  if (nivel === "facil") {
    factores = Array.from(
      { length: 2 },
      () => Math.floor(Math.random() * 21) - 10
    );
    correcta = factores.reduce((a, b) => a * b, 1);

    if (simbolo === "()") {
      expr += factores.map((n) => `(${n})`).join("");
    } else {
      expr += formatoParentesis(factores[0]);
      for (let i = 1; i < factores.length; i++) {
        expr += ` ${simbolo} ${formatoParentesis(factores[i])}`;
      }
    }
    expr += "\\)";
  }

  if (nivel === "medio") {
    const cantidad = Math.floor(Math.random() * 2) + 3; // 3 o 4 factores
    for (let i = 0; i < cantidad; i++) {
      let num =
        Math.floor(Math.random() * (2 * DIFICIL_RANGO + 1)) - DIFICIL_RANGO;
      if (num === 0) num = 1;
      factores.push(num);
    }

    correcta = factores.reduce((a, b) => a * b, 1);

    if (simbolo === "()") {
      expr += factores.map((n) => `(${n})`).join("");
    } else {
      expr += formatoParentesis(factores[0]);
      for (let i = 1; i < factores.length; i++) {
        expr += ` ${simbolo} ${formatoParentesis(factores[i])}`;
      }
    }
    expr += "\\)";
  }

  if (nivel === "dificil") {
    const tipo = Math.floor(Math.random() * 3); // 0: entero ± multiplicación, 1: multiplicación ± entero, 2: multiplicación ± multiplicación
    const op = Math.random() < 0.5 ? "+" : "-";

    const mult = (n) => {
      const a = Math.floor(Math.random() * 11) - 5 || 1;
      const b = Math.floor(Math.random() * 11) - 5 || 2;
      const resultado = a * b;
      let parte =
        simbolo === "()"
          ? `(${a})(${b})`
          : `${formatoParentesis(a)} ${simbolo} ${formatoParentesis(b)}`;
      return { texto: parte, valor: resultado };
    };

    let texto = "",
      resultado = 0;
    if (tipo === 0) {
      const entero = Math.floor(Math.random() * 21) - 10;
      const m = mult();
      resultado = op === "+" ? entero + m.valor : entero - m.valor;
      texto = `${entero} ${op} ${m.texto}`;
    } else if (tipo === 1) {
      const entero = Math.floor(Math.random() * 21) - 10;
      const m = mult();
      resultado = op === "+" ? m.valor + entero : m.valor - entero;
      texto = `${m.texto} ${op} ${Math.abs(entero)}`;
    } else {
      const m1 = mult();
      const m2 = mult();
      resultado = op === "+" ? m1.valor + m2.valor : m1.valor - m2.valor;
      texto = `${m1.texto} ${op} ${m2.texto}`;
    }

    correcta = resultado;
    expr += `${texto}\\)`;
  }

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
