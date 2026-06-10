# GeoHistory - Especificaciones de Diseño

## 1. Visión General

GeoHistory es una aplicación colaborativa de mapas históricos donde los usuarios pueden marcar eventos históricos, asociarlos a marcos históricos y personajes. Los eventos requieren aprobación de administradores.

### Tecnologías
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, React Leaflet
- **Backend**: Node.js, Express, PostgreSQL, JWT
- **Infraestructura**: Docker, WSL2

---

## 2. Diseño de UI/UX

### 2.1 Layout General
┌─────────────────────────────────────────────────────────────┐
│ NAVBAR (fija) │
├─────────────────────────────────────────────────────────────┤
│ SELECTOR DE MARCOS HISTÓRICOS │
│ [Marco1] [Marco2] [Marco3] ... [Todos los marcos] │
├─────────────────────────────────────────────────────────────┤
│ SELECTOR DE AÑOS │
│ [2020] [2021] [2022] ... [Todos los años] [X eventos] │
├─────────────────────────────────────────────────────────────┤
│ │
│ MAPA │
│ │
│ │
└─────────────────────────────────────────────────────────────┘


### 2.2 Header Heights (estándar)
- **Navbar**: `p-4` (16px padding)
- **Selector de Marcos**: `px-2 py-1` (8px vertical, 8px horizontal)
- **Selector de Años**: `px-2 py-1` (8px vertical, 8px horizontal)
- **Total headers**: ~64px (mínimo)

### 2.3 Colores por Estado

| Elemento | Color Normal | Color Activo |
|----------|--------------|--------------|
| Marcos Históricos | `bg-gray-100` | `bg-green-600 text-white` |
| Años | `bg-gray-100` | `bg-blue-600 text-white` |
| Botón "Todos" (marcos) | `bg-gray-100` | `bg-green-600 text-white` |
| Botón "Todos" (años) | `bg-gray-100` | `bg-blue-600 text-white` |

### 2.4 Tipografía
- **Texto normal**: `text-sm` (14px)
- **Contador de eventos**: `text-xs` (12px), `text-gray-500`
- **Tooltips**: `text-xs` (10-12px)
- **Títulos en popups**: `text-lg` (18px), bold

### 2.5 Espaciado
- **Padding horizontal botones**: `px-3`
- **Padding vertical botones**: `py-1`
- **Gap entre botones**: `gap-1`
- **Borde inferior**: `border-b border-gray-200`

### 2.6 Tooltips (Hover)
- **Contenido hover**: Título, año, primeros 2 personajes
- **No imágenes en hover** (para evitar blinking)
- **Posición**: `direction="top"`, `offset={[0, -20]}`
- **Max width**: 220px, **Min width**: 120px

### 2.7 Popups (Click)
- **Contenido completo**: Título, fecha completa, descripción, todos los personajes con imágenes
- **Imágenes**: 32x32px, circulares (`rounded-full`)
- **Ancho máximo**: 320px

---

## 3. Funcionalidades

### 3.1 Mapa
- [x] Clic derecho para agregar evento
- [x] Prevención del menú contextual del navegador
- [x] Tooltip en hover (info mínima)
- [x] Popup en click (info completa)
- [x] Marcadores con imágenes de personajes
- [x] Zoom y pan estándar de Leaflet

### 3.2 Filtros
- [x] Selector de marcos históricos (barra verde) - presente en Mapa y Timeline
- [x] Selector de años (barra azul) - presente en Mapa y Timeline
- [x] Los años se filtran según el marco seleccionado
- [x] Botón "Todos los marcos" (muestra eventos sin marco)
- [x] Botón "Todos los años"
- [x] Contador dinámico de eventos visibles
- [x] Descripción de marco solo en hover (tooltip)
- [x] Filtro por marco en la página "Todos los Eventos" (curador y admin)

### 3.3 Formulario de Eventos
- [x] Título (requerido)
- [x] Descripción
- [x] Fecha (requerida) - se guarda en UTC, se muestra en formato local DD/MM/YYYY
- [x] Selección de marco histórico (dropdown)
- [x] Selección de personajes existentes
- [x] Creación de nuevos personajes en línea (cualquier usuario autenticado)
- [x] Agregar imagen URL para nuevos personajes
- [x] Ubicación automática (coordenadas del clic)

### 3.4 Autenticación
- [x] Registro de usuario (email, nombre, password)
- [x] Inicio de sesión con JWT
- [x] Cierre de sesión
- [x] Roles: `regular`, `curator` y `super_user`

### 3.5 Administración (super_user)
- [x] Aprobar/rechazar eventos pendientes
- [x] CRUD de personajes (con imagen)
- [x] CRUD de marcos históricos (con rango de años)
- [x] CRUD de eventos

### 3.5 Roles y Permisos

| Función | Regular | Curador | Administrador |
|---------|---------|---------|---------------|
| Ver mapa y timeline | ✅ | ✅ | ✅ |
| Crear eventos (quedan pending) | ✅ | ✅ | ✅ |
| Aprobar/rechazar eventos | ❌ | ✅ | ✅ |
| CRUD de personajes | ❌ | ✅ | ✅ |
| CRUD de marcos históricos | ❌ | ✅ | ✅ |
| Modificar autorizaciones de Curador | ❌ | ❌ | ✅ |
| Backups y restores | ❌ | ❌ | ✅ |
| Configuración del sistema | ❌ | ❌ | ✅ |

