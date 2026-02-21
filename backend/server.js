require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP
  message: { msg: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/auditlog', require('./routes/auditlog'));
app.use('/api/reports', require('./routes/reports'));

mongoose.connect('mongodb://wavfd_sched_mongo:27017/scheduler', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(port, () => {
      console.log(`Backend listening at http://localhost:${port}`);
    });
  })
  .catch(err => console.log(err));
