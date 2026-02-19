const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const usersRouter = require('../routes/users');
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bodyParser = require('body-parser');

jest.mock('../middleware/auth', () => jest.fn((req, res, next) => next()));
jest.mock('../middleware/admin', () => jest.fn((req, res, next) => next()));

const app = express();
app.use(bodyParser.json());
app.use('/api/users', usersRouter);

describe('Users API', () => {
  let mongoServer;
  let adminUserId;
  let viewerUserId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash('password123', salt);
    const adminUser = await User.create({ name: 'Admin User', email: 'admin@example.com', password: hashed, role: 'admin' });
    const viewerUser = await User.create({ name: 'Viewer User', email: 'viewer@example.com', password: hashed, role: 'viewer' });
    adminUserId = adminUser._id;
    viewerUserId = viewerUser._id;

    auth.mockImplementation((req, res, next) => {
      req.user = { id: adminUserId.toString(), role: 'admin' };
      next();
    });
    admin.mockImplementation((req, res, next) => next());
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  it('should return all users without passwords', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).not.toHaveProperty('password');
  });

  it('should reset a user password', async () => {
    const res = await request(app)
      .put(`/api/users/${viewerUserId}/reset-password`)
      .send({ password: 'newpassword' });
    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe('Password reset successfully');
  });

  it('should update a user role', async () => {
    const res = await request(app)
      .put(`/api/users/${viewerUserId}/role`)
      .send({ role: 'admin' });
    expect(res.statusCode).toBe(200);
    expect(res.body.role).toBe('admin');
  });

  it('should reject an invalid role', async () => {
    const res = await request(app)
      .put(`/api/users/${viewerUserId}/role`)
      .send({ role: 'superuser' });
    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe('Invalid role');
  });

  it('should not demote the last admin', async () => {
    const res = await request(app)
      .put(`/api/users/${adminUserId}/role`)
      .send({ role: 'viewer' });
    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe('Cannot remove the last admin');
  });

  it('should delete a viewer user', async () => {
    const res = await request(app).delete(`/api/users/${viewerUserId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe('User deleted');
    const user = await User.findById(viewerUserId);
    expect(user).toBeNull();
  });

  it('should not delete an admin user', async () => {
    const res = await request(app).delete(`/api/users/${adminUserId}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe('Cannot delete an admin user');
  });

  it('should return 404 for a non-existent user', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/users/${fakeId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.msg).toBe('User not found');
  });
});
