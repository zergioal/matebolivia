export function generarFraccionAleatoria(dificultad, denominadorFijo = null) {
  let den;
  if (dificultad === "facil") {
    den = denominadorFijo || [4, 6, 8, 10, 12][Math.floor(Math.random() * 5)];
    const num = Math.floor(Math.random() * (den - 1)) + 1;
    return { num, den };
  }

  if (dificultad === "medio") {
    // denominadores pequeños, fáciles de sumar
    den = [2, 3, 4, 5, 6, 8, 10, 12][Math.floor(Math.random() * 8)];
    const num = Math.floor(Math.random() * (den - 1)) + 1;
    return { num, den };
  }

  // dificil
  den = Math.floor(Math.random() * 11) + 5; // 5 a 15
  const num = Math.floor(Math.random() * (den - 1)) + 1;
  return { num, den };
}

export function sumarFracciones(a, b) {
  const num = a.num * b.den + b.num * a.den;
  const den = a.den * b.den;
  return simplificarFraccion({ num, den });
}

export function simplificarFraccion(frac) {
  const mcd = (a, b) => (b === 0 ? a : mcd(b, a % b));
  const divisor = Math.abs(mcd(frac.num, frac.den));
  return {
    num: frac.num / divisor,
    den: frac.den / divisor,
  };
}

export function sonIguales(a, b) {
  const f1 = simplificarFraccion(a);
  const f2 = simplificarFraccion(b);
  return f1.num === f2.num && f1.den === f2.den;
}

export function generarFraccionObjetivo(dificultad) {
  let partes = [];
  let objetivo = { num: 0, den: 1 };

  if (dificultad === "facil") {
    // mismas denominadores homogéneas
    const den = [4, 6, 8, 10, 12][Math.floor(Math.random() * 5)];
    let totalNum = 0;
    const cantidadPartes = 2 + Math.floor(Math.random() * 2); // 2 o 3

    for (let i = 0; i < cantidadPartes; i++) {
      const frac = generarFraccionAleatoria("facil", den);
      partes.push(frac);
      totalNum += frac.num;
    }

    // NO SIMPLIFICAR el objetivo aquí:
    objetivo = { num: totalNum, den };

    return { objetivo, partes };
  }

  if (dificultad === "medio") {
    const cantidadPartes = 2 + Math.floor(Math.random() * 2); // 2 o 3
    partes = [];
    objetivo = { num: 0, den: 1 };

    for (let i = 0; i < cantidadPartes; i++) {
      const frac = generarFraccionAleatoria("medio");
      partes.push(frac);
      objetivo = sumarFracciones(objetivo, frac);
    }

    objetivo = simplificarFraccion(objetivo);
    return { objetivo, partes };
  }

  // dificil
  const cantidadPartes = 3 + Math.floor(Math.random() * 2); // 3 o 4
  partes = [];
  objetivo = { num: 0, den: 1 };

  for (let i = 0; i < cantidadPartes; i++) {
    const frac = generarFraccionAleatoria("dificil");
    partes.push(frac);
    objetivo = sumarFracciones(objetivo, frac);
  }

  objetivo = simplificarFraccion(objetivo);
  return { objetivo, partes };
}
