// scripts/api.js

const API_URL = 'https://juegosbackend.onrender.com/api/scores';

/**
 * Envía un nuevo puntaje al backend
 * @param {string} nombre - Nombre del jugador
 * @param {string} juego - Nombre del juego
 * @param {number} puntaje - Puntaje obtenido
 */
export async function guardarPuntaje(nombre, juego, puntaje) {
  try {
    const respuesta = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nombre, juego, puntaje })
    });

    const resultado = await respuesta.json();
    console.log('✅ Puntaje guardado correctamente:', resultado);
  } catch (error) {
    console.error('❌ Error al guardar el puntaje:', error);
  }
}

/**
 * Obtiene los mejores puntajes desde el backend
 * @returns {Promise<Array>} - Lista de puntajes
 */
export async function obtenerPuntajes() {
  try {
    const respuesta = await fetch(API_URL);
    const datos = await respuesta.json();
    return datos;
  } catch (error) {
    console.error('❌ Error al obtener puntajes:', error);
    return [];
  }
}
