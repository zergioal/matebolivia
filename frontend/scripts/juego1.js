import { guardarPuntaje } from './api.js';

let puntaje = 0;
let intentos = 0;
const maxPreguntas = 5;

const preguntaEl = document.getElementById('pregunta');
const opcionesEl = document.getElementById('opciones');
const puntajeEl = document.getElementById('puntaje');
const reiniciarBtn = document.getElementById('reiniciar');

function generarPregunta() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const correcta = a * b;

  preguntaEl.textContent = `¿Cuánto es ${a} × ${b}?`;

  const opciones = [correcta];
  while (opciones.length < 4) {
    const incorrecta = Math.floor(Math.random() * 100);
    if (!opciones.includes(incorrecta)) {
      opciones.push(incorrecta);
    }
  }

  opciones.sort(() => Math.random() - 0.5); // mezclar

  opcionesEl.innerHTML = '';
  opciones.forEach(valor => {
    const btn = document.createElement('button');
    btn.textContent = valor;
    btn.onclick = () => verificarRespuesta(valor, correcta);
    opcionesEl.appendChild(btn);
  });
}

function verificarRespuesta(seleccionada, correcta) {
  if (seleccionada === correcta) {
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
    guardarPuntaje(nombre.trim(), "Operaciones básicas", puntaje);
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
