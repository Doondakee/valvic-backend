const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Cliente para la base de datos de inventario (existente)
const supabaseInventario = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Cliente para la base de datos de gomería (nueva)
const supabaseGomeria = createClient(
  process.env.SUPABASE_URL_PATENTE,
  process.env.SUPABASE_KEY_PATENTE
);

module.exports = {
  supabaseInventario,
  supabaseGomeria
};