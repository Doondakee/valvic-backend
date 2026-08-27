const { supabaseInventario } = require('../config/supabase');

// ==========================================
// GET: Obtener todas las categorías (solo nombres)
// ==========================================
const obtenerCategorias = async (req, res) => {
  try {
    const { data, error } = await supabaseInventario
      .from('categorias')
      .select('id_categoria, categoria, fecha_creacion')
      .order('categoria', { ascending: true });
    
    if (error) throw error;
    
    const categorias = data.map(c => c.categoria);
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// GET: Obtener categorías con ID (para edición)
// ==========================================
const obtenerCategoriasCompleto = async (req, res) => {
  try {
    const { data, error } = await supabaseInventario
      .from('categorias')
      .select('id_categoria, categoria, fecha_creacion')
      .order('categoria', { ascending: true });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error al obtener categorías completas:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// POST: Crear nueva categoría
// ==========================================
const crearCategoria = async (req, res) => {
  try {
    const { nombre } = req.body;
    
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
    }

    const nombreTrimmed = nombre.trim();

    const { data: existente, error: checkError } = await supabaseInventario
      .from('categorias')
      .select('id_categoria')
      .ilike('categoria', nombreTrimmed);

    if (checkError) throw checkError;

    if (existente && existente.length > 0) {
      return res.status(400).json({ error: 'La categoría ya existe' });
    }

    const { data, error } = await supabaseInventario
      .from('categorias')
      .insert({ categoria: nombreTrimmed })
      .select('id_categoria, categoria, fecha_creacion')
      .single();

    if (error) throw error;

    res.status(201).json({ 
      success: true, 
      message: `Categoría "${nombreTrimmed}" creada exitosamente`,
      categoria: data
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.details || 'Error interno del servidor'
    });
  }
};

// ==========================================
// PUT: Editar categoría
// ==========================================
const editarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoria } = req.body;
    
    if (!categoria || !categoria.trim()) {
      return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
    }

    const nombreTrimmed = categoria.trim();

    const { data: existente, error: checkError } = await supabaseInventario
      .from('categorias')
      .select('id_categoria, categoria')
      .eq('id_categoria', id)
      .single();

    if (checkError || !existente) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const { data: duplicado, error: dupError } = await supabaseInventario
      .from('categorias')
      .select('id_categoria')
      .ilike('categoria', nombreTrimmed)
      .neq('id_categoria', id);

    if (dupError) throw dupError;

    if (duplicado && duplicado.length > 0) {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }

    const { data, error } = await supabaseInventario
      .from('categorias')
      .update({ 
        categoria: nombreTrimmed,
        fecha_creacion: new Date()
      })
      .eq('id_categoria', id)
      .select()
      .single();

    if (error) throw error;

    const { error: updateError } = await supabaseInventario
      .from('productos')
      .update({ categoria: nombreTrimmed })
      .eq('categoria', existente.categoria);

    if (updateError) {
      console.error('Error al actualizar productos:', updateError);
    }

    res.json({ 
      success: true, 
      message: `Categoría actualizada exitosamente`,
      categoria: data
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// DELETE: Eliminar categoría
// ==========================================
const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: categoria, error: findError } = await supabaseInventario
      .from('categorias')
      .select('categoria')
      .eq('id_categoria', id)
      .single();

    if (findError || !categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const { data: productos, error: checkError } = await supabaseInventario
      .from('productos')
      .select('id')
      .eq('categoria', categoria.categoria)
      .limit(1);

    if (checkError) throw checkError;

    if (productos && productos.length > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar la categoría "${categoria.categoria}" porque tiene productos asociados`,
        tieneProductos: true
      });
    }

    const { error } = await supabaseInventario
      .from('categorias')
      .delete()
      .eq('id_categoria', id);

    if (error) throw error;

    res.json({ 
      success: true, 
      message: `Categoría "${categoria.categoria}" eliminada exitosamente` 
    });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  obtenerCategorias,
  obtenerCategoriasCompleto,
  crearCategoria,
  editarCategoria,
  eliminarCategoria
};