const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  nombre: String,
  unidad: String,
  puntaje: Number,
  tiempo: Number,
  nivel: String,
  juego: String,
});

module.exports = mongoose.model("Score", scoreSchema);
