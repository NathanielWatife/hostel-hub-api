require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const lostFoundRoutes = require('./routes/lostFound');
const usersRoutes = require('./routes/users');

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// CORS
// Use only CLIENT_URL; normalize by removing trailing slashes to avoid mismatches
const allowedOrigin = (process.env.CLIENT_URL || '').trim().replace(/\/+$/, '');

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser or same-origin requests with no Origin header
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/+$/, '');
    if (normalized === allowedOrigin) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
// Explicitly handle preflight for all routes
app.options(/.*/, cors(corsOptions));
// Fallback OPTIONS handler to ensure 204 for any unmatched route
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
// Keep existing '/api' namespace
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/users', usersRoutes);

// Also expose routes at root for environments where the API is served from '/'
app.use('/auth', authRoutes);
app.use('/complaints', complaintRoutes);
app.use('/lost-found', lostFoundRoutes);
app.use('/users', usersRoutes);

// Health check routes
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'HostelHub API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'HostelHub API is running',
    timestamp: new Date().toISOString()
  });
});

// Handle undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 HostelHub server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;