### 3.6 Administración
- [x] Aprobar/rechazar eventos pendientes (Curador y Admin)
- [x] CRUD de personajes (Curador y Admin)
- [x] CRUD de marcos históricos (Curador y Admin)
- [x] CRUD de eventos (Admin; Curador solo edición)
- [x] Navegación con tabs: Pending Events, Characters, Frames, All Events
- [x] Filtro por marco histórico en "Todos los Eventos"

### 3.7 Internacionalización
- [x] Español (default)
- [x] English
- [x] Português
- [x] Selector de idioma en navbar
- [x] Persistencia en localStorage

### 3.8 Preferencias de Usuario
- [x] Guardar último marco seleccionado
- [x] Guardar último año seleccionado
- [x] Guardar posición del mapa (lat, lng, zoom)
- [x] Guardar cada 30 segundos
- [x] Guardar al cerrar sesión
- [x] Restaurar al iniciar sesión

---

## 4. Componentes

### 4.1 Estructura de Archivos

app/
├── admin/
│ ├── page.tsx # Eventos pendientes
│ ├── characters/page.tsx # CRUD personajes
│ ├── frames/page.tsx # CRUD marcos
│ └── events/page.tsx # CRUD eventos
├── auth/page.tsx # Login/Registro
├── components/
│ ├── Map.tsx # Mapa principal
│ ├── EventForm.tsx # Formulario de eventos
│ ├── OptimizedImage.tsx # Imagen optimizada
│ ├── Navbar.tsx # Barra navegación
│ ├── AdminNav.tsx # Tabs admin
│ └── LanguageSelector.tsx # Selector idioma
├── hooks/
│ └── useUserPreferences.ts # Preferencias usuario
├── lib/
│ ├── api.ts # Cliente API
│ ├── i18n.ts # Traducciones
│ └── imageUtils.ts # Utilidad imágenes
├── map/page.tsx # Página del mapa
└── timeline/page.tsx # Línea de tiempo


### 4.2 Map.tsx Props (ninguna, auto-contenido)

### 4.3 EventForm.tsx Props
```typescript
interface EventFormProps {
  lat: number
  lng: number
  onClose: () => void
  onSuccess: () => void
  frames: any[]
  onFrameCreated?: () => void
}


## 5. Base de Datos
```sql```
### 5.1 Tabla users
id            UUID PRIMARY KEY
email         TEXT UNIQUE NOT NULL
full_name     TEXT
password_hash TEXT NOT NULL
role          TEXT DEFAULT 'regular' CHECK (role IN ('regular', 'curator', 'super_user'))
created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 5.2 Tabla frames
id          UUID PRIMARY KEY
name        TEXT UNIQUE NOT NULL
description TEXT
start_date  DATE
end_date    DATE
start_year  INTEGER
end_year    INTEGER
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 5.3 Tabla events
id          UUID PRIMARY KEY
user_id     UUID NOT NULL REFERENCES users(id)
frame_id    UUID REFERENCES frames(id)
lat         DOUBLE PRECISION NOT NULL
lng         DOUBLE PRECISION NOT NULL
title       TEXT NOT NULL
description TEXT
event_date  DATE NOT NULL
characters  JSONB DEFAULT '[]'
status      TEXT DEFAULT 'pending'
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 5.4 Tabla characters
id          UUID PRIMARY KEY
name        TEXT UNIQUE NOT NULL
description TEXT
image_url   TEXT
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 5.5 Tabla user_preferences
id            UUID PRIMARY KEY
user_id       UUID NOT NULL REFERENCES users(id)
last_frame_id UUID REFERENCES frames(id)
last_year     INTEGER
last_lat      DOUBLE PRECISION
last_lng      DOUBLE PRECISION
last_zoom     INTEGER
updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
UNIQUE(user_id)

## 6. API Endpoints
### 6.1 Autenticación

Método	Endpoint	        Descripción	Auth
POST  	/api/auth/signup	Registro	  No
POST	  /api/auth/login	  Login	      No

### 6.2 Eventos
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET   | `/api/events` | Lista eventos aprobados | No |
| GET   | `/api/events/my` | Eventos del usuario | Sí |
| POST  | `/api/events` | Crear evento | Sí |
| PATCH | `/api/events/:id/approve` | Aprobar | Curador/Admin |
| PUT   | `/api/events/:id` | Actualizar | Curador/Admin |
| DELETE | `/api/events/:id` | Eliminar | Admin |

### 6.3 Personajes
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/characters` | Listar | No |
| POST | `/api/characters` | Crear | Sí (cualquier usuario autenticado) |
| PUT | `/api/characters/:id` | Actualizar | Curador/Admin |
| DELETE | `/api/characters/:id` | Eliminar | Curador/Admin |

