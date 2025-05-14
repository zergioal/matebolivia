// utils/fracciones.js

// Genera una fracción aleatoria simplificada con denominadores entre 2 y 10, limitada por dificultad
export function generarFraccionAleatoria(dificultad = "facil") {
  let den, num;
  switch (dificultad) {
    case "facil":
      den = randomInt(2, 6);
      num = randomInt(1, den - 1);
      break;
    case "medio":
      den = randomInt(4, 8);
      num = randomInt(1, den - 1);
      break;
    case "dificil":
      den = randomInt(6, 12);
      num = randomInt(1, den - 1);
      break;
    default:
      den = randomInt(2, 10);
      num = randomInt(1, den - 1);
  }
  return simplificarFraccion({ num, den });
}

// Genera una fracción objetivo sumando 2-3 fracciones válidas
export function generarFraccionObjetivo(dificultad = "facil") {
  const cantidad = dificultad === "dificil" ? 3 : 2;
  const partes = Array.from({ length: cantidad }, () =>
    generarFraccionAleatoria(dificultad)
  );
  const suma = partes.reduce((acc, curr) => sumarFracciones(acc, curr));
  return { objetivo: suma, partes };
}

export function sumarFracciones(a, b) {
  const num = a.num * b.den + b.num * a.den;
  const den = a.den * b.den;
  return simplificarFraccion({ num, den });
}

export function sonIguales(a, b) {
  return a.num * b.den === b.num * a.den;
}

function simplificarFraccion(frac) {
  const mcd = obtenerMCD(frac.num, frac.den);
  return {
    num: frac.num / mcd,
    den: frac.den / mcd,
  };
}

function obtenerMCD(a, b) {
  return b === 0 ? a : obtenerMCD(b, a % b);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
