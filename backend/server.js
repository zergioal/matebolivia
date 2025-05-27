const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const scoreRoutes = require("./routes/scores");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ✅ Ruta de prueba para verificar que el backend responde
app.get("/", (req, res) => {
  res.send("🎉 Backend MateBolivia activo");
});

// ✅ Esta línea es la más importante: vincula las rutas
app.use("/api/scores", scoreRoutes);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Conectado a MongoDB");
    app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
  })
  .catch((err) => console.error("❌ Error en conexión MongoDB:", err));
