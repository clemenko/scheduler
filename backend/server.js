require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = 5000;

// Middleware
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/events', require('./routes/events'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/users', require('./routes/users'));

mongoose.connect('mongodb://mongo:27017/scheduler', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(port, () => {
      console.log(`Backend listening at http://localhost:${port}`);
    });
  })
  .catch(err => console.log(err));
