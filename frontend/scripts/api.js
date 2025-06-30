// scripts/api.js

import { BASE_API_URL } from "./config.js";

export const SCORES_URL = `${BASE_API_URL}/scores`;

/**
 * Envía un nuevo puntaje al backend
 * @param {string} usuario_id
 * @param {string} juego_id
 * @param {number} puntaje
 * @param {number} tiempo
 * @param {string} nivel
 */
export async function guardarPuntaje(
  usuario_id,
  juego_id,
  puntaje,
  tiempo,
  nivel
) {
  try {
    const payload = {
      usuario_id,
      juego_id,
      puntaje,
      tiempo,
      nivel,
    };

    console.log("Enviando puntaje:", payload);

    const respuesta = await fetch(SCORES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      console.error("Error al guardar puntaje:", resultado);
      throw new Error(
        resultado.error || "Error desconocido al guardar puntaje"
      );
    }

    console.log("✅ Puntaje guardado correctamente:", resultado);
    return resultado;
  } catch (error) {
    console.error("❌ Error al guardar el puntaje:", error);
    throw error;
  }
}

/**
 * Obtiene el Top 10 para un juego (opcional con filtros)
 * @param {string} juego_id
 * @param {string} nivel
 * @param {string} clase_id
 */
export async function obtenerTopPuntajes(
  juego_id,
  nivel = null,
  clase_id = null
) {
  try {
    let url = `${SCORES_URL}/top?juego=${juego_id}`;
    if (nivel) url += `&nivel=${nivel}`;
    if (clase_id) url += `&clase_id=${clase_id}`;

    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || "Error al obtener top");
    }

    return datos;
  } catch (error) {
    console.error("❌ Error al obtener top:", error);
    return [];
  }
}
