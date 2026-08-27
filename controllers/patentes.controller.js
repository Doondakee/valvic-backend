const { supabaseGomeria } = require('../config/supabase');

// ==========================================
// GET: Obtener todas las patentes
// ==========================================
const obtenerPatentes = async (req, res) => {
  try {
    const { data, error } = await supabaseGomeria
      .from('patentes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('❌ Error al obtener patentes:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// ==========================================
// GET: Obtener todos los clientes (con todos los datos)
// ==========================================
const obtenerClientes = async (req, res) => {
  try {
    const { data, error } = await supabaseGomeria
      .from('clientes')
      .select('*')
      .order('fecha', { ascending: false, nullsFirst: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('❌ Error al obtener clientes:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// ==========================================
// GET: Obtener un cliente por patente
// ==========================================
const obtenerClientePorPatente = async (req, res) => {
  try {
    const { patente } = req.params;

    const { data, error } = await supabaseGomeria
      .from('clientes')
      .select('*')
      .eq('patente', patente.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: `No se encontró el cliente con patente ${patente}`
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('❌ Error al obtener cliente:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// ==========================================
// POST: Crear una nueva patente
// ==========================================
const crearPatente = async (req, res) => {
  try {
    const { patente } = req.body;

    if (!patente || !patente.trim()) {
      return res.status(400).json({
        success: false,
        error: 'La patente es obligatoria'
      });
    }

    const patenteUpper = patente.toUpperCase().trim();

    const { data: existente, error: checkError } = await supabaseGomeria
      .from('patentes')
      .select('patente')
      .eq('patente', patenteUpper)
      .single();

    if (existente) {
      return res.status(400).json({
        success: false,
        error: `La patente ${patenteUpper} ya existe`
      });
    }

    const { data, error } = await supabaseGomeria
      .from('patentes')
      .insert({ patente: patenteUpper })
      .select()
      .single();

    if (error) throw error;

    const { data: cliente, error: clienteError } = await supabaseGomeria
      .from('clientes')
      .select('*')
      .eq('patente', patenteUpper)
      .single();

    if (clienteError) {
      console.warn('⚠️ Trigger no creó el cliente automáticamente:', clienteError);
    }

    res.status(201).json({
      success: true,
      message: `Patente ${patenteUpper} creada exitosamente`,
      data: {
        patente: data,
        cliente: cliente || null
      }
    });
  } catch (error) {
    console.error('❌ Error al crear patente:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// ==========================================
// PUT: Actualizar todos los datos de un cliente
// ==========================================
const actualizarCliente = async (req, res) => {
  try {
    const { patente } = req.params;

    const { data: existe, error: checkError } = await supabaseGomeria
      .from('clientes')
      .select('patente')
      .eq('patente', patente.toUpperCase())
      .single();

    if (checkError || !existe) {
      return res.status(404).json({
        success: false,
        error: `No se encontró el cliente con patente ${patente}`
      });
    }

    const {
      modelo_auto,
      fecha,
      kilometraje,
      atendidox,
      total_litros_aceite,
      proxima_visita_km,
      aceite,
      precio_aceite,
      check_aceite,
      filtro_aceite,
      precio_filtro_aceite,
      check_filtro_aceite,
      filtro_aire,
      precio_filtro_aire,
      check_filtro_aire,
      filtro_nafta,
      precio_filtro_nafta,
      check_filtro_nafta,
      ultimo_cambio_filtro_nafta,
      filtro_gasoil,
      precio_filtro_gasoil,
      check_filtro_gasoil,
      ultimo_cambio_filtro_gasoil,
      filtro_habitaculo,
      precio_filtro_habitaculo,
      check_filtro_habitaculo,
      fecha_cambio_filtro_habitaculo,
      diferencial,
      precio_diferencial,
      check_diferencial,
      caja,
      precio_caja,
      check_caja,
      total,
      otros1,
      otros1_precio,
      otros1_check,
      otros2,
      otros2_precio,
      otros2_check,
      otros3,
      otros3_precio,
      otros3_check,
      observaciones
    } = req.body;

    const datosActualizar = {};
    
    // Datos del vehículo
    if (modelo_auto !== undefined) datosActualizar.modelo_auto = modelo_auto || null;
    if (fecha !== undefined) datosActualizar.fecha = fecha || null;
    if (kilometraje !== undefined) datosActualizar.kilometraje = kilometraje || null;
    if (atendidox !== undefined) datosActualizar.atendidox = atendidox || null;
    if (total_litros_aceite !== undefined) datosActualizar.total_litros_aceite = total_litros_aceite || null;
    if (proxima_visita_km !== undefined) datosActualizar.proxima_visita_km = proxima_visita_km || null;
    
    // Aceite
    if (aceite !== undefined) datosActualizar.aceite = aceite || null;
    if (precio_aceite !== undefined) datosActualizar.precio_aceite = precio_aceite || null;
    if (check_aceite !== undefined) datosActualizar.check_aceite = check_aceite || false;
    
    // Filtro Aceite
    if (filtro_aceite !== undefined) datosActualizar.filtro_aceite = filtro_aceite || null;
    if (precio_filtro_aceite !== undefined) datosActualizar.precio_filtro_aceite = precio_filtro_aceite || null;
    if (check_filtro_aceite !== undefined) datosActualizar.check_filtro_aceite = check_filtro_aceite || false;
    
    // Filtro Aire
    if (filtro_aire !== undefined) datosActualizar.filtro_aire = filtro_aire || null;
    if (precio_filtro_aire !== undefined) datosActualizar.precio_filtro_aire = precio_filtro_aire || null;
    if (check_filtro_aire !== undefined) datosActualizar.check_filtro_aire = check_filtro_aire || false;
    
    // Filtro Nafta
    if (filtro_nafta !== undefined) datosActualizar.filtro_nafta = filtro_nafta || null;
    if (precio_filtro_nafta !== undefined) datosActualizar.precio_filtro_nafta = precio_filtro_nafta || null;
    if (check_filtro_nafta !== undefined) datosActualizar.check_filtro_nafta = check_filtro_nafta || false;
    if (ultimo_cambio_filtro_nafta !== undefined) datosActualizar.ultimo_cambio_filtro_nafta = ultimo_cambio_filtro_nafta || null;
    
    // Filtro Gasoil
    if (filtro_gasoil !== undefined) datosActualizar.filtro_gasoil = filtro_gasoil || null;
    if (precio_filtro_gasoil !== undefined) datosActualizar.precio_filtro_gasoil = precio_filtro_gasoil || null;
    if (check_filtro_gasoil !== undefined) datosActualizar.check_filtro_gasoil = check_filtro_gasoil || false;
    if (ultimo_cambio_filtro_gasoil !== undefined) datosActualizar.ultimo_cambio_filtro_gasoil = ultimo_cambio_filtro_gasoil || null;
    
    // Filtro Habitáculo
    if (filtro_habitaculo !== undefined) datosActualizar.filtro_habitaculo = filtro_habitaculo || null;
    if (precio_filtro_habitaculo !== undefined) datosActualizar.precio_filtro_habitaculo = precio_filtro_habitaculo || null;
    if (check_filtro_habitaculo !== undefined) datosActualizar.check_filtro_habitaculo = check_filtro_habitaculo || false;
    if (fecha_cambio_filtro_habitaculo !== undefined) datosActualizar.fecha_cambio_filtro_habitaculo = fecha_cambio_filtro_habitaculo || null;
    
    // Diferencial
    if (diferencial !== undefined) datosActualizar.diferencial = diferencial || null;
    if (precio_diferencial !== undefined) datosActualizar.precio_diferencial = precio_diferencial || null;
    if (check_diferencial !== undefined) datosActualizar.check_diferencial = check_diferencial || false;
    
    // Caja
    if (caja !== undefined) datosActualizar.caja = caja || null;
    if (precio_caja !== undefined) datosActualizar.precio_caja = precio_caja || null;
    if (check_caja !== undefined) datosActualizar.check_caja = check_caja || false;
    
    // Totales
    if (total !== undefined) datosActualizar.total = total || null;
    
    // OTROS - con precio y check
    if (otros1 !== undefined) datosActualizar.otros1 = otros1 || null;
    if (otros1_precio !== undefined) datosActualizar.otros1_precio = otros1_precio || null;
    if (otros1_check !== undefined) datosActualizar.otros1_check = otros1_check || false;
    
    if (otros2 !== undefined) datosActualizar.otros2 = otros2 || null;
    if (otros2_precio !== undefined) datosActualizar.otros2_precio = otros2_precio || null;
    if (otros2_check !== undefined) datosActualizar.otros2_check = otros2_check || false;
    
    if (otros3 !== undefined) datosActualizar.otros3 = otros3 || null;
    if (otros3_precio !== undefined) datosActualizar.otros3_precio = otros3_precio || null;
    if (otros3_check !== undefined) datosActualizar.otros3_check = otros3_check || false;
    
    // Observaciones
    if (observaciones !== undefined) datosActualizar.observaciones = observaciones || null;

    datosActualizar.updated_at = new Date().toISOString();

    const { data, error } = await supabaseGomeria
      .from('clientes')
      .update(datosActualizar)
      .eq('patente', patente.toUpperCase())
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Cliente ${patente.toUpperCase()} actualizado exitosamente`,
      data: data
    });
  } catch (error) {
    console.error('❌ Error al actualizar cliente:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// ==========================================
// DELETE: Eliminar una patente y su cliente (CASCADE)
// ==========================================
const eliminarPatente = async (req, res) => {
  try {
    const { patente } = req.params;

    const { data: existe, error: checkError } = await supabaseGomeria
      .from('patentes')
      .select('patente')
      .eq('patente', patente.toUpperCase())
      .single();

    if (checkError || !existe) {
      return res.status(404).json({
        success: false,
        error: `No se encontró la patente ${patente}`
      });
    }

    const { error } = await supabaseGomeria
      .from('patentes')
      .delete()
      .eq('patente', patente.toUpperCase());

    if (error) throw error;

    res.json({
      success: true,
      message: `Patente ${patente.toUpperCase()} y su cliente asociado eliminados exitosamente`
    });
  } catch (error) {
    console.error('❌ Error al eliminar patente:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

module.exports = {
  obtenerPatentes,
  obtenerClientes,
  obtenerClientePorPatente,
  crearPatente,
  actualizarCliente,
  eliminarPatente
};