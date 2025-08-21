# Documentación de Arquitectura - 888Cargo MERN

## Tabla de contenidos
1. [Visión general del sistema](#visión-general-del-sistema)
2. [Arquitectura de alto nivel](#arquitectura-de-alto-nivel)
3. [Componentes del sistema](#componentes-del-sistema)
4. [Patrones de diseño](#patrones-de-diseño)
5. [Base de datos](#base-de-datos)
6. [Seguridad](#seguridad)
7. [Escalabilidad](#escalabilidad)
8. [Deployment](#deployment)

## Visión general del sistema

888Cargo es un sistema MERN (MongoDB/SQLite, Express.js, React.js, Node.js) diseñado para la gestión de listas de empaque con funcionalidades de generación de códigos QR, autenticación de usuarios, y gestión de archivos.

### Características principales
- **Gestión de usuarios**: Registro, autenticación y autorización
- **Listas de empaque**: CRUD completo con validaciones
- **Códigos QR**: Generación automática para identificación
- **Gestión de archivos**: Subida segura con validación de tipos
- **API RESTful**: Interfaz bien documentada con Swagger
- **Sanitización de datos**: Protección contra inyecciones
- **Multi-entorno**: Configuración flexible para desarrollo/producción

## Arquitectura de alto nivel

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React.js)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Components  │  │   Pages     │  │  Services   │         │
│  │             │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   HTTP/HTTPS      │
                    │   JSON API        │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                   BACKEND (Node.js/Express)                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Routes    │  │Controllers  │  │ Middlewares │            │
│  │             │  │             │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Services   │  │Repositories │  │   Models    │            │
│  │             │  │             │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   SQLite/PostgreSQL│
                    │   Database         │
                    └───────────────────┘
```

## Componentes del sistema

### Frontend (React.js)

#### Estructura de capas
```
src/
├── components/          # Componentes reutilizables
│   ├── common/         # Componentes comunes (Header, Footer)
│   ├── forms/          # Componentes de formularios
│   └── ui/             # Componentes de UI (Button, Modal)
├── pages/              # Páginas principales
│   ├── auth/           # Páginas de autenticación
│   ├── dashboard/      # Dashboard principal
│   └── packing/        # Gestión de listas de empaque
├── services/           # Servicios para comunicación con API
│   ├── api.js          # Cliente HTTP base
│   ├── auth.service.js # Servicios de autenticación
│   └── packing.service.js # Servicios de listas de empaque
├── hooks/              # Custom hooks
├── utils/              # Utilidades y helpers
└── assets/             # Recursos estáticos
```

#### Responsabilidades
- **Presentación**: Interfaz de usuario reactiva
- **Validación**: Validación de formularios en cliente
- **Estado**: Gestión de estado local y global
- **Comunicación**: Interacción con API backend

### Backend (Node.js/Express)

#### Arquitectura en capas
```
Capa de Presentación (Routes + Controllers)
    ↓
Capa de Negocio (Services)
    ↓
Capa de Acceso a Datos (Repositories)
    ↓
Capa de Datos (Database)
```

#### Componentes principales

##### 1. Routes (Capa de Presentación)
```javascript
// routes/auth.routes.js
router.post('/register', 
    sanitizeRequest,           // Middleware de sanitización
    validateRegister,          // Validación de datos
    authController.register    // Controlador
);
```

**Responsabilidades**:
- Definición de endpoints
- Aplicación de middlewares
- Ruteo de peticiones

##### 2. Controllers (Capa de Presentación)
```javascript
// controllers/auth.controller.js
export const register = async (req, res) => {
    try {
        const user = await AuthService.register(req.body);
        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
```

**Responsabilidades**:
- Manejo de peticiones HTTP
- Coordinación con servicios
- Formato de respuestas

##### 3. Services (Capa de Negocio)
```javascript
// services/auth.service.js
export class AuthService extends BaseService {
    static async register(userData) {
        // Validación de reglas de negocio
        this.validateUserData(userData);
        
        // Verificar que el usuario no exista
        const existingUser = await userRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new Error('El usuario ya existe');
        }
        
        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Crear usuario
        return await userRepository.create({
            ...userData,
            password: hashedPassword
        });
    }
}
```

**Responsabilidades**:
- Lógica de negocio
- Validaciones complejas
- Orquestación de operaciones

##### 4. Repositories (Capa de Acceso a Datos)
```javascript
// repositories/user.repository.js
export class UserRepository extends BaseRepository {
    constructor() {
        super('users');
    }
    
    async findByEmail(email) {
        return this.db.get(
            `SELECT * FROM ${this.tableName} WHERE email = ?`,
            [email]
        );
    }
    
    async findByIdSafe(id) {
        const user = await this.findById(id);
        if (user) {
            delete user.password;
        }
        return user;
    }
}
```

**Responsabilidades**:
- Abstracción de base de datos
- Operaciones CRUD especializadas
- Optimización de consultas

##### 5. Middlewares
```javascript
// middlewares/dataSanitization.middleware.js
export const sanitizeRequest = (req, res, next) => {
    try {
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }
        next();
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error en sanitización de datos'
        });
    }
};
```

**Responsabilidades**:
- Validación de requests
- Sanitización de datos
- Autenticación y autorización
- Logging y auditoría

## Patrones de diseño

### 1. Repository Pattern
Abstrae el acceso a datos proporcionando una interfaz uniforme.

```javascript
// Interfaz base
class BaseRepository {
    async findById(id) { /* implementación */ }
    async create(data) { /* implementación */ }
    async update(id, data) { /* implementación */ }
    async delete(id) { /* implementación */ }
}

// Implementación específica
class UserRepository extends BaseRepository {
    async findByEmail(email) { /* implementación específica */ }
}
```

**Beneficios**:
- Testabilidad mejorada
- Separación de responsabilidades
- Flexibilidad para cambiar implementación

### 2. Service Layer Pattern
Encapsula la lógica de negocio en una capa separada.

```javascript
class AuthService {
    static async login(credentials) {
        // 1. Validar credenciales
        // 2. Verificar usuario en base de datos
        // 3. Generar token JWT
        // 4. Registrar auditoría
        // 5. Retornar respuesta
    }
}
```

**Beneficios**:
- Lógica de negocio centralizada
- Reutilización de código
- Fácil testing y mantenimiento

### 3. Middleware Pattern
Procesamiento en cadena de requests/responses.

```javascript
app.use('/api/auth', 
    rateLimiter,           // Rate limiting
    sanitizeRequest,       // Sanitización
    validateSchema,        // Validación
    authRoutes            // Rutas finales
);
```

**Beneficios**:
- Separación de concerns
- Reutilización de lógica transversal
- Pipeline de procesamiento claro

### 4. Factory Pattern
Para creación de objetos complejos.

```javascript
class ServiceFactory {
    static createAuthService(config) {
        switch (config.authType) {
            case 'jwt':
                return new JWTAuthService();
            case 'oauth':
                return new OAuthAuthService();
            default:
                throw new Error('Tipo de auth no soportado');
        }
    }
}
```

### 5. Observer Pattern
Para eventos y notificaciones.

```javascript
class UserService extends EventEmitter {
    async register(userData) {
        const user = await userRepository.create(userData);
        this.emit('userRegistered', user);
        return user;
    }
}

// Suscriptores
userService.on('userRegistered', (user) => {
    emailService.sendWelcomeEmail(user);
    auditService.logUserRegistration(user);
});
```

## Base de datos

### Modelo de datos

#### Tabla Users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla Packing Lists
```sql
CREATE TABLE packing_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    qr_code VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Tabla Audit Log
```sql
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Estrategias de migración

#### Estructura de migraciones
```javascript
// migrations/001_create_users_table.js
export const up = async (db) => {
    await db.exec(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
};

export const down = async (db) => {
    await db.exec('DROP TABLE IF EXISTS users');
};
```

#### Sistema de versioning
```javascript
// migrations/index.js
export const migrations = [
    { version: 1, file: '001_create_users_table.js' },
    { version: 2, file: '002_add_user_profiles.js' },
    { version: 3, file: '003_create_packing_lists.js' }
];
```

## Seguridad

### 1. Autenticación y Autorización
- **JWT Tokens**: Para autenticación stateless
- **Refresh Tokens**: Para renovación segura
- **Role-based Access**: Control de acceso por roles

```javascript
// Middleware de autorización
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado'
            });
        }
        next();
    };
};
```

### 2. Validación y Sanitización
- **Input Validation**: Zod schemas para validación
- **Data Sanitization**: Limpieza de datos maliciosos
- **SQL Injection Protection**: Prepared statements

```javascript
// Esquema de validación con Zod
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    username: z.string().min(3).max(20)
});
```

### 3. Protección de archivos
- **Magic Number Validation**: Verificación de tipo real
- **Size Limits**: Límites de tamaño de archivo
- **Path Traversal Protection**: Prevención de ataques de directorio

```javascript
// Validación de tipo de archivo
const validateFileType = (buffer, allowedTypes) => {
    const fileType = await import('file-type');
    const type = await fileType.fileTypeFromBuffer(buffer);
    return allowedTypes.includes(type?.mime);
};
```

### 4. Headers de seguridad
```javascript
// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    next();
});
```

### 5. Rate Limiting
```javascript
// Rate limiting por IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    message: {
        success: false,
        message: 'Demasiadas peticiones, intenta más tarde'
    }
});
```

## Escalabilidad

### 1. Arquitectura horizontal
- **Load Balancing**: Nginx para distribución de carga
- **Database Scaling**: Read replicas para consultas
- **Caching**: Redis para cache distribuido

### 2. Optimización de base de datos
```sql
-- Índices para mejorar performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_packing_lists_user_id ON packing_lists(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

### 3. Caching estratégico
```javascript
// Cache de usuarios frecuentemente accedidos
const getUserById = async (id) => {
    const cached = await redis.get(`user:${id}`);
    if (cached) {
        return JSON.parse(cached);
    }
    
    const user = await userRepository.findById(id);
    await redis.setex(`user:${id}`, 3600, JSON.stringify(user));
    return user;
};
```

### 4. Optimización de recursos
- **Compression**: Gzip para responses
- **Static Files**: CDN para archivos estáticos
- **Database Connection Pooling**: Pool de conexiones

## Deployment

### 1. Containerización con Docker

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN cd client && npm install && npm run build

EXPOSE 4000

CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DB_TYPE=postgresql
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: cargo_prod
      POSTGRES_USER: cargo_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 2. CI/CD Pipeline

#### GitHub Actions
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          docker build -t cargo-app .
          docker tag cargo-app ${{ secrets.REGISTRY_URL }}/cargo-app:latest
          docker push ${{ secrets.REGISTRY_URL }}/cargo-app:latest
```

### 3. Monitoreo y Logging

#### Configuración de logs
```javascript
// config/logger.js
import winston from 'winston';

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log' 
        })
    ]
});
```

#### Health checks
```javascript
// routes/health.js
router.get('/health', async (req, res) => {
    try {
        // Check database connection
        await db.get('SELECT 1');
        
        // Check Redis connection
        await redis.ping();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});
```

## Mejores prácticas arquitecturales

### 1. Principios SOLID
- **Single Responsibility**: Cada clase/función tiene una responsabilidad
- **Open/Closed**: Abierto para extensión, cerrado para modificación
- **Liskov Substitution**: Subclases deben ser sustituibles
- **Interface Segregation**: Interfaces específicas mejor que generales
- **Dependency Inversion**: Depender de abstracciones, no concreciones

### 2. Clean Architecture
- **Separation of Concerns**: Separación clara de responsabilidades
- **Dependency Rule**: Dependencias apuntan hacia adentro
- **Testability**: Código fácil de testear
- **Independence**: Frameworks, DB, UI son detalles

### 3. Error Handling
- **Fail Fast**: Fallar rápido y de forma controlada
- **Error Boundaries**: Límites claros para manejo de errores
- **Logging**: Registro detallado para debugging
- **Graceful Degradation**: Funcionalidad reducida pero operativa

### 4. Performance
- **Lazy Loading**: Cargar recursos bajo demanda
- **Caching**: Cache inteligente en múltiples niveles
- **Database Optimization**: Consultas optimizadas e índices
- **Resource Management**: Gestión eficiente de memoria y conexiones

Esta arquitectura proporciona una base sólida, escalable y mantenible para el sistema 888Cargo, siguiendo las mejores prácticas de la industria y permitiendo evolución futura del sistema.
