const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const authRouter = require('../routes/auth');
const User = require('../models/User');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bodyParser = require('body-parser');

process.env.JWT_SECRET = 'test_secret';

const app = express();
app.use(bodyParser.json());
app.use('/api/auth', authRouter);

describe('Auth API', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should not register a duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'dupe@example.com', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Another User', email: 'dupe@example.com', password: 'password456' });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash('password123', salt);
      await User.create({ name: 'Login User', email: 'login@example.com', password: hashed });
    });

    it('should login with valid credentials and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should reject an unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe('Invalid credentials');
    });

    it('should reject a wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'wrongpassword' });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe('Invalid credentials');
    });
  });
});
