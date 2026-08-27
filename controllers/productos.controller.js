const { supabaseInventario } = require('../config/supabase');

// ==========================================
// GET: Obtener todos los productos
// ==========================================
const obtenerProductos = async (req, res) => {
  try {
    let allProducts = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await supabaseInventario
        .from('productos')
        .select('*')
        .order('categoria', { ascending: true })
        .order('producto', { ascending: true })
        .range(from, to);
      
      if (error) {
        console.error(`❌ Error en página ${page}:`, error);
        throw error;
      }
      
      if (data.length === 0) {
        hasMore = false;
      } else {
        allProducts = allProducts.concat(data);
        page++;
        
        if (data.length < pageSize) {
          hasMore = false;
        }
      }
    }
    
    res.json(allProducts);
  } catch (error) {
    console.error('❌ Error en GET /api/productos:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// GET: Obtener un producto por ID
// ==========================================
const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseInventario
      .from('productos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Producto no encontrado' });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// PUT: Actualizar múltiples productos en lote (BATCH)
// ==========================================
const actualizarProductosBatch = async (req, res) => {
  try {
    const { productos } = req.body;
    
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de productos' });
    }

    console.log(`📦 Actualizando ${productos.length} productos en lote...`);
    
    const TAMANO_LOTE = 20;
    const resultados = [];
    
    for (let i = 0; i < productos.length; i += TAMANO_LOTE) {
      const lote = productos.slice(i, i + TAMANO_LOTE);
      
      const resultadosLote = await Promise.all(
        lote.map(async ({ id, ...datos }) => {
          try {
            const { data, error } = await supabaseInventario
              .from('productos')
              .update({
                ...datos,
                fecha_actualizacion: new Date()
              })
              .eq('id', id)
              .select()
              .single();
            
            if (error) {
              console.error(`❌ Error actualizando producto ${id}:`, error.message);
              return { id, success: false, error: error.message };
            }
            return { id, success: true, data };
          } catch (err) {
            return { id, success: false, error: err.message };
          }
        })
      );
      
      resultados.push(...resultadosLote);
    }

    const exitos = resultados.filter(r => r.success);
    const errores = resultados.filter(r => !r.success);

    console.log(`✅ ${exitos.length} actualizados, ${errores.length} errores`);

    if (errores.length > 0) {
      console.warn('⚠️ Errores en batch update:', errores.map(e => `${e.id}: ${e.error}`).join(', '));
    }

    res.json({
      success: true,
      message: `${exitos.length} productos actualizados${errores.length > 0 ? `, ${errores.length} con errores` : ''}`,
      exitos: exitos.length,
      errores: errores.length > 0 ? errores : undefined
    });

  } catch (error) {
    console.error('❌ Error en batch update:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// POST: Crear nuevo producto
// ==========================================
const crearProducto = async (req, res) => {
  try {
    const { 
      categoria, 
      producto, 
      contenido, 
      precio, 
      stock, 
      codigo,
      vehiculo,
      detalle,
      precio_contado,
      precio_colocado
    } = req.body;
    
    const { data: categoriaData, error: catError } = await supabaseInventario
      .from('categorias')
      .select('id_categoria')
      .eq('categoria', categoria)
      .single();

    if (catError || !categoriaData) {
      return res.status(400).json({ 
        error: `La categoría "${categoria}" no existe en la tabla categorias` 
      });
    }

    const { data, error } = await supabaseInventario
      .from('productos')
      .insert({
        id_categoria: categoriaData.id_categoria,
        categoria: categoria,
        producto,
        contenido: contenido || '',
        precio: precio || 0,
        stock: stock || 0,
        codigo: codigo || '',
        vehiculo: vehiculo || '',
        detalle: detalle || '',
        precio_contado: precio_contado || 0,
        precio_colocado: precio_colocado || 0,
        fecha_actualizacion: new Date()
      })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// PUT: Actualizar producto individual
// ==========================================
const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      categoria, 
      producto, 
      contenido, 
      precio, 
      stock, 
      codigo,
      vehiculo,
      detalle,
      precio_contado,
      precio_colocado
    } = req.body;
    
    let idCategoria = null;
    if (categoria) {
      const { data: categoriaData, error: catError } = await supabaseInventario
        .from('categorias')
        .select('id_categoria')
        .eq('categoria', categoria)
        .single();

      if (catError || !categoriaData) {
        return res.status(400).json({ 
          error: `La categoría "${categoria}" no existe` 
        });
      }
      idCategoria = categoriaData.id_categoria;
    }

    const datosActualizar = {
      producto,
      contenido: contenido || '',
      precio: precio || 0,
      stock: stock || 0,
      codigo: codigo || '',
      vehiculo: vehiculo || '',
      detalle: detalle || '',
      precio_contado: precio_contado || 0,
      precio_colocado: precio_colocado || 0,
      fecha_actualizacion: new Date()
    };

    if (idCategoria) {
      datosActualizar.id_categoria = idCategoria;
      datosActualizar.categoria = categoria;
    }

    const { data, error } = await supabaseInventario
      .from('productos')
      .update(datosActualizar)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// PATCH: Actualizar stock (vender)
// ==========================================
const actualizarStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;
    
    const { data: producto, error: fetchError } = await supabaseInventario
      .from('productos')
      .select('stock')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    const nuevoStock = parseFloat(producto.stock) + parseFloat(cantidad);
    
    if (nuevoStock < 0) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }
    
    const { data, error } = await supabaseInventario
      .from('productos')
      .update({ 
        stock: nuevoStock,
        fecha_actualizacion: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// DELETE: Eliminar producto
// ==========================================
const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseInventario
      .from('productos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProductosBatch,
  crearProducto,
  actualizarProducto,
  actualizarStock,
  eliminarProducto
};