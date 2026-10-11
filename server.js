import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_ORDERS } from './src/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('dist', {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Load or initialize persistent database
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return {
        orders: data.orders || [...INITIAL_ORDERS],
        restaurantOpen: typeof data.restaurantOpen === 'boolean' ? data.restaurantOpen : true
      };
    }
  } catch (e) {
    console.error('Error reading db, using defaults:', e);
  }
  return { orders: [...INITIAL_ORDERS], restaurantOpen: true };
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving db:', e);
  }
}

let db = loadDb();
let orders = db.orders;
let restaurantOpen = db.restaurantOpen;
let clients = [];

// API endpoints
app.get('/api/state', (req, res) => {
  res.json({ orders, restaurantOpen });
});

app.post('/api/orders', (req, res) => {
  const newOrder = req.body;
  console.log(`[COMMANDE REÇUE] #${newOrder.id} - ${newOrder.customerName} (${newOrder.total}€)`);
  orders = [newOrder, ...orders];
  saveDb({ orders, restaurantOpen });
  notifyClients();
  res.json(newOrder);
});

app.patch('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  orders = orders.map(o => o.id === id ? { ...o, status } : o);
  saveDb({ orders, restaurantOpen });
  notifyClients();
  res.json({ success: true });
});

app.post('/api/toggle-restaurant', (req, res) => {
  restaurantOpen = !restaurantOpen;
  saveDb({ orders, restaurantOpen });
  notifyClients();
  res.json({ restaurantOpen });
});

app.post('/api/reset', (req, res) => {
  orders = [...INITIAL_ORDERS];
  restaurantOpen = true;
  saveDb({ orders, restaurantOpen });
  notifyClients();
  res.json({ success: true });
});

// SSE endpoint for real-time updates
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
  });
});

function notifyClients() {
  const data = JSON.stringify({ orders, restaurantOpen });
  clients.forEach(client => client.res.write(`data: ${data}\n\n`));
}

// SPA Fallback for client routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});
