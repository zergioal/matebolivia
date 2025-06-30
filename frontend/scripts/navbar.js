import { BASE_API_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const usuarioId = localStorage.getItem("usuario_id");
  const userArea = document.getElementById("navbar-user-area");

  if (!userArea) return;

  if (!usuarioId) {
    // NO hay sesión, muestro el enlace de Login
    userArea.innerHTML = `
      <a class="btn btn-outline-light ms-2" href="login.html">Login / Registrarse</a>
    `;
    return;
  }

  // Hay sesión: mientras carga puedo dejar algo "neutral" si quieres:
  userArea.innerHTML = `
    <a class="nav-link d-flex align-items-center" href="#">
      <img src="assets/avatar-default.png" class="rounded-circle me-2" style="width:30px; height:30px;">
      <span>Cargando...</span>
    </a>
  `;

  // Llamo al backend para obtener el avatar real
  fetch(`${BASE_API_URL}/usuarios/${usuarioId}/resumen`)
    .then((res) => res.json())
    .then((data) => {
      if (!data.usuario) {
        userArea.innerHTML = `
          <a class="btn btn-outline-light ms-2" href="login.html">Login / Registrarse</a>
        `;
        return;
      }

      const nombre = data.usuario.nombre;
      const correo = data.usuario.correo || "Sin correo";

      const avatarUrl =
        data.avatar_activo?.imagen_url || "assets/avatar-default.png";

      userArea.innerHTML = `
  <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
    <img src="${avatarUrl}" alt="Avatar" class="rounded-circle me-2" style="width:30px; height:30px; object-fit:cover;">
    <span>${nombre}</span>
  </a>
  <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end p-3 shadow" aria-labelledby="userDropdown" style="min-width: 220px;">
    <li class="text-center mb-2">
      <img src="${avatarUrl}" alt="Avatar" class="rounded-circle shadow" style="width: 60px; height: 60px; object-fit: cover;">
      <div class="mt-2 fw-bold">${nombre}</div>
      <div class="text-muted small">${correo}</div>
    </li>
    <li><hr class="dropdown-divider"></li>
    <li><a class="dropdown-item d-flex align-items-center gap-2" href="panel.html">👤 Ver Panel</a></li>
    <li><a class="dropdown-item d-flex align-items-center gap-2" href="editar-perfil.html">✏️ Editar Perfil</a></li>
    <li><a class="dropdown-item d-flex align-items-center gap-2 text-danger" href="#" id="logoutBtn">🔓 Cerrar Sesión</a></li>
  </ul>
`;

      document.getElementById("logoutBtn").addEventListener("click", () => {
        if (confirm("¿Seguro que deseas cerrar sesión?")) {
          localStorage.removeItem("usuario_id");
          localStorage.removeItem("usuario_rol");
          localStorage.removeItem("usuario_nombre");
          window.location.href = "login.html";
        }
      });
    })
    .catch((err) => {
      console.error("Error cargando datos del usuario:", err);
      userArea.innerHTML = `
        <a class="btn btn-outline-light ms-2" href="login.html">Login / Registrarse</a>
      `;
    });
});
