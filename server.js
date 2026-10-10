import express from 'express';
import cors from 'cors';
import { INITIAL_ORDERS } from './src/data.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

let orders = [...INITIAL_ORDERS];

let restaurantOpen = true;
let clients = [];

// API endpoints
app.get('/api/state', (req, res) => {
  res.json({ orders, restaurantOpen });
});

app.post('/api/orders', (req, res) => {
  const newOrder = req.body;
  orders = [newOrder, ...orders];
  notifyClients();
  res.json(newOrder);
});

app.patch('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  orders = orders.map(o => o.id === id ? { ...o, status } : o);
  notifyClients();
  res.json({ success: true });
});

app.post('/api/toggle-restaurant', (req, res) => {
  restaurantOpen = !restaurantOpen;
  notifyClients();
  res.json({ restaurantOpen });
});

app.post('/api/reset', (req, res) => {
  orders = [];
  restaurantOpen = true;
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

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});
