const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const categoriasRoutes = require('./routes/categorias.routes');
const productosRoutes = require('./routes/productos.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const patentesRoutes = require('./routes/patentes.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ==========================================
// RUTAS
// ==========================================

// Rutas existentes (Inventario)
app.use('/api', categoriasRoutes);
app.use('/api', productosRoutes);
app.use('/api', usuariosRoutes);

// NUEVAS RUTAS: Patentes y Clientes (Gomería)
app.use('/api', patentesRoutes);

// ==========================================
// DIAGNÓSTICO
// ==========================================
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend funcionando', 
    timestamp: new Date(),
    version: '1.0.0'
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en:`);
  console.log(`   → Local:   http://localhost:${PORT}`);
});

module.exports = app;