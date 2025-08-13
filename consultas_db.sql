-- Consultas útiles para la base de datos SQLite
-- Para ejecutar: sqlite3 database\app.db < consultas_db.sql

-- Ver todas las tablas
.tables

-- Ver estructura de tablas
.schema

-- ==================== CONSULTAS BÁSICAS ====================

-- Ver todas las cargas
SELECT * FROM carga;

-- Ver todos los artículos de una carga específica
SELECT * FROM articulo_packing_list WHERE id_carga = 1;

-- Contar artículos por carga
SELECT 
  c.codigo_carga,
  c.ciudad_destino,
  COUNT(a.id_articulo) as total_articulos,
  SUM(a.precio_total) as valor_total,
  SUM(a.cbm) as cbm_total,
  SUM(a.gw) as peso_total
FROM carga c
LEFT JOIN articulo_packing_list a ON c.id_carga = a.id_carga
GROUP BY c.id_carga;

-- Ver artículos con imágenes
SELECT 
  id_articulo, 
  ref_art, 
  descripcion_espanol, 
  imagen_url,
  imagen_nombre
FROM articulo_packing_list 
WHERE imagen_url IS NOT NULL 
LIMIT 10;

-- ==================== CONSULTAS AVANZADAS ====================

-- Artículos más caros
SELECT 
  ref_art, 
  descripcion_espanol, 
  precio_unidad, 
  precio_total,
  cbm,
  gw
FROM articulo_packing_list 
ORDER BY precio_total DESC 
LIMIT 10;

-- Buscar artículos por descripción
SELECT * FROM articulo_packing_list 
WHERE descripcion_espanol LIKE '%producto%' 
OR descripcion_chino LIKE '%producto%';

-- Estadísticas generales
SELECT 
  COUNT(*) as total_articulos,
  AVG(precio_unidad) as precio_promedio,
  SUM(precio_total) as valor_total_inventario,
  SUM(cbm) as volumen_total,
  SUM(gw) as peso_total
FROM articulo_packing_list;
