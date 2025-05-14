const mongoose = require("mongoose");

const PuntajeSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  unidad: { type: String, required: true },
  puntaje: { type: Number, required: true },
  tiempo: { type: Number, required: true },
  nivel: { type: String, required: true },
  juego: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Puntaje", PuntajeSchema);
