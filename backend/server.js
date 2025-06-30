require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const scoresRoutes = require("./routes/scores");
const clasesRoutes = require("./routes/clases");
const usuariosRoutes = require("./routes/usuarios"); // Si tienes un archivo de rutas para usuarios
const juegosRoutes = require("./routes/juegos");
const rankingRoutes = require("./routes/ranking");

// (más adelante puedes agregar: clasesRoutes, usuariosRoutes...)

app.use(cors());
app.use(express.json());

// Health-check básico
app.get("/", (req, res) => {
  res.json({
    mensaje: "API MateBolivia corriendo",
    version: "1.0.0",
  });
});

app.use("/api/scores", scoresRoutes);
app.use("/api/clases", clasesRoutes);
app.use("/api/usuarios", usuariosRoutes); // Asegúrate de que este archivo exista
app.use("/api/juegos", juegosRoutes);
app.use("/api/ranking", rankingRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
