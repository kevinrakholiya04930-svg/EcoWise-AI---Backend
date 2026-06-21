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
const onboardingRoutes = require('./features/onboarding/onboarding.routes');

const { errorHandler } = require('./middleware/error.middleware');
const ensureDBConnection = require('./middleware/db.middleware');

const app = express();

app.disable('x-powered-by');

app.use(helmet());

app.use(cors({
  origin: '*', // Allow all origins for hackathon simplicity
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'Too many requests from this IP, please try again after 15 minutes'
  }
});

app.use('/api/', limiter);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '1mb'
}));

app.use(mongoSanitize());

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy'
  });
});

app.use('/api/v1', ensureDBConnection);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/carbon', carbonRoutes);
app.use('/api/v1/coach', coachRoutes);
app.use('/api/v1/gamification', gamificationRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);

app.use(errorHandler);

module.exports = app;