const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');

// GET: Obtener todos los productos
router.get('/productos', productosController.obtenerProductos);

// GET: Obtener un producto por ID
router.get('/productos/:id', productosController.obtenerProductoPorId);

// PUT: Actualizar múltiples productos en lote (BATCH)
router.put('/productos/batch', productosController.actualizarProductosBatch);

// POST: Crear nuevo producto
router.post('/productos', productosController.crearProducto);

// PUT: Actualizar producto individual
router.put('/productos/:id', productosController.actualizarProducto);

// PATCH: Actualizar stock (vender)
router.patch('/productos/:id/stock', productosController.actualizarStock);

// DELETE: Eliminar producto
router.delete('/productos/:id', productosController.eliminarProducto);

module.exports = router;