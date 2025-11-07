const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const helmet = require('helmet');
const morgan = require('morgan');
const actionLogger = require('./middleware/logger');

dotenv.config();

const app = express();
const START_PORT = parseInt(process.env.PORT, 10) || 5000;

// helper to start server on available port
async function startServer(portStart) {
  return new Promise((resolve, reject) => {
    let port = portStart;
    const server = app.listen(port)
      .on('listening', () => resolve({ server, port }))
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`Port ${port} in use, trying ${port + 1}`);
          port += 1;
          if (port > portStart + 20) return reject(new Error('No free ports'));
          // try again after slight delay
          setTimeout(() => {
            app.listen(port).on('listening', () => resolve({ server: app, port })).on('error', (e) => reject(e));
          }, 200);
        } else reject(err);
      });
  });
}

// Connect DB
connectDB();

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(actionLogger);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// allow localhost dev ports (vite may use 5173 or 5174) and the configured CLIENT_ORIGIN
const allowedOrigins = new Set([CLIENT_ORIGIN, 'http://localhost:5173', 'http://localhost:5174']);
app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser tools (no origin) and known allowed origins
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS: ' + origin));
    },
    credentials: true,
  })
);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/data', require('./routes/data'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/returns', require('./routes/returns'));
app.use('/api/tools', require('./routes/tools'));
app.use('/api/ai', require('./routes/ai'));

// Basic health
app.get('/', (req, res) => res.send({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

// health route for db
app.get('/api/health', (req, res) => {
  const mongooseState = require('mongoose').connection.readyState; // 0 disconnected,1 connected
  res.json({ ok: true, portHint: process.env.PORT || START_PORT, mongoState: mongooseState });
});

(async () => {
  try {
    const { port } = await startServer(START_PORT);
    console.log(`Server running on port ${port}`);
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();
