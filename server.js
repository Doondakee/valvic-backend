const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Conectar a SUPABASE
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// |==========| CATEGORIAS |==========|
app.get('/api/categorias', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('categoria')
      .order('categoria', { ascending: true });
    
    if (error) throw error;
    
    const categorias = data.map(c => c.categoria);
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categorias', async (req, res) => {
  try {
    const { nombre } = req.body;
    
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
    }

    const nombreTrimmed = nombre.trim();

    // Verificar si la categoría ya existe
    const { data: existente, error: checkError } = await supabase
      .from('categorias')
      .select('id_categoria')
      .ilike('categoria', nombreTrimmed);

    if (checkError) throw checkError;

    if (existente && existente.length > 0) {
      return res.status(400).json({ error: 'La categoría ya existe' });
    }

    // Insertar nueva categoría
    const { data, error } = await supabase
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
});


// Eliminar categoría
app.delete('/api/categorias/:nombre', async (req, res) => {
  try {
    const { nombre } = req.params;
    
    // Verificar si hay productos usando esta categoría
    const { data: productos, error: checkError } = await supabase
      .from('productos')
      .select('id')
      .eq('categoria', nombre)
      .limit(1);

    if (checkError) throw checkError;

    if (productos && productos.length > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar la categoría "${nombre}" porque tiene productos asociados` 
      });
    }

    // Eliminar la categoría
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('categoria', nombre);

    if (error) throw error;

    res.json({ 
      success: true, 
      message: `Categoría "${nombre}" eliminada exitosamente` 
    });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ error: error.message });
  }
});


// |==========| PRODUCTOS |==========|

// Obtener todos los productos
app.get('/api/productos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('categoria', { ascending: true })
      .order('producto', { ascending: true });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un producto por ID
app.get('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
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
});


app.post('/api/productos', async (req, res) => {
  try {
    const { categoria, producto, contenido, precio, stock, codigo } = req.body;
    
    const { data: categoriaData, error: catError } = await supabase
      .from('categorias')
      .select('id_categoria')
      .eq('categoria', categoria)
      .single();

    if (catError || !categoriaData) {
      return res.status(400).json({ 
        error: `La categoría "${categoria}" no existe en la tabla categorias` 
      });
    }

    const { data, error } = await supabase
      .from('productos')
      .insert({
        id_categoria: categoriaData.id_categoria,  
        categoria: categoria,                      
        producto,
        contenido,
        precio,
        stock,
        codigo,
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
});

// Actualizar producto
app.put('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoria, producto, contenido, precio, stock, codigo } = req.body;
    
    let idCategoria = null;
    if (categoria) {
      const { data: categoriaData, error: catError } = await supabase
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
      contenido,
      precio,
      stock,
      codigo,
      fecha_actualizacion: new Date()
    };

    if (idCategoria) {
      datosActualizar.id_categoria = idCategoria;
      datosActualizar.categoria = categoria;
    }

    const { data, error } = await supabase
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
});

// Actualizar stock (vender)
app.patch('/api/productos/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;
    
    // Obtener producto actual
    const { data: producto, error: fetchError } = await supabase
      .from('productos')
      .select('stock')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    const nuevoStock = parseFloat(producto.stock) + parseFloat(cantidad);
    
    if (nuevoStock < 0) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }
    
    const { data, error } = await supabase
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
});

// Eliminar producto
app.delete('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// |==========| USUARIOS |==========|

// Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre_usuario, rol, activo, nombre, apellido, email, fecha_creacion')
      .order('id');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener solo usuarios pendientes (activo = false)
app.get('/api/usuarios/pendientes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre_usuario, rol, activo, fecha_creacion')
      .eq('activo', false)
      .order('fecha_creacion', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Login de usuario
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre_usuario, rol, activo')
      .eq('nombre_usuario', usuario)
      .eq('contrasena', contrasena)
      .single();
    
    if (error || !data) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    // 👈 VERIFICAR QUE ESTÉ ACTIVO
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
});


// Crear nuevo usuario - SIEMPRE con activo = false (pendiente)
app.post('/api/usuarios', async (req, res) => {
  try {
    const { nombre_usuario, contrasena, rol, nombre, apellido, email } = req.body;
    
    // Validaciones
    if (!nombre_usuario || !contrasena) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
    }
    
    if (email && !email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    
    // Verificar si el usuario ya existe
    const { data: existente, error: checkError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('nombre_usuario', nombre_usuario)
      .single();
    
    if (existente) {
      return res.status(400).json({ error: 'Este nombre de usuario ya está registrado' });
    }
    
    // Verificar si el email ya existe
    if (email) {
      const { data: emailExistente } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .single();
      
      if (emailExistente) {
        return res.status(400).json({ error: 'Este email ya está registrado' });
      }
    }
    
    // Crear usuario con activo = false (pendiente de aprobación)
    const { data, error } = await supabase
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
});

// Actualizar usuario - Para activar/desactivar
app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('usuarios')
      .update(req.body)  // Puede incluir activo, rol, etc.
      .eq('id', id)
      .select('id, nombre_usuario, rol, activo')
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar usuario
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// |==========| DIAGNOSTICOS |==========|

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando', timestamp: new Date() });
});

app.get('/api/diagnostico', async (req, res) => {
  try {
    const { count: productos, error: prodError } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true });
    
    const { count: usuarios, error: userError } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true });
    
    res.json({ 
      success: true,
      supabase_conectada: true,
      estadisticas: {
        total_productos: prodError ? 0 : productos,
        total_usuarios: userError ? 0 : usuarios
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en:`);
  console.log(`   → Local:   http://localhost:${PORT}`);
  console.log(`   → Red:     http://${getLocalIp()}:${PORT}`);
});

// Función para obtener la IP local
function getLocalIp() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}