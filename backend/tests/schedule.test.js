const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const scheduleRouter = require('../routes/schedule');
const Schedule = require('../models/Schedule');
const Shift = require('../models/Shift');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bodyParser = require('body-parser');

jest.mock('../middleware/auth', () => jest.fn((req, res, next) => next()));
jest.mock('../middleware/admin', () => jest.fn((req, res, next) => next()));
jest.mock('../utils/email', () => jest.fn().mockResolvedValue({}));

const app = express();
app.use(bodyParser.json());
app.use('/api/schedule', scheduleRouter);

describe('Schedule API', () => {
  let mongoServer;
  let userId;
  let shiftId;
  let vehicleId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    const user = await User.create({ name: 'Test User', email: 'test@example.com', password: 'hashed' });
    const vehicle = await Vehicle.create({ name: 'Engine 1', capacity: 3 });
    const shift = await Shift.create({
      title: 'Test Shift',
      start_time: new Date('2026-09-01T09:00:00Z'),
      end_time: new Date('2026-09-01T17:00:00Z'),
      creator: user._id
    });
    userId = user._id;
    vehicleId = vehicle._id;
    shiftId = shift._id;

    auth.mockImplementation((req, res, next) => {
      req.user = { id: userId.toString(), role: 'viewer' };
      next();
    });
  });

  afterEach(async () => {
    await Schedule.deleteMany({});
    await Shift.deleteMany({});
    await Vehicle.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/schedule/signup', () => {
    it('should sign up a user for a shift', async () => {
      const res = await request(app)
        .post('/api/schedule/signup')
        .send({ shiftId, vehicleId });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.shift.toString()).toBe(shiftId.toString());
      expect(res.body.user.toString()).toBe(userId.toString());
    });

    it('should not allow double signup for the same shift', async () => {
      await request(app).post('/api/schedule/signup').send({ shiftId, vehicleId });
      const res = await request(app).post('/api/schedule/signup').send({ shiftId, vehicleId });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe('User already signed up for this shift');
    });

    it('should reject signup when vehicle is at capacity', async () => {
      for (let i = 0; i < 3; i++) {
        const u = await User.create({ name: `Filler ${i}`, email: `filler${i}@example.com`, password: 'hashed' });
        await Schedule.create({ shift: shiftId, user: u._id, vehicle: vehicleId });
      }
      const res = await request(app).post('/api/schedule/signup').send({ shiftId, vehicleId });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe('This vehicle is full for this shift');
    });

    it('should return 404 for a non-existent shift', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).post('/api/schedule/signup').send({ shiftId: fakeId, vehicleId });

      expect(res.statusCode).toBe(404);
      expect(res.body.msg).toBe('Shift not found');
    });

    it('should return 404 for a non-existent vehicle', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).post('/api/schedule/signup').send({ shiftId, vehicleId: fakeId });

      expect(res.statusCode).toBe(404);
      expect(res.body.msg).toBe('Vehicle not found');
    });
  });

  describe('DELETE /api/schedule/:signupId', () => {
    it('should cancel a users own signup', async () => {
      const signupRes = await request(app).post('/api/schedule/signup').send({ shiftId, vehicleId });
      const signupId = signupRes.body._id;

      const deleteRes = await request(app).delete(`/api/schedule/${signupId}`);
      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body.msg).toBe('Signup canceled');

      const signup = await Schedule.findById(signupId);
      expect(signup).toBeNull();
    });

    it('should not allow a user to cancel another users signup', async () => {
      const otherUser = await User.create({ name: 'Other', email: 'other@example.com', password: 'hashed' });
      const signup = await Schedule.create({ shift: shiftId, user: otherUser._id, vehicle: vehicleId });

      const res = await request(app).delete(`/api/schedule/${signup._id}`);
      expect(res.statusCode).toBe(401);
      expect(res.body.msg).toBe('Not authorized');
    });

    it('should allow an admin to cancel any signup', async () => {
      const otherUser = await User.create({ name: 'Other', email: 'other@example.com', password: 'hashed' });
      const signup = await Schedule.create({ shift: shiftId, user: otherUser._id, vehicle: vehicleId });

      auth.mockImplementation((req, res, next) => {
        req.user = { id: userId.toString(), role: 'admin' };
        next();
      });

      const res = await request(app).delete(`/api/schedule/${signup._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toBe('Signup canceled');
    });

    it('should return 404 for a non-existent signup', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/schedule/${fakeId}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.msg).toBe('Signup not found');
    });
  });
});
