import { BASE_API_URL } from "./config.js";

const API_URL = `${BASE_API_URL}/usuarios`;

// LOGIN
document.querySelector("#login form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target[0].value;
  const password = e.target[1].value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("usuario_id", data.user.id);
      localStorage.setItem(
        "usuario_nombre",
        data.user.user_metadata?.nombre || "Invitado"
      );
      localStorage.setItem(
        "usuario_rol",
        data.user.user_metadata?.rol || "estudiante"
      );
      window.location.href = "panel.html";
    } else {
      alert(data.error || "Error al iniciar sesión");
    }
  } catch (err) {
    alert("No se pudo conectar con el servidor.");
  }
});

// REGISTRO
document
  .querySelector("#registro form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = e.target[0].value;
    const email = e.target[1].value;
    const rol = e.target[2].value;
    const password = e.target[3].value;
    const confirmar = e.target[4].value;

    if (password !== confirmar) {
      return alert("Las contraseñas no coinciden");
    }

    if (!rol) {
      return alert("Debes seleccionar un rol");
    }

    try {
      const res = await fetch(`${API_URL}/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password, rol }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registro exitoso. Ahora puedes iniciar sesión.");
        mostrarLogin();
      } else {
        alert(data.error || "Error al registrar");
      }
    } catch (err) {
      alert("No se pudo conectar con el servidor.");
    }
  });
