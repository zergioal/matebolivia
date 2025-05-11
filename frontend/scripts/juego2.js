import { guardarPuntaje } from './api.js';

let puntaje = 0;
let intentos = 0;
const maxPreguntas = 5;

const preguntaEl = document.getElementById('pregunta');
const opcionesEl = document.getElementById('opciones');
const puntajeEl = document.getElementById('puntaje');
const reiniciarBtn = document.getElementById('reiniciar');

// Genera una fracción base y una equivalente real
function generarFraccionEquivalente() {
  const num = Math.floor(Math.random() * 9) + 1;
  const den = Math.floor(Math.random() * 9) + 1;
  const factor = Math.floor(Math.random() * 5) + 2;

  const correcta = {
    numerador: num * factor,
    denominador: den * factor
  };

  return {
    base: { numerador: num, denominador: den },
    correcta
  };
}

function generarPregunta() {
  const { base, correcta } = generarFraccionEquivalente();
  const frBaseTexto = `${base.numerador}/${base.denominador}`;
  preguntaEl.textContent = `¿Cuál de estas fracciones es equivalente a ${frBaseTexto}?`;

  const opciones = [`${correcta.numerador}/${correcta.denominador}`];

  // Generar opciones incorrectas
  while (opciones.length < 4) {
    const n = Math.floor(Math.random() * 9) + 1;
    const d = Math.floor(Math.random() * 9) + 1;
    const fr = `${n}/${d}`;

    if (!opciones.includes(fr) && n / d !== base.numerador / base.denominador) {
      opciones.push(fr);
    }
  }

  opciones.sort(() => Math.random() - 0.5); // Mezclar

  opcionesEl.innerHTML = '';
  opciones.forEach(opcion => {
    const btn = document.createElement('button');
    btn.textContent = opcion;
    btn.onclick = () => verificarRespuesta(opcion, `${correcta.numerador}/${correcta.denominador}`);
    opcionesEl.appendChild(btn);
  });
}

function verificarRespuesta(elegida, correcta) {
  if (elegida === correcta) {
    puntaje++;
  }
  intentos++;

  puntajeEl.textContent = `Puntaje: ${puntaje}`;

  if (intentos >= maxPreguntas) {
    finalizarJuego();
  } else {
    generarPregunta();
  }
}

function finalizarJuego() {
  opcionesEl.innerHTML = '';
  preguntaEl.textContent = '🎉 ¡Juego terminado!';
  const nombre = prompt("🎮 Ingresa tu nombre para guardar el puntaje:");

  if (nombre && nombre.trim() !== '') {
    guardarPuntaje(nombre.trim(), "Fracciones equivalentes", puntaje);
  } else {
    alert("❗ No se guardó el puntaje porque no se ingresó un nombre válido.");
  }
}

reiniciarBtn.onclick = () => {
  puntaje = 0;
  intentos = 0;
  puntajeEl.textContent = `Puntaje: ${puntaje}`;
  generarPregunta();
};

generarPregunta();
