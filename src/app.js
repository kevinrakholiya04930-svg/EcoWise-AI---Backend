const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');

const authRoutes = require('./features/auth/auth.routes');
const userRoutes = require('./features/user/user.routes');
const carbonRoutes = require('./features/carbon/carbon.routes');
const coachRoutes = require('./features/coach/coach.routes');
const gamificationRoutes = require('./features/gamification/gamification.routes');

const { errorHandler } = require('./middleware/error.middleware');
const ensureDBConnection = require('./middleware/db.middleware');

const app = express();

// Security HTTP Headers
app.use(helmet());

// CORS config
app.use(cors({
  origin: '*', // Allow all origins for hackathon simplicity
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 200, // limit each IP to 200 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitization against NoSQL Query Injection
app.use(mongoSanitize());

// Routes
app.use('/api/v1', ensureDBConnection);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/carbon', carbonRoutes);
app.use('/api/v1/coach', coachRoutes);
app.use('/api/v1/gamification', gamificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
