
import http from 'http';
import fs from 'fs';
import { WebSocketServer } from 'ws';

const PORT = 3001;

// Create HTTP server
const server = http.createServer((req, res) => {
  fs.readFile('./public/index.html', (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading page');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/html'
    });

    res.end(data);
  });
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Broadcast message to all connected clients
function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
}

// Handle WebSocket connections
wss.on('connection', (socket, req) => {
  const username = new URL(
    req.url,
    'http://localhost'
  ).searchParams.get('username');

  // Notify everyone that a user joined
  broadcast({
    type: 'system',
    text: `${username} joined`
  });

  // Handle incoming chat messages
  socket.on('message', (message) => {
    const data = JSON.parse(message.toString());

    broadcast({
      type: 'chat',
      username: data.username,
      text: data.text
    });
  });

  // Notify remaining clients when a user leaves
  socket.on('close', () => {
    broadcast({
      type: 'system',
      text: `${username} left`
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Chat server running at http://localhost:${PORT}`);
});
