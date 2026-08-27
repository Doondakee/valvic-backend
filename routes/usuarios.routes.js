const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');

// GET: Obtener todos los usuarios
router.get('/usuarios', usuariosController.obtenerUsuarios);

// GET: Obtener solo usuarios pendientes (activo = false)
router.get('/usuarios/pendientes', usuariosController.obtenerUsuariosPendientes);

// POST: Login de usuario
router.post('/login', usuariosController.loginUsuario);

// POST: Crear nuevo usuario (activo = false)
router.post('/usuarios', usuariosController.crearUsuario);

// PUT: Actualizar usuario
router.put('/usuarios/:id', usuariosController.actualizarUsuario);

// DELETE: Eliminar usuario
router.delete('/usuarios/:id', usuariosController.eliminarUsuario);

module.exports = router;