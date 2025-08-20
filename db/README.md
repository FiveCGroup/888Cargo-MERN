# Base de Datos - 888Cargo MERN

Esta carpeta contiene todos los archivos relacionados con la base de datos del proyecto.

## Estructura

- `packing_list.db` - Base de datos SQLite principal del sistema
- Este archivo contiene todas las tablas del sistema de packing lists y códigos QR

## Tablas Principales

- **cliente** - Información de clientes
- **carga** - Información de cargas/envíos
- **articulo_packing_list** - Artículos en cada carga
- **caja** - Cajas para cada artículo
- **qr** - Códigos QR generados para cada caja

## Configuración

La configuración de la base de datos se encuentra en `backend/db.js` y apunta a esta carpeta para mantener la separación de responsabilidades.

## Respaldos

Se recomienda hacer respaldos regulares de `packing_list.db` antes de realizar cambios importantes.
