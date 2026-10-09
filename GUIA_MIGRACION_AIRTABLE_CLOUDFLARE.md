# Guía Paso a Paso: Migración a Airtable y Cloudflare Pages

Esta guía está redactada con instrucciones claras y visuales para cualquier persona, **incluso si no tienes conocimientos previos de programación ni has utilizado nunca Airtable o Cloudflare**.

---

## 📋 Resumen del Proceso
1. **Crear la Base de Datos en Airtable** y configurar sus 17 columnas (puedes crearlas con 1 clic importando la plantilla CSV).
2. **Generar tu Token de Acceso (PAT)** y obtener tu **Base ID**.
3. **Probar la conexión en la Webapp** y migrar todos tus POIs con el botón de subida masiva.
4. **Publicar la webapp en Cloudflare Pages** (gratuito, seguro y ultrarrápido).

---

## 🟢 PASO 1: Crear tu Base de Datos en Airtable

1. Entra en [Airtable.com](https://airtable.com) e inicia sesión o crea una cuenta gratuita (puedes entrar con Google).
2. En tu panel principal, haz clic en el botón **+ Create** o **Create a base** (abajo a la izquierda).
3. Selecciona **Start from scratch** (Empezar desde cero).
4. Dale un nombre a tu base, por ejemplo: `Mis Viajes y POIs`.
5. Verás una tabla inicial con una pestaña. Haz doble clic sobre el nombre de la pestaña (por defecto suele llamarse *Table 1*) y cámbiale el nombre a **`POIs`** (en mayúsculas, tal cual).

### 💡 TRUCO RÁPIDO (Crea todas las columnas en 5 segundos):
1. Abre tu aplicación web actual y haz clic en el botón de **Ajustes** (icono de engranaje arriba a la derecha).
2. Ve a la pestaña **Copia / Exportar CSV** y pulsa en **"Descargar CSV"**. Se descargará un archivo llamado `mis_pois_airtable_ready_....csv`.
3. En Airtable, haz clic en la flecha junto al nombre de la tabla **POIs** o en **+ Add or import** > **CSV file**.
4. Sube el archivo CSV descargado. ¡Airtable creará automáticamente todas las columnas con sus nombres exactos y rellenará tus datos de ejemplo!

---

### Si prefieres crear las columnas manualmente:
Asegúrate de que los nombres de las columnas en Airtable coincidan **exactamente** con esta lista:

| Nombre exacto de la Columna | Tipo de Campo en Airtable | Descripción |
| :--- | :--- | :--- |
| **`ID`** | Single line text | Identificador único (ej: ID-EX1001) |
| **`Nombre`** | Single line text | Nombre del lugar |
| **`Lat`** | Number (Decimal) | Latitud geográfica (ej: 40.415363) |
| **`Lng`** | Number (Decimal) | Longitud geográfica (ej: -3.707398) |
| **`Categoria`** | Single line text *(o Single select)* | Comida, Turismo, Copas, Hotel, etc. |
| **`Ciudad`** | Single line text | Ciudad o municipio |
| **`Descripcion`** | Long text | Descripción del lugar |
| **`Rating`** | Number (Decimal) | Puntuación de 0 a 5 |
| **`Direccion`** | Single line text | Dirección postal |
| **`Telefono`** | Phone number *(o Single line text)* | Teléfono de contacto |
| **`Web`** | URL | Enlace web oficial |
| **`Horario`** | Single line text | Horario de apertura |
| **`Precio`** | Single line text | Gratis, €, €€, €€€, etc. |
| **`Tags`** | Single line text *(o Long text)* | Etiquetas separadas por coma |
| **`Foto_URL`** | URL *(o Single line text)* | Enlace a una fotografía |
| **`Favorito`** | Checkbox | Casilla para marcar favoritos |
| **`Notas_Privadas`** | Long text | Tus apuntes personales |
| **`Estado`** | Single line text *(o Single select)* | Pendiente, Visitado, Imprescindible |

---

## 🔑 PASO 2: Obtener las 3 Credenciales de Airtable

Para que tu aplicación pueda guardar y leer datos de tu tabla, necesita 3 datos:

### 1. Personal Access Token (PAT)
1. Entra en este enlace directo: **[airtable.com/create/tokens](https://airtable.com/create/tokens)**
2. Haz clic en el botón azul **+ Create new token**.
3. En **Name**, escribe: `POIs Web App`.
4. En **Scopes** (Permisos), haz clic en **+ Add a scope** y añade estos dos:
   - `data.records:read` (Permite leer tus lugares)
   - `data.records:write` (Permite crear, editar y borrar lugares)
5. En **Access** (Acceso a bases), haz clic en **+ Add a base** y selecciona tu base: `Mis Viajes y POIs` (o la que creaste en el paso 1).
6. Haz clic en **Create token**.
7. **Copia el token** que empieza por `pat...` y guárdalo en un bloc de notas (solo se muestra una vez).

### 2. Base ID
1. Abre tu base de Airtable en el navegador.
2. Fíjate en la barra de direcciones URL. Tendrá una estructura similar a:
   `https://airtable.com/appAbCdEf12345678/tbl...`
3. El **Base ID** es la parte que empieza por `app` seguida de letras y números (ejemplo: `appAbCdEf12345678`).
4. Cópialo.

### 3. Nombre de la Tabla
- Por defecto es: **`POIs`**.

---

## 🚀 PASO 3: Conectar la Webapp y Migrar tus Datos

1. Abre tu aplicación web de POIs en el navegador.
2. Haz clic en el icono de **Ajustes** (engranaje arriba a la derecha).
3. En la pestaña **Credenciales Airtable**:
   - Pega tu **AIRTABLE_PERSONAL_ACCESS_TOKEN** (`pat...`).
   - Pega tu **AIRTABLE_BASE_ID** (`app...`).
   - Escribe el **AIRTABLE_TABLE_NAME** (`POIs`).
   - Haz clic en **Guardar Credenciales**.
4. Haz clic en el botón **"Probar Conexión en Directo"**:
   - Deberás ver un mensaje en verde confirmando la conexión con éxito.
5. Haz clic en **"Subir todos los POIs a Airtable"**:
   - La aplicación subirá en lotes todos tus lugares automáticamente a tu cuenta de Airtable.
   - Si abres Airtable en otra pestaña, ¡verás cómo aparecen todos tus lugares en tiempo real!

---

## 🌐 PASO 4: Despliegue en Cloudflare Pages

Cloudflare Pages es gratuito, tiene certificado SSL (HTTPS) automático y distribuye tu web en cientos de servidores de todo el mundo para que cargue al instante.

Elige el método que te resulte más cómodo:

### MÉTODO A: Subida Directa por Arrastrar y Soltar (Sin terminal ni Git)
1. En tu ordenador o entorno de desarrollo, genera los archivos finales ejecutando:
   ```bash
   npm run build
   ```
   *(Esto creará una carpeta llamada `dist/` con tu HTML, CSS y JavaScript listos).*
2. Entra en tu panel de control de [Cloudflare](https://dash.cloudflare.com/).
3. En el menú lateral izquierdo, ve a **Workers y Pages**.
4. Haz clic en **Crear** (Create) y selecciona la pestaña **Pages**.
5. Selecciona **Cargar recursos** (Upload assets).
6. Dale un nombre a tu proyecto (por ejemplo: `mis-viajes-pois`).
7. Arrastra la carpeta **`dist`** que se generó en el paso 1 al recuadro de Cloudflare.
8. Haz clic en **Implementar sitio** (Deploy site).
9. ¡En 10 segundos tu webapp estará disponible en `https://mis-viajes-pois.pages.dev`!

---

### MÉTODO B: Conexión Automática con GitHub
Si tienes tu código subido a GitHub:
1. En el panel de Cloudflare, ve a **Workers y Pages** > **Crear** > pestaña **Pages** > **Conectar a Git**.
2. Conecta tu cuenta de GitHub y elige tu repositorio (`POIs`).
3. En la pantalla de configuración:
   - **Preajuste de compilación (Framework preset):** `Vite`
   - **Comando de compilación (Build command):** `npm run build` (o `npm run build:pages`)
   - **Directorio de salida de la compilación (Build output directory):** `dist`
4. *(Opcional)* En **Variables de entorno (Environment variables)**, puedes agregar:
   - `VITE_AIRTABLE_PERSONAL_ACCESS_TOKEN` = tu token `pat...`
   - `VITE_AIRTABLE_BASE_ID` = tu base id `app...`
   - `VITE_AIRTABLE_TABLE_NAME` = `POIs`
5. Haz clic en **Guardar e implementar** (Save and Deploy).
6. Cada vez que hagas un cambio en GitHub, Cloudflare actualizará tu webapp automáticamente en cuestión de segundos.

> 💡 **Nota sobre el error de `bun install` solucionado:**
> Si Cloudflare intentaba ejecutar `bun install --frozen-lockfile` y fallaba con `error: Unknown lockfile version at bun.lock`, el motivo era la presencia del archivo `bun.lock` con una versión no soportada por el entorno de Cloudflare. Se ha eliminado `bun.lock` para que Cloudflare Pages utilice el gestor estándar `npm` (`npm install` / `npm ci` con `package-lock.json`), lo que garantiza una compilación limpia y 100% exitosa.

---

## 🛡️ Ventajas de la Nueva Arquitectura
- **Independencia absoluta:** Eliminada por completo la dependencia de Google Sheets, Google Apps Script y cuotas de ejecución de Google.
- **Sin servidores intermedios:** La webapp corre 100% en el navegador del usuario y se comunica de forma directa con la API oficial REST de Airtable mediante `fetch()` estándar.
- **Protección contra pérdida de datos:** Si estás de viaje sin cobertura en el teléfono, la app sigue funcionando, guarda los lugares en la memoria local y los sincroniza automáticamente con Airtable en cuanto recuperas conexión.
