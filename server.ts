import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to make reliable requests to Google Apps Script with full redirect follow
async function forwardToAppsScript(url: string, payload: any): Promise<{ success: boolean; data?: any; status: number; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    // Google Apps Script accepts text/plain POST or GET query parameters
    const isGet = payload && payload.method === 'GET';
    let targetUrl = url;
    let fetchOptions: RequestInit = {
      redirect: 'follow',
      signal: controller.signal,
    };

    if (isGet) {
      const separator = url.includes('?') ? '&' : '?';
      targetUrl = `${url}${separator}action=${encodeURIComponent(payload.action || 'read')}&_ts=${Date.now()}`;
      fetchOptions.method = 'GET';
    } else {
      fetchOptions.method = 'POST';
      fetchOptions.headers = {
        'Content-Type': 'text/plain;charset=utf-8',
      };
      fetchOptions.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    }

    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeout);

    const text = await response.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    return {
      success: response.ok,
      status: response.status,
      data: json,
    };
  } catch (error: any) {
    return {
      success: false,
      status: 500,
      error: error?.message || 'Error de conexión con Google Apps Script',
    };
  }
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Proxy: Read POIs from Google Apps Script
app.get('/api/sheets/pois', async (req, res) => {
  const targetUrl = (req.query.url as string) || '';
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL de Apps Script no proporcionada' });
  }

  const result = await forwardToAppsScript(targetUrl, { method: 'GET', action: 'read' });
  if (result.success && result.data) {
    return res.json(result.data);
  }
  return res.status(result.status || 502).json({ error: result.error || 'Error al obtener datos de Google Sheets' });
});

// Proxy: Save (create / update) POI
app.post('/api/sheets/save-poi', async (req, res) => {
  const { targetUrl, poi, isEdit } = req.body;
  if (!targetUrl || !poi) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos (targetUrl o poi)' });
  }

  const payload = {
    action: isEdit ? 'update' : 'create',
    id: poi.id,
    lat: poi.lat,
    lng: poi.lng,
    nombre: poi.nombre,
    descripcion: poi.descripcion || '',
    categoria: poi.categoria || 'Otro',
    ciudad: poi.ciudad || '',
    rating: poi.rating !== undefined ? poi.rating : '',
    direccion: poi.direccion || '',
    telefono: poi.telefono || '',
    web: poi.web || '',
    horario: poi.horario || '',
    precio: poi.precio || '',
    tags: Array.isArray(poi.tags) ? poi.tags : [],
    foto_url: poi.foto_url || '',
    favorito: poi.favorito === true,
    notas_privadas: poi.notas_privadas || '',
    estado: poi.estado || 'Pendiente',
  };

  const result = await forwardToAppsScript(targetUrl, payload);
  return res.status(result.status || 200).json(result.data || { success: result.success, id: poi.id });
});

// Proxy: Delete POI
app.post('/api/sheets/delete-poi', async (req, res) => {
  const { targetUrl, id } = req.body;
  if (!targetUrl || !id) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos (targetUrl o id)' });
  }

  const payload = {
    action: 'delete',
    id: id,
  };

  const result = await forwardToAppsScript(targetUrl, payload);
  return res.status(result.status || 200).json(result.data || { success: result.success });
});

// Proxy: Batch Sync (Multiple POIs at once)
app.post('/api/sheets/batch-sync', async (req, res) => {
  const { targetUrl, pois } = req.body;
  if (!targetUrl || !Array.isArray(pois)) {
    return res.status(400).json({ error: 'Se requiere una lista de POIs válida y targetUrl' });
  }

  const payload = {
    action: 'batch_sync',
    pois: pois,
  };

  const result = await forwardToAppsScript(targetUrl, payload);
  return res.status(result.status || 200).json(result.data || { success: result.success, count: pois.length });
});

// Proxy: Test Read & Write
app.post('/api/sheets/test-connection', async (req, res) => {
  const { targetUrl } = req.body;
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL no proporcionada' });
  }

  // 1. Test Read
  const readRes = await forwardToAppsScript(targetUrl, { method: 'GET', action: 'read' });
  if (!readRes.success) {
    return res.status(502).json({
      success: false,
      stage: 'read',
      error: `Error al leer la hoja: ${readRes.error || 'Código ' + readRes.status}`,
    });
  }

  const poisCount = Array.isArray(readRes.data) ? readRes.data.length : 0;
  return res.json({
    success: true,
    poisCount,
    message: `Conexión verificada con éxito. Se han detectado ${poisCount} POIs en Google Sheets.`,
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
