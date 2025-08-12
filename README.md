# 888Cargo MERN Application

Una aplicación completa MERN (MongoDB/SQLite + Express + React + Node.js) para la gestión de packing lists con procesamiento avanzado de archivos Excel e imágenes.

## 🚀 Características Principales

### ✅ Funcionalidades Implementadas
- **Sistema de Autenticación**: Login/Register con JWT
- **Procesamiento de Excel**: Extracción de datos e imágenes con ExcelJS y XLSX
- **Gestión de Imágenes**: Extracción automática y guardado en sistema de archivos
- **Base de Datos SQLite**: Esquema completo con usuarios, clientes, cargas y artículos
- **Auto-completado**: Datos del usuario logueado se completan automáticamente
- **Gestión de Packing Lists**: Creación y administración completa
- **Frontend Moderno**: React 18 + Vite
- **Backend Robusto**: Express + Node.js

### 🛠️ Stack Tecnológico

**Frontend:**
- React 18
- Vite
- CSS3
- Axios para API calls

**Backend:**
- Node.js
- Express.js
- SQLite
- JWT para autenticación
- Bcrypt para encriptación

**Librerías Especializadas:**
- ExcelJS - Procesamiento avanzado de Excel
- XLSX - Lectura de datos de Excel
- Multer - Manejo de archivos

## 📊 Esquema de Base de Datos

### Tablas Principales:
- **users**: Usuarios del sistema
- **cliente**: Información de clientes
- **carga**: Metadata de cargas
- **articulo_packing_list**: Artículos con imágenes
- **caja**: Información de cajas y dimensiones

## 🔧 Instalación y Configuración

### Prerrequisitos
- Node.js (v16 o superior)
- npm o yarn

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone git@github.com:FiveCGroup/888Cargo-MERN.git
   cd 888Cargo-MERN
   ```

2. **Instalar dependencias del backend**
   ```bash
   npm install
   ```

3. **Instalar dependencias del frontend**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Configurar variables de entorno**
   Crear archivo `.env` en la raíz del proyecto:
   ```env
   PORT=4000
   JWT_SECRET=tu_jwt_secret_aqui
   DB_PATH=./database.sqlite
   ```

5. **Ejecutar en modo desarrollo**
   
   **Backend:**
   ```bash
   npm start
   ```
   
   **Frontend (en otra terminal):**
   ```bash
   cd client
   npm run dev
   ```

## 📁 Estructura del Proyecto

```
888Cargo-MERN/
├── backend/
│   ├── controllers/     # Controladores de rutas
│   ├── models/         # Modelos de base de datos
│   ├── routes/         # Definición de rutas
│   ├── middlewares/    # Middlewares personalizados
│   ├── libs/           # Utilidades (JWT, etc.)
│   └── index.js        # Punto de entrada del servidor
├── client/
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   ├── pages/      # Páginas de la aplicación
│   │   └── services/   # Servicios para API calls
│   └── package.json
├── uploads/
│   └── images/         # Imágenes extraídas de Excel
└── package.json
```

## 🔄 Flujo de Procesamiento de Excel

1. **Carga de Archivo**: Usuario sube archivo Excel
2. **Extracción de Datos**: XLSX procesa las filas de datos
3. **Extracción de Imágenes**: ExcelJS extrae imágenes embebidas
4. **Guardado de Imágenes**: Las imágenes se guardan en `/uploads/images/`
5. **Procesamiento de Datos**: Se validan y procesan los datos
6. **Guardado en BD**: Se almacena en SQLite con URLs de imágenes
7. **Visualización**: Frontend muestra datos e imágenes

## 🖼️ Gestión de Imágenes

- Las imágenes se extraen automáticamente de archivos Excel
- Se guardan físicamente en `/uploads/images/`
- Se generan URLs de acceso público
- Compatible con formatos PNG y JPEG
- Manejo de errores robusto

## 🔐 Autenticación

- JWT tokens para sesiones
- Contraseñas encriptadas con bcrypt
- Auto-completado de datos de usuario
- Protección de rutas sensibles

## 🚨 Notas Importantes

- Las imágenes no se suben al repositorio por tamaño
- La base de datos SQLite se crea automáticamente
- Configurar variables de entorno antes del primer uso
- El servidor backend debe estar corriendo para el frontend

## 📝 Documentos de Migración

- `SQLITE_MIGRATION_COMPLETE.md`: Detalles de migración a SQLite
- `CAMBIOS_IMAGENES.md`: Documentación de cambios en procesamiento de imágenes

## 🤝 Contribución

1. Fork el proyecto
2. Crea una branch para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte o preguntas, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ por el equipo de FiveCGroup**
