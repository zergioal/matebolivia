const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const scoreRoutes = require('./routes/scores');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/scores', scoreRoutes);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Conectado a MongoDB');
  app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
})
.catch(err => console.error('❌ Error en conexión MongoDB:', err));
