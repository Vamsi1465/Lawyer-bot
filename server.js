// server.js
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 9000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: 'No message provided' });
    }

    const n8nWebhook =
      'https://n8n-byoqnxdr.us-east-1.clawcloudrun.com/webhook-test/559a0cd6-fd82-4cb7-85e8-f12ab4ee267e';

    console.log('Sending message to webhook:', userMessage);

    const response = await fetch(n8nWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) {
      console.error('Webhook error:', response.status);
      return res.status(500).json({ error: 'Webhook error' });
    }

    const data = await response.json();
    console.log('Raw webhook response:', JSON.stringify(data, null, 2));

    let reply;

    if (Array.isArray(data) && data.length > 0) {
      // Check inside body/json for AI output
      reply =
        data[0].body?.output ||
        data[0].body?.reply ||
        data[0].json?.output ||
        data[0].json?.reply;
    } else if (data.body) {
      reply = data.body.output || data.body.reply;
    } else {
      reply = data.output || data.reply;
    }

    if (!reply) reply = 'No response from AI';

    console.log('Reply sent to frontend:', reply);
    res.json({ reply });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Start server
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Lawyer Chatbot running at http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error(err);
    }
  });
}

startServer(PORT);
