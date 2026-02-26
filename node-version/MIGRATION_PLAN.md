# Plan de Migración: Localipet (Django → Node.js)

Este documento detalla la estrategia de migración del ecosistema Localipet a un stack basado en Node.js, priorizando la paridad de funcionalidades y la mejora del rendimiento y DX.

## Stack Tecnológico Elegido
- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **ORM**: Prisma (con soporte para SQLite/PostgreSQL)
- **Autenticación**: Auth.js (NextAuth) con Prisma Adapter
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React
- **Estado/Datos**: React Server Components + Server Actions

---

## 📅 Fases de Implementación

### Fase 1: Base de Datos y Autenticación (Completada) ✅
- [x] Inicializar proyecto Next.js y Prisma.
- [x] Traducir modelos de Django a Prisma Schema.
- [x] Configurar `.env` con variables de entorno críticas.
- [x] Implementar Auth.js:
    - Login/Registro con Credenciales (Email/Password).
    - Integración con el modelo `User` en DB.
    - Manejo de sesiones y roles (Dueño, Vet, Admin).

### Fase 2: Gestión de Mascotas (Completada) ✅
- [x] Listado de mascotas (Vista de cuadrícula responsive).
- [x] Detalle de mascota:
    - Información básica y fotos.
    - Generación dinámica de códigos QR.
- [x] Formularios de Creación/Edición (Server Actions).
- [x] Registro de Tags físicos y vinculación inteligente.

### Fase 3: Escaneo y Acceso Público (Completada) ✅
- [x] Página de destino para escaneo público (`/s/[token]`).
- [x] Redirección inteligente para Tags no asignados.
- [x] Buscador por ShortCode alfanumérico (`#ABC123`).
- [x] Directorio público de mascotas perdidas.
- [ ] Formulario avanzado para mensajes (Integrado básico).

### Fase 4: Funciones Médicas y Profesionales (En Progreso) 🚧
- [ ] Calendario de vacunas y recordatorios.
- [x] Historial de peso con gráficos.
- [x] Buscador de Clínicas Veterinarias.
- [x] Módulo Profesional de DNI Animal (Impresión).

### Fase 5: E-commerce y Administración (En Progreso) 🚧
- [x] Constructor de Tags masivo (Generación Batch).
- [x] Exportación de datos para fábrica (CSV).
- [ ] Integración con Stripe para Suscripciones.
- [x] Pitch Deck para Inversores.

---

## 🛠 Ejecución Inmediata

1.  **Configurar Variables de Entorno**: Crear `.env` en `node-version`.
2.  **Configurar Auth.js**: Establecer el middleware y el handler de autenticación.
3.  **Implementar Auth UI**: Páginas de Login y Registro con estilos premium.
4.  **Conexión de Datos**: Implementar el cliente de Prisma para consultas en tiempo real.
