const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const branchRoutes = require('./routes/branchRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const billingRoutes = require('./routes/billingRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

// Enable CORS with credentials for HttpOnly cookie exchange
app.use(
  cors({
    origin: 'http://localhost:5173', // Vite default port
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Rate Limiter for Login Endpoint to prevent brute-force attacks (Security non-functional req)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 login requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Mount Routes
app.use('/api/auth', authRoutes);
// Apply rate limiter specifically to login endpoint
app.use('/api/auth/login', loginLimiter);

app.use('/api/branches', branchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit-logs', auditRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
