# 🚀 Guía de Desarrollo - 888 Cargo MERN

## 📋 Comandos de Desarrollo

### Comando Principal (Recomendado)
```bash
npm run dev
```
**✅ Este comando ejecuta simultáneamente:**
- 🔧 Backend (nodemon) en puerto 4000
- 🎨 Frontend (Vite) en puerto 5173

### Comandos Individuales
```bash
# Solo backend
npm run dev:server

# Solo frontend  
npm run dev:client
```

### Comandos de Instalación
```bash
# Instalar todas las dependencias (raíz + cliente)
npm run install:all

# Solo dependencias raíz
npm install

# Solo dependencias cliente
cd client && npm install
```

### Comandos de Producción
```bash
# Construir para producción
npm run build

# Iniciar servidor en producción
npm start
```

## 🌐 URLs de Desarrollo

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:4000
- **API Base**: http://localhost:4000/api

## 🔧 Configuración de Puertos

### Backend (Puerto 4000)
Configurado en `.env`:
```
PORT=4000
```

### Frontend (Puerto 5173)
- **Desarrollo**: Vite server en puerto 5173
- **Proxy**: Las peticiones `/api/*` se redirigen automáticamente al backend

## 📁 Estructura del Proyecto

```
888Cris-MERN/
├── backend/                 # Servidor Express + SQLite
│   ├── controllers/         # Controladores de rutas
│   ├── models/             # Modelos de base de datos
│   ├── routes/             # Definición de rutas API
│   ├── middlewares/        # Middlewares personalizados
│   └── index.js            # Punto de entrada del servidor
├── client/                 # Frontend React + Vite
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas principales
│   │   ├── services/       # Servicios API
│   │   ├── hooks/          # Custom hooks
│   │   └── logic/          # Lógica de negocio
│   └── vite.config.js      # Configuración Vite + Proxy
├── database/               # Base de datos SQLite
├── uploads/                # Archivos subidos
│   ├── images/             # Imágenes de artículos
│   └── qr-codes/           # Códigos QR generados
├── .env                    # Variables de entorno
└── package.json            # Scripts y dependencias raíz
```

## 🛠️ Funcionalidades Principales

### ✅ Sistema de Autenticación
- Login/Registro con JWT
- Protección de rutas
- Recuperación de contraseña por WhatsApp

### ✅ Gestión de Packing Lists
- Subida y procesamiento de archivos Excel
- Formulario modal profesional
- Búsqueda de cargas existentes
- Generación de códigos QR
- Descarga de PDFs

### ✅ Interfaz Profesional
- Botones estilizados sin Bootstrap
- Animaciones de carga
- Estados de campos dinámicos
- Responsive design

## 🐛 Debugging

### Logs del Servidor
Los logs aparecen con prefijo `[0]` en la consola cuando usas `npm run dev`

### Logs del Cliente  
Los logs aparecen con prefijo `[1]` en la consola cuando usas `npm run dev`

### Reiniciar Servicios
```bash
# En la consola donde corre npm run dev, presiona:
rs  # Para reiniciar solo el backend (nodemon)
# El frontend se reinicia automáticamente con HMR
```

## 📝 Notas Importantes

1. **Concurrently**: Utiliza `concurrently` para ejecutar múltiples procesos
2. **Nodemon**: Auto-reinicia el backend cuando detecta cambios
3. **Vite HMR**: Hot Module Replacement para desarrollo rápido del frontend
4. **Proxy**: Las peticiones API se manejan automáticamente entre puertos
5. **SQLite**: Base de datos local para desarrollo

## 🚀 Inicio Rápido

```bash
# 1. Clonar el proyecto
git clone [URL_DEL_REPO]

# 2. Entrar al directorio
cd 888Cris-MERN

# 3. Instalar todas las dependencias
npm run install:all

# 4. Iniciar desarrollo
npm run dev

# 5. Abrir navegador en http://localhost:5173
```

¡Listo para desarrollar! 🎉
