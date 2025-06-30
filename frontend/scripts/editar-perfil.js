import { BASE_API_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const usuarioId = localStorage.getItem("usuario_id");
  if (!usuarioId) {
    alert("Usuario no autenticado. Por favor, inicia sesión.");
    window.location.href = "login.html";
    return;
  }

  const nombreInput = document.getElementById("nombre");
  const correoInput = document.getElementById("correo");
  const passwordInput = document.getElementById("password");
  const mensajeDiv = document.getElementById("mensaje-perfil");

  // 1️⃣ Cargar datos actuales
  fetch(`${BASE_API_URL}/usuarios/${usuarioId}/resumen`)
    .then((res) => res.json())
    .then((data) => {
      if (data.usuario) {
        nombreInput.value = data.usuario.nombre || "";
        correoInput.value = data.usuario.correo || "";
      } else {
        throw new Error("No se pudo cargar el perfil.");
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Error al cargar los datos del perfil.");
    });

  // 2️⃣ Guardar cambios
  document
    .getElementById("editarPerfilForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const payload = {
        nombre: nombreInput.value.trim(),
        correo: correoInput.value.trim(),
      };

      // Solo enviar password si fue llenado
      if (passwordInput.value.trim()) {
        payload.password = passwordInput.value.trim();
      }

      try {
        const res = await fetch(
          `${BASE_API_URL}/usuarios/${usuarioId}/actualizar`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const data = await res.json();

        mensajeDiv.classList.remove("d-none", "alert-success", "alert-danger");

        if (res.ok) {
          mensajeDiv.classList.add("alert-success");
          mensajeDiv.textContent = "✅ Perfil actualizado correctamente.";
          // Actualizar localStorage
          localStorage.setItem("usuario_nombre", payload.nombre);
        } else {
          mensajeDiv.classList.add("alert-danger");
          mensajeDiv.textContent = `❌ Error: ${
            data.error || "No se pudo actualizar."
          }`;
        }
      } catch (err) {
        console.error(err);
        mensajeDiv.classList.remove("d-none");
        mensajeDiv.classList.add("alert-danger");
        mensajeDiv.textContent = "❌ Error de conexión con el servidor.";
      }
    });
});
