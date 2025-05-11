import { obtenerPuntajes } from './api.js';

const tabla = document.getElementById('tablaPuntajes');
const selectJuego = document.getElementById('juegoSelect');

let todosLosPuntajes = [];

// Formatea la fecha en formato legible
function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Muestra los puntajes en la tabla según el filtro
function mostrarPuntajes(lista) {
  tabla.innerHTML = ''; // limpia la tabla

  if (lista.length === 0) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 4;
    celda.textContent = 'No hay puntajes para mostrar.';
    fila.appendChild(celda);
    tabla.appendChild(fila);
    return;
  }

  lista.forEach(p => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${p.nombre}</td>
      <td>${p.juego}</td>
      <td>${p.puntaje}</td>
      <td>${formatearFecha(p.fecha)}</td>
    `;
    tabla.appendChild(fila);
  });
}

// Filtra según selección del select
selectJuego.addEventListener('change', () => {
  const valor = selectJuego.value;
  if (valor === 'todos') {
    mostrarPuntajes(todosLosPuntajes);
  } else {
    const filtrados = todosLosPuntajes.filter(p => p.juego === valor);
    mostrarPuntajes(filtrados);
  }
});

// Carga los puntajes desde el backend
async function cargarPuntajes() {
  todosLosPuntajes = await obtenerPuntajes();
  mostrarPuntajes(todosLosPuntajes);
}

cargarPuntajes();
