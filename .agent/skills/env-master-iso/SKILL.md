---
name: env-master-iso
description: Experto en Gestión y Auditoría de Ambientes (Local, Render, Preprod, Prod). Asegura la conectividad robusta y configuración agnóstica.
---

# Skill 2.0: Env-Master-ISO (Protocolo de Ambientes)

Este skill es el guardián de la conectividad y disponibilidad del sistema en múltiples entornos. Debe ejecutarse cada vez que se modifique una URL, puerto o lógica de conexión.

## 1. Misión
Garantizar que el sistema pueda "switchear" entre ambientes local, nube (Render) y on-premise (Docker) sin errores de CORS, Swagger o discrepancia de datos.

## 2. Matriz de Ambientes (Fuente de Verdad)

| Ambiente | Host Front | Host Back (API) | DB Dialect | SSL |
| :--- | :--- | :--- | :--- | :--- |
| **Local** | `localhost:5173` | `localhost:4048` | SQLite / MySQL | No |
| **OnRender** | `*-client.onrender.com` | `*-api.onrender.com` | MySQL | Yes |
| **Preprod** | `preprod-ia-agents-manager.inntek.cl` | `preprod-ia-agents-manager-api.inntek.cl` | MySQL | Yes (Proxy) |
| **Prod** | `ia-agents-manager.inntek.cl` | `ia-agents-manager-api.inntek.cl` | MySQL | Yes (Proxy) |

## 3. Protocolo de Auditoría (Ejecución Obligatoria)

### A. Capa de Backend (server.js)
- [ ] **CORS**: Verificar que las 4 URLs de origen estén permitidas.
- [ ] **Swagger**: Verificar que los 4 servidores estén listados con descripciones claras.
- [ ] **Logs**: Asegurar que `[PARKO] Environment: X` reporte el modo correcto.

### B. Capa de Frontend (api.js)
- [ ] **Detección**: Verificar que `window.ENV` tenga prioridad.
- [ ] **Fallback**: Si `window.ENV` falla, intentar deducir el Back basado en `window.location.hostname`.

### C. Capa de Datos (database.js)
- [ ] **Dialecto**: Cambiar a `sqlite` solo en local si `DB_HOST` está ausente.
- [ ] **SSL**: Siempre requerido en nube y on-premise productivos.

## 4. Acciones de Emergencia
Si una conexión falla por ambiente:
1. Revisar el archivo `.env.{ambiente}` correspondiente.
2. Validar que el Nginx Proxy (en Preprod/Prod) esté pasando correctamente el `X-Forwarded-For`.
3. Validar que el Frontend haya sido construido con la base agnóstica (sin hardcoding de Prod).
