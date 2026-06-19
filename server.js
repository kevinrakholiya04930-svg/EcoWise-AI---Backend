require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

if (process.env.VERCEL) {
  module.exports = app;
} else {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`EcoWise Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  }).catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
}
