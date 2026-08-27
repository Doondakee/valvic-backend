const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categorias.controller');

// GET: Obtener todas las categorías (solo nombres)
router.get('/categorias', categoriasController.obtenerCategorias);

// GET: Obtener categorías con ID (para edición)
router.get('/categorias/completo', categoriasController.obtenerCategoriasCompleto);

// POST: Crear nueva categoría
router.post('/categorias', categoriasController.crearCategoria);

// PUT: Editar categoría
router.put('/categorias/:id', categoriasController.editarCategoria);

// DELETE: Eliminar categoría
router.delete('/categorias/:id', categoriasController.eliminarCategoria);

module.exports = router;