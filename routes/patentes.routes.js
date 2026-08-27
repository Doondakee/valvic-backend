const express = require('express');
const router = express.Router();
const patentesController = require('../controllers/patentes.controller');

// GET: Obtener todas las patentes (solo patentes)
router.get('/patentes', patentesController.obtenerPatentes);

// GET: Obtener todos los clientes (con todos los datos)
router.get('/clientes', patentesController.obtenerClientes);

// GET: Obtener un cliente por patente (para mostrar al llegar)
router.get('/clientes/:patente', patentesController.obtenerClientePorPatente);

// POST: Crear una nueva patente (solo la patente)
router.post('/patentes', patentesController.crearPatente);

// PUT: Actualizar todos los datos de un cliente
router.put('/clientes/:patente', patentesController.actualizarCliente);

// DELETE: Eliminar una patente y su cliente asociado (CASCADE)
router.delete('/patentes/:patente', patentesController.eliminarPatente);

module.exports = router;