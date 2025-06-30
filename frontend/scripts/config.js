const ENV = "local"; // "production" o "local"

export const BASE_API_URL =
  ENV === "production"
    ? "https://juegosbackend.onrender.com/api"
    : "http://localhost:3000/api";

export const SCORES_URL = `${BASE_API_URL}/scores`;
export const USUARIOS_URL = `${BASE_API_URL}/usuarios`;
export const CLASES_URL = `${BASE_API_URL}/clases`;
