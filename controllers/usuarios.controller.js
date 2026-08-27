const { supabaseInventario } = require('../config/supabase');

// ==========================================
// GET: Obtener todos los usuarios
// ==========================================
const obtenerUsuarios = async (req, res) => {
  try {
    const { data, error } = await supabaseInventario
      .from('usuarios')
      .select('id, nombre_usuario, rol, activo, nombre, apellido, email, fecha_creacion')
      .order('id');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// GET: Obtener solo usuarios pendientes (activo = false)
// ==========================================
const obtenerUsuariosPendientes = async (req, res) => {
  try {
    const { data, error } = await supabaseInventario
      .from('usuarios')
      .select('id, nombre_usuario, rol, activo, fecha_creacion')
      .eq('activo', false)
      .order('fecha_creacion', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// POST: Login de usuario
// ==========================================
const loginUsuario = async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;
    
    const { data, error } = await supabaseInventario
      .from('usuarios')
      .select('id, nombre_usuario, rol, activo')
      .eq('nombre_usuario', usuario)
      .eq('contrasena', contrasena)
      .single();
    
    if (error || !data) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    if (!data.activo) {
      return res.status(401).json({ 
        error: 'Tu cuenta está pendiente de aprobación. Espera a que un administrador la active.' 
      });
    }
    
    res.json({
      success: true,
      usuario: {
        id: data.id,
        nombre: data.nombre_usuario,
        rol: data.rol
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// POST: Crear nuevo usuario (activo = false)
// ==========================================
const crearUsuario = async (req, res) => {
  try {
    const { nombre_usuario, contrasena, rol, nombre, apellido, email } = req.body;
    
    if (!nombre_usuario || !contrasena) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
    }
    
    if (email && !email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    
    const { data: existente, error: checkError } = await supabaseInventario
      .from('usuarios')
      .select('id')
      .eq('nombre_usuario', nombre_usuario)
      .single();
    
    if (existente) {
      return res.status(400).json({ error: 'Este nombre de usuario ya está registrado' });
    }
    
    if (email) {
      const { data: emailExistente } = await supabaseInventario
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .single();
      
      if (emailExistente) {
        return res.status(400).json({ error: 'Este email ya está registrado' });
      }
    }
    
    const { data, error } = await supabaseInventario
      .from('usuarios')
      .insert({
        nombre_usuario,
        contrasena,
        rol: rol || 'empleado',
        nombre: nombre || '',
        apellido: apellido || '',
        email: email || '',
        activo: false
      })
      .select('id, nombre_usuario, rol, activo, nombre, apellido, email, fecha_creacion')
      .single();
    
    if (error) throw error;
    
    res.status(201).json({
      success: true,
      message: 'Usuario registrado. Espera la aprobación de un administrador.',
      usuario: data
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// PUT: Actualizar usuario
// ==========================================
const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseInventario
      .from('usuarios')
      .update(req.body)
      .eq('id', id)
      .select('id, nombre_usuario, rol, activo, nombre, apellido, email, fecha_creacion')
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// DELETE: Eliminar usuario
// ==========================================
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseInventario
      .from('usuarios')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  obtenerUsuarios,
  obtenerUsuariosPendientes,
  loginUsuario,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
};