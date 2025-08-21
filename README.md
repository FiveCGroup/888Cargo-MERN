# 888Cargo MERN - Sistema de Gestión de Listas de Empaque

## 📋 Descripción

Sistema completo MERN (MongoDB/SQLite, Express.js, React.js, Node.js) para la gestión de listas de empaque con generación automática de códigos QR, autenticación de usuarios, y gestión segura de archivos.

## ✨ Características principales

### 🔐 Sistema de Autenticación
- Registro y login de usuarios
- Autenticación JWT con refresh tokens
- Validación y sanitización de datos
- Control de acceso basado en roles

### 📦 Gestión de Listas de Empaque
- CRUD completo de listas de empaque
- Generación automática de códigos QR
- Gestión de archivos con validación avanzada
- Audit trail completo

### �️ Seguridad Avanzada
- Validación de tipos de archivos por magic numbers
- Sanitización automática de datos de entrada
- Protección contra inyección SQL y XSS
- Rate limiting configurable
- Headers de seguridad

### � Documentación Completa
- API documentada con Swagger/OpenAPI 3.0
- Guías de desarrollo detalladas
- Documentación de arquitectura
- Ejemplos de uso y testing

## � Instalación y configuración

### Requisitos previos
- Node.js 18.x o superior
- npm 9.x o superior
- Git

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/FiveCGroup/888Cargo-MERN.git
cd 888Cargo-MERN

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../client
npm install

# Volver al directorio raíz
cd ..
```

### Configuración
Crear un archivo `.env` en el directorio backend:

```env
# Desarrollo
NODE_ENV=development
PORT=4000
HOST=127.0.0.1

# Base de datos
DB_TYPE=sqlite
DB_PATH=./db/packing_list.db

# JWT
JWT_SECRET=tu_secreto_jwt_muy_seguro

# Uploads
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Features
ENABLE_QR_GENERATION=true
ENABLE_PDF_GENERATION=true
ENABLE_WHATSAPP_RECOVERY=true
ENABLE_AUDIT_LOG=true
```

### Ejecutar en desarrollo
```bash
# Ejecutar backend y frontend simultáneamente
npm run dev

# O ejecutar por separado:
# Backend
npm run dev:server

# Frontend
npm run dev:client
```

## 📖 Documentación

### API Documentation
- **Swagger UI**: [http://localhost:4000/api-docs](http://localhost:4000/api-docs)
- **OpenAPI Spec**: [http://localhost:4000/api-docs.json](http://localhost:4000/api-docs.json)

### Guías completas
- [📘 Guía de Desarrollo](./docs/DEVELOPMENT_GUIDE.md)
- [🏗️ Documentación de Arquitectura](./docs/ARCHITECTURE.md)
- [🗄️ Configuración de Base de Datos](./LOCAL_POSTGRES_SETUP.md)
- [☁️ Configuración de Supabase](./SUPABASE_SETUP.md)

## 🏗️ Arquitectura del sistema

### Backend (Node.js/Express)
```
├── config/              # Configuraciones del sistema
│   ├── config.js        # Configuración multi-entorno
│   └── swagger.config.js # Configuración de documentación API
├── controllers/         # Controladores HTTP
├── middlewares/         # Middlewares personalizados
│   ├── validateToken.js # Validación de JWT
│   ├── fileValidation.middleware.js # Validación de archivos
│   └── dataSanitization.middleware.js # Sanitización de datos
├── models/             # Modelos de datos
├── repositories/       # Patrón Repository para acceso a datos
├── routes/             # Definición de rutas de API
├── services/           # Lógica de negocio
└── utils/              # Utilidades y helpers
```

### Frontend (React.js)
```
src/
├── components/         # Componentes reutilizables
├── pages/             # Páginas principales
├── services/          # Servicios para comunicación con API
├── hooks/             # Custom hooks
└── utils/             # Utilidades del frontend
```

## 🔧 Tecnologías utilizadas

### Backend
- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web
- **SQLite/PostgreSQL**: Base de datos
- **JWT**: Autenticación
- **Bcrypt**: Hashing de contraseñas
- **Multer**: Manejo de archivos
- **Zod**: Validación de esquemas
- **Swagger**: Documentación de API
- **File-type**: Detección de tipos de archivo
- **Validator**: Sanitización de datos

### Frontend
- **React.js**: Library de UI
- **Vite**: Build tool
- **React Router**: Enrutamiento
- **Axios**: Cliente HTTP

### Base de datos
- **SQLite**: Para desarrollo local
- **PostgreSQL**: Para producción
- **Migraciones**: Versionado de esquema

## �️ Características de seguridad

### Validación y Sanitización
- **Validación de archivos**: Verificación por magic numbers
- **Sanitización de datos**: Limpieza automática de entradas
- **Validación de esquemas**: Usando Zod para type safety
- **Protección XSS**: Sanitización de HTML
- **Prevención de inyección SQL**: Prepared statements

### Autenticación y Autorización
- **JWT Tokens**: Autenticación stateless
- **Refresh Tokens**: Renovación segura de sesiones
- **Password Hashing**: Bcrypt con salt rounds
- **Role-based Access**: Control de acceso por roles

### Headers de Seguridad
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`

## 📊 Features avanzadas

### Generación de QR
- Códigos QR únicos para cada lista de empaque
- Generación automática y almacenamiento
- Integración con listas de empaque

### Gestión de Archivos
- Validación avanzada de tipos de archivo
- Límites de tamaño configurables
- Almacenamiento seguro con nombres únicos
- Soporte para múltiples formatos

### Audit Trail
- Registro de todas las operaciones críticas
- Tracking de cambios en datos
- Información de IP y user agent
- Timestamps automáticos

### Multi-entorno
- Configuración flexible por entorno
- Variables de entorno para secretos
- Base de datos configurable (SQLite/PostgreSQL)
- Features toggleables

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 🚀 Deployment

### Preparación para producción
```bash
# Instalar dependencias de producción
npm ci --only=production

# Compilar frontend
cd client && npm run build

# Configurar variables de entorno
cp .env.example .env.production
```

### Docker
```bash
# Construir imagen
docker build -t cargo-app .

# Ejecutar contenedor
docker run -p 4000:4000 cargo-app
```

### Variables de entorno de producción
```env
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# Base de datos de producción
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cargo_prod
DB_USER=cargo_user
DB_PASS=contraseña_segura

# JWT con secreto fuerte
JWT_SECRET=secreto_muy_seguro_y_largo_para_produccion

# SSL/HTTPS
HTTPS_ENABLED=true
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/private-key.pem
```

## 📈 Endpoints de API

### Autenticación
- `POST /api/register` - Registro de usuario
- `POST /api/login` - Inicio de sesión
- `POST /api/logout` - Cerrar sesión
- `GET /api/profile` - Perfil del usuario

### Listas de Empaque
- `GET /api/packing-lists` - Obtener listas
- `POST /api/packing-lists` - Crear lista
- `PUT /api/packing-lists/:id` - Actualizar lista
- `DELETE /api/packing-lists/:id` - Eliminar lista

### QR Codes
- `GET /api/qr/:id` - Obtener QR por ID
- `POST /api/qr/generate` - Generar nuevo QR

### Utilidades
- `GET /api/health` - Estado del sistema
- `GET /api-docs` - Documentación Swagger

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Convenciones de commits
- `feat`: nueva funcionalidad
- `fix`: corrección de bugs
- `docs`: documentación
- `style`: formateo
- `refactor`: refactorización
- `test`: tests
- `chore`: mantenimiento

## 📝 Changelog

### v2.0.0 (2024-01-20)
#### ✨ Nuevas características
- Sistema de autenticación completo con JWT
- Validación avanzada de archivos por magic numbers
- Sanitización automática de datos de entrada
- Documentación completa con Swagger/OpenAPI 3.0
- Arquitectura en capas con patrón Repository
- Middlewares de seguridad avanzados

#### 🛡️ Mejoras de seguridad
- Protección contra inyección SQL y XSS
- Headers de seguridad configurados
- Rate limiting configurable
- Validación de tipos de archivo real

#### 📚 Documentación
- Guías completas de desarrollo
- Documentación de arquitectura detallada
- Ejemplos de uso y testing
- API completamente documentada

#### 🏗️ Arquitectura
- Refactorización completa siguiendo principios SOLID
- Separación de responsabilidades en capas
- Patrón Repository para acceso a datos
- Configuración multi-entorno

### v1.0.0 (2024-01-15)
- Versión inicial del sistema
- CRUD básico de listas de empaque
- Generación de códigos QR
- Base de datos SQLite

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Equipo

- **Desarrollador Principal**: FiveCGroup
- **Arquitectura**: Sistema MERN con enfoque en seguridad
- **Contacto**: [GitHub](https://github.com/FiveCGroup)

## 🔗 Enlaces útiles

- [Documentación API (Swagger)](http://localhost:4000/api-docs)
- [Guía de Desarrollo](./docs/DEVELOPMENT_GUIDE.md)
- [Arquitectura del Sistema](./docs/ARCHITECTURE.md)
- [Issues y Features](https://github.com/FiveCGroup/888Cargo-MERN/issues)

---

**¡Gracias por usar 888Cargo MERN!** 🚀
