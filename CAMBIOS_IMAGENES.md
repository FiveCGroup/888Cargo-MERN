# Cambios Implementados para Manejo de Imágenes en Excel

## Problemas Identificados y Solucionados

### 1. **Corrección del Desplazamiento de Columnas**
- **Problema**: Las columnas desde CBM se habían corrido una posición a la derecha
- **Solución**: Actualizado el mapeo en `carga.routes.js` líneas 290-320:
  ```javascript
  cbm: Number(fila[21]) || 0,     // Era fila[20], ahora fila[21]
  cbmtt: Number(fila[22]) || 0,   // Era fila[21], ahora fila[22]
  gw: Number(fila[23]) || 0,      // Era fila[22], ahora fila[23]
  gwtt: Number(fila[24]) || 0,    // Era fila[23], ahora fila[24]
  serial: fila[25],               // Era fila[24], ahora fila[25]
  ```

### 2. **Eliminación de Columna IMAGEN**
- **Problema**: Se estaba creando una columna adicional "IMAGEN"
- **Solución**: Modificado el procesamiento para usar la columna PHTO existente
- **Cambios**:
  - Eliminado `encabezadoConImagen` en `procesarFilas()`
  - Las imágenes ahora se insertan directamente en la columna PHTO
  - Frontend actualizado para manejar solo la columna PHTO

### 3. **Mejora en Mapeo de Imágenes**
- **Problema**: Algunas imágenes no se cargaban correctamente
- **Solución**: Mejorado el algoritmo de mapeo de imágenes a filas
- **Cambios**:
  - Detección automática del índice de la columna PHTO
  - Validación de filas de datos válidas (> 0)
  - Logging detallado para debugging

### 4. **Frontend Mejorado**
- **Cambios en `CrearCarga.jsx`**:
  - Eliminada lógica para columna "IMAGEN"
  - Mejorado manejo de la columna "PHTO"
  - Detección automática de URLs (relativas vs absolutas)
  - Mejor manejo de errores de carga de imágenes
  - Logging en consola para debugging

## Flujo de Procesamiento Actualizado

1. **Extracción de Imágenes**: `extraerImagenesExcel()`
   - Lee imágenes con ExcelJS
   - Mapea posiciones de imágenes a filas relativas
   - Guarda imágenes en `/uploads/images/`
   - Retorna mapeo `{filaRelativa: urlImagen}`

2. **Procesamiento de Datos**: `procesarFilas()`
   - Detecta índice de columna PHTO
   - Inserta URLs de imágenes en columna PHTO
   - Mantiene estructura original de datos

3. **Visualización Frontend**:
   - Detecta columna PHTO automáticamente
   - Maneja URLs relativas y absolutas
   - Muestra imágenes con estilos mejorados

## Logging y Debugging

Se ha implementado logging detallado para facilitar el debugging:

- ✅ Imagen asignada exitosamente
- ⚠️ Sin imagen para fila específica
- ❌ Errores de procesamiento
- 📊 Estadísticas de procesamiento

## Archivos Modificados

1. `backend/routes/carga.routes.js`
   - Función `extraerImagenesExcel()`
   - Función `procesarFilas()`
   - Mapeo de columnas en ruta `/guardar`

2. `client/src/components/CrearCarga.jsx`
   - Lógica de renderizado de tabla
   - Manejo de columna PHTO
   - Estilos de imágenes

3. `backend/app.js`
   - Configuración de archivos estáticos

4. `backend/models/articulosPL.model.js`
   - Campo `imagen_url` agregado

## Validación

Para verificar que todo funciona correctamente:

1. Subir archivo Excel con imágenes
2. Verificar logs en consola del servidor
3. Confirmar que imágenes aparecen en columna PHTO
4. Validar que las URLs de imágenes son correctas
5. Comprobar que el mapeo de columnas es correcto
