# GeoHistory - Historial de Modificaciones

## Resumen del Proyecto
Aplicación colaborativa de mapas históricos donde los usuarios pueden marcar eventos históricos, asociarlos a marcos históricos y personajes. Los eventos requieren aprobación de administradores.

### Tecnologías
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, React Leaflet
- **Backend**: Node.js, Express, PostgreSQL, JWT
- **Infraestructura**: Docker, WSL2

---

## 1. Migración de Supabase a PostgreSQL Local (2026-05-25)

### Cambios principales
- Eliminada dependencia de Supabase
- Configurado PostgreSQL en Docker con `docker-compose.yml`
- Creado backend Express con endpoints REST
- Implementada autenticación JWT

### Archivos clave
- `backend/server.js` - Servidor Express con todos los endpoints
- `backend/.env` - Configuración de entorno
- `docker-compose.yml` - PostgreSQL container
- `DATABASE_SETUP.sql` - Esquema inicial de base de datos

### Nuevas tablas
```sql
users, frames, events, characters
Endpoints API creados
javascript
// Autenticación
POST /api/auth/signup
POST /api/auth/login

// Eventos
GET    /api/events
GET    /api/events/my
POST   /api/events
PATCH  /api/events/:id/approve
DELETE /api/events/:id

// Personajes
GET    /api/characters
POST   /api/characters

// Marcos
GET    /api/frames
POST   /api/frames

// Admin
GET    /api/admin/events/pending
2. Nuevas Funcionalidades del Mapa (2026-05-25)
Eventos con clic derecho
Click derecho en el mapa abre formulario para agregar evento

Coordenadas capturadas automáticamente

Prevención del menú contextual del navegador

Tooltips informativos
Hover (Tooltip): Muestra título, año y hasta 2 personajes

Click (Popup): Popup completo con descripción, todos los personajes e imágenes

Componentes creados
app/components/Map.tsx - Componente principal del mapa

app/components/EventForm.tsx - Formulario para crear eventos

app/components/OptimizedImage.tsx - Componente optimizado para imágenes

Formulario de Eventos
Título, descripción, fecha

Selección de marco histórico

Selección de personajes existentes

Creación de nuevos personajes en línea

Ubicación automática (coordenadas del clic)

3. Administración (CRUD Completo) (2026-05-26)
Nuevas páginas de admin
Ruta	Función
/admin	Eventos pendientes de aprobación
/admin/characters	CRUD de personajes históricos
/admin/frames	CRUD de marcos históricos
/admin/events	CRUD de todos los eventos
Componente de navegación
app/components/AdminNav.tsx - Tabs de navegación en admin

Endpoints API agregados
javascript
PUT    /api/characters/:id    // Actualizar personaje
PUT    /api/frames/:id        // Actualizar marco
PUT    /api/events/:id        // Actualizar evento
DELETE /api/characters/:id    // Eliminar personaje
DELETE /api/frames/:id        // Eliminar marco
Funcionalidades de Admin
Aprobar/rechazar eventos pendientes

Crear/editar/eliminar personajes (con imagen)

Crear/editar/eliminar marcos históricos (con rango de años)

Ver y eliminar todos los eventos

4. Filtros del Mapa (Marcos y Años) (2026-05-26)
Nuevos selectores
Barra verde: Selector de marcos históricos

Barra azul: Selector de años (filtrado por marco seleccionado)

Comportamiento
Al seleccionar un marco, solo muestra años con eventos en ese marco

Botón "Todos los marcos" muestra eventos sin marco también

Contador dinámico de eventos filtrados

Estado de selección persistente (no se resetea automáticamente)

Modificaciones en la base de datos
sql
ALTER TABLE frames ADD COLUMN start_year INTEGER;
ALTER TABLE frames ADD COLUMN end_year INTEGER;

-- Actualizar rangos desde fechas existentes
UPDATE frames SET start_year = EXTRACT(YEAR FROM start_date)::INTEGER WHERE start_date IS NOT NULL;
UPDATE frames SET end_year = EXTRACT(YEAR FROM end_date)::INTEGER WHERE end_date IS NOT NULL;
5. Sistema de Imágenes (2026-05-26)
Utilidad de conversión
lib/imageUtils.ts - Convierte URLs de Wikipedia a URLs directas

Soporte para Wikipedia en español (/media/Archivo:) e inglés (/media/File:)

Funciones disponibles
javascript
convertWikipediaUrl(url: string): string   // Convierte URL de Wikipedia a directa
getWikipediaImageUrl(wikipediaPageUrl: string): Promise<string>  // Versión asíncrona
Optimización de imágenes
Precarga de imágenes en caché del navegador

Loading skeleton mientras carga

Manejo de errores de carga (fallback a "Sin imagen")

Lazy loading para mejorar rendimiento

Uso en Admin
Vista previa de imagen al agregar/editar personajes

Botón "Ayuda" con instrucciones para obtener URLs correctas

Convertidor automático de URLs de Wikipedia

6. Internacionalización (i18n) (2026-05-27)
Idiomas soportados
Código	Idioma	Bandera
es	Español	🇪🇸
en	English	🇺🇸
pt	Português	🇧🇷
Archivo de traducciones
app/lib/i18n.ts - Sistema completo de traducciones

Funciones disponibles
javascript
setLanguage(lang: Language)   // Cambiar idioma (persiste en localStorage)
getLanguage(): Language        // Obtener idioma actual
t(key: string): string         // Traducir clave
tWithParams(key, params)       // Traducir con parámetros dinámicos
Componentes
app/components/LanguageSelector.tsx - Selector de idioma en navbar

Persistencia en localStorage

Recarga automática al cambiar idioma

Traducciones implementadas
Navegación (Mapa, Línea de Tiempo, Admin)

Mapas y popups (Figuras, Eventos, Años)

Admin (Personajes, Marcos, Eventos pendientes)

Autenticación (Login, Registro, mensajes de error)

Formularios (Guardar, Cancelar, Editar, Eliminar)

7. Timeline Independiente (2026-05-26)
Características
app/timeline/page.tsx - Página separada para línea de tiempo

Navegación por años (botones horizontales)

Muestra eventos aprobados con personajes e imágenes

Auto-selección del primer año disponible

Visualización
Tarjetas de eventos con título, fecha, descripción

Personajes con imágenes (thumbnails)

Ubicación geográfica (coordenadas)

Actualización automática cada 30 segundos

8. Autenticación y Roles (2026-05-25)
Sistema de usuarios
Registro con email, nombre y contraseña

Inicio de sesión con JWT

Contraseñas encriptadas con bcrypt

Roles
regular - Usuario normal (puede crear eventos)

super_user - Administrador (puede aprobar/rechazar eventos y CRUD completo)

Endpoints de autenticación
javascript
POST /api/auth/signup   // Registro (crea usuario role 'regular')
POST /api/auth/login    // Login (retorna user + token)
Middleware de autenticación
javascript
authenticateToken(req, res, next)  // Verifica JWT en header Authorization
isSuperUser(userId)                // Verifica si es administrador
Estructura de Base de Datos Actual
Tabla users
sql
id            UUID PRIMARY KEY
email         TEXT UNIQUE NOT NULL
full_name     TEXT
password_hash TEXT NOT NULL
role          TEXT DEFAULT 'regular' (regular, super_user)
created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
Tabla frames
sql
id          UUID PRIMARY KEY
name        TEXT UNIQUE NOT NULL
description TEXT
start_date  DATE
end_date    DATE
start_year  INTEGER
end_year    INTEGER
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
Tabla events
sql
id          UUID PRIMARY KEY
user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
frame_id    UUID REFERENCES frames(id) ON DELETE SET NULL
lat         DOUBLE PRECISION NOT NULL
lng         DOUBLE PRECISION NOT NULL
title       TEXT NOT NULL
description TEXT
event_date  DATE NOT NULL
characters  JSONB DEFAULT '[]'::jsonb
status      TEXT DEFAULT 'pending' (pending, approved)
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
Tabla characters
sql
id          UUID PRIMARY KEY
name        TEXT UNIQUE NOT NULL
description TEXT
image_url   TEXT
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
Índices creados
sql
idx_users_email
idx_events_user_id
idx_events_frame_id
idx_events_status
idx_events_event_date
idx_events_lat_lng
idx_characters_name
idx_frames_start_date
Componentes del Sistema
Frontend
text
app/
├── admin/                      # Panel de administración
│   ├── page.tsx                # Eventos pendientes
│   ├── characters/page.tsx     # CRUD personajes
│   ├── frames/page.tsx         # CRUD marcos
│   └── events/page.tsx         # CRUD eventos
├── auth/
│   └── page.tsx                # Login/Registro
├── components/
│   ├── Map.tsx                 # Mapa con filtros
│   ├── EventForm.tsx           # Formulario de eventos
│   ├── OptimizedImage.tsx      # Imagen optimizada
│   ├── Navbar.tsx              # Barra navegación
│   ├── AdminNav.tsx            # Tabs admin
│   └── LanguageSelector.tsx    # Selector idioma
├── lib/
│   ├── api.ts                  # Cliente API
│   ├── i18n.ts                 # Traducciones
│   └── imageUtils.ts           # Utilidad imágenes
├── map/
│   └── page.tsx                # Mapa principal
└── timeline/
    └── page.tsx                # Línea de tiempo
Backend
text
backend/
├── server.js            # Servidor Express (todos los endpoints)
├── .env                 # Variables de entorno
├── package.json         # Dependencias
└── node_modules/
Cómo Ejecutar el Proyecto
1. Clonar repositorio
bash
git clone https://github.com/NestyV/GeoHistory.git
cd GeoHistory
2. Iniciar base de datos
bash
docker-compose up -d postgres
3. Configurar backend
bash
cd backend
cp .env.example .env  # Configurar variables
npm install
node server.js
4. Configurar frontend
bash
cd ..
cp .env.local.example .env.local  # Configurar NEXT_PUBLIC_API_URL
npm install
npm run dev
5. Acceder a la aplicación
Frontend: http://localhost:3000

Backend API: http://localhost:3001

Admin: requiere usuario con rol super_user

6. Crear usuario administrador
bash
docker exec -it geohistory-postgres psql -U geohistory_user -d geohistory \
  -c "UPDATE users SET role = 'super_user' WHERE email = 'tu-email@example.com';"
Variables de Entorno
Frontend (.env.local)
env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_TIMEOUT=30000
Backend (.env)
env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=geohistory
DB_USER=geohistory_user
DB_PASSWORD=change_this_password_12345
JWT_SECRET=my_super_secret_key_change_this_in_production_12345
JWT_EXPIRATION=7d
CORS_ORIGIN=http://localhost:3000
HOST=0.0.0.0
Notas Importantes
Imágenes: Usar URLs directas de imágenes (que terminen en .jpg, .png, .gif). No usar páginas de Wikipedia completas. La utilidad convertWikipediaUrl() puede convertir automáticamente URLs de Wikipedia.

Eventos: Los eventos nuevos creados por usuarios tienen estado pending. Solo administradores pueden aprobarlos en el panel de admin.

Roles: Los usuarios regulares pueden crear eventos pero no aprobarlos. Los administradores (super_user) tienen acceso a todo el CRUD.

Red local (WSL2) : Para acceder desde el celular, usar la IP de Windows (192.168.x.x), no la IP de WSL. Configurar NEXT_PUBLIC_API_URL con esa IP y asegurarse que el backend escuche en 0.0.0.0.

Docker: La base de datos PostgreSQL corre en Docker. Asegurarse que el contenedor esté activo antes de iniciar el backend.

Actualización automática: El mapa se actualiza cada 30 segundos para reflejar nuevos eventos aprobados.

Idiomas Soportados
🇪🇸 Español (por defecto)

🇺🇸 English

🇧🇷 Português

El selector de idioma está en la barra de navegación y la preferencia se guarda en localStorage. Al cambiar el idioma, la página se recarga automáticamente para aplicar todas las traducciones.

Endpoints API Completo
Método	Endpoint	Descripción	Auth
POST	/api/auth/signup	Registro de usuario	No
POST	/api/auth/login	Inicio de sesión	No
GET	/api/events	Lista eventos aprobados	No
GET	/api/events/my	Eventos del usuario	Sí
POST	/api/events	Crear evento (pending)	Sí
PATCH	/api/events/:id/approve	Aprobar evento	Admin
PUT	/api/events/:id	Actualizar evento	Admin
DELETE	/api/events/:id	Eliminar evento	Admin
GET	/api/characters	Lista personajes	No
POST	/api/characters	Crear personaje	Sí
PUT	/api/characters/:id	Actualizar personaje	Admin
DELETE	/api/characters/:id	Eliminar personaje	Admin
GET	/api/frames	Lista marcos	No
POST	/api/frames	Crear marco	Sí
PUT	/api/frames/:id	Actualizar marco	Admin
DELETE	/api/frames/:id	Eliminar marco	Admin
GET	/api/admin/events/pending	Eventos pendientes	Admin
GET	/health	Health check	No
Enlaces Útiles
Repositorio: https://github.com/NestyV/GeoHistory

Documentación Next.js: https://nextjs.org/docs

Documentación Leaflet: https://leafletjs.com/reference.html

Documentación PostgreSQL: https://www.postgresql.org/docs/

Licencia
Este proyecto es de código abierto. Contribuciones son bienvenidas.