### 6.4 Marcos
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/frames` | Listar | No |
| POST | `/api/frames` | Crear | Curador/Admin |
| PUT | `/api/frames/:id` | Actualizar | Curador/Admin |
| DELETE | `/api/frames/:id` | Eliminar | Curador/Admin |

### 6.5 Preferencias
Método	Endpoint	            Descripción	Auth
GET	    /api/user/preferences	Obtener	    Sí
POST	  /api/user/preferences	Guardar   	Sí
DELETE	/api/user/preferences	Eliminar	  Sí

### 6.6 Admin
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/events/pending` | Eventos pendientes | Curador/Admin |

## 7. Seguridad
### 7.1 Autenticación
JWT con expiración (7 días por defecto)
Passwords hasheados con bcrypt
Tokens almacenados en localStorage

### 7.2 Autorización
- **regular**: puede crear eventos, ver mapas (eventos quedan pending)
- **curator**: puede aprobar/rechazar eventos, CRUD de personajes y marcos
- **super_user**: acceso completo a admin, CRUD de todo, puede modificar autorizaciones de curadores, backups

### 7.3 Validaciones
Email único
Campos requeridos validados en backend
Sanitización de inputs

7.4 CORS
Configurado para origen específico
En desarrollo: http://localhost:3000

## 8. Testing
### 8.1 Backend
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# Obtener eventos
curl http://localhost:3001/api/events

### 8.2 Frontend (Manual)
- Verificar carga del mapa
- Verificar clic derecho abre formulario
- Verificar filtros (marcos y años)
- Verificar creación de eventos
- Verificar admin: aprobar/rechazar
- Verificar CRUD completo
- Verificar cambio de idioma
- Verificar fechas en formato correcto (DD/MM/YYYY)

## 9. Backup y Recuperación
### 9.1 Backup de Base de Datos
# Backup
docker exec geohistory-postgres pg_dump -U geohistory_user geohistory > backup_$(date +%Y%m%d).sql

# Restore
cat backup.sql | docker exec -i geohistory-postgres psql -U geohistory_user geohistory

### 9.2 Datos de Preferencias
- Se guardan automáticamente cada 30 segundos
- Persisten en la base de datos
- También respaldo en sessionStorage
- No se eliminan al cerrar sesión

## 10. Configuración de Desarrollo
### 10.1 Variables de Entorno
Frontend (.env.local):
NEXT_PUBLIC_API_URL=http://localhost:3001

Backend (.env):
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=geohistory
DB_USER=geohistory_user
DB_PASSWORD=change_this_password_12345
JWT_SECRET=... (min 32 caracteres)
CORS_ORIGIN=http://localhost:3000

10.2 Comandos Útiles
# Iniciar base de datos
docker-compose up -d postgres

# Iniciar backend
cd backend && node server.js

# Iniciar frontend
npm run dev

# Limpiar caché Next.js
rm -rf .next

# Verificar tablas
docker exec geohistory-postgres psql -U geohistory_user -d geohistory -c "\dt"

### 11. Registro de Cambios

| Fecha      | Cambio                                      | Componente |
|------------|---------------------------------------------|------------|
| 2026-05-25 | Migración de Supabase a PostgreSQL local    | Backend |
| 2026-05-25 | Implementación de mapa con clic derecho     | Map.tsx |
| 2026-05-26 | CRUD completo para admin                    | Admin pages |
| 2026-05-26 | Filtros de marcos y años | Map.tsx |
| 2026-05-26 | Sistema de imágenes con utilidad Wikipedia | OptimizedImage |
| 2026-05-27 | Internacionalización (ES, EN, PT) | i18n |
| 2026-05-27 | Preferencias de usuario (marco, año, posición) | useUserPreferences |
| 2026-05-31 | Nuevo rol: Curador (aprueba eventos, CRUD) | Backend + Frontend |
| 2026-05-31 | Jerarquía de roles: regular → curator → super_user | Base de datos |
| 2026-05-31 | Corrección: preferencias persisten después de logout | user_preferences |
| 2026-06-02 | Filtro por marco en "Todos los Eventos" | admin/events/page.tsx |
| 2026-06-02 | Corrección de visualización de fechas (DD/MM/YYYY) | Timeline, Admin Events |
| 2026-06-02 | Selector de marcos en Timeline | app/timeline/page.tsx |

12. Próximos Features (Pendientes)
- Notificaciones en tiempo real
- Exportar datos a CSV/GeoJSON
- Modo oscuro
- Compartir ubicación en redes sociales
- Comentarios en eventos
- Valoraciones de eventos
- Galería de imágenes por evento

## 13. Manejo de Fechas

### 13.1 Almacenamiento
- Las fechas se almacenan en la base de datos en formato UTC (YYYY-MM-DD)
- El backend recibe y guarda las fechas en formato ISO (YYYY-MM-DD)

### 13.2 Visualización
- En listados (Timeline, Todos los Eventos): formato DD/MM/YYYY
- En formularios de edición: input type="date" con formato YYYY-MM-DD
- Se utiliza función `formatDateDisplay()` para mostrar sin conversión de zona horaria

### 13.3 Función de formateo
```javascript```
const formatDateDisplay = (dateString: string) => {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

*Documento actualizado: 2026-06-02*
