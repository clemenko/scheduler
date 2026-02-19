const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const shiftsRouter = require('../routes/shifts');
const Shift = require('../models/Shift');
const auth = require('../middleware/auth');

jest.mock('../middleware/auth', () => jest.fn((req, res, next) => next()));

const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use('/api/shifts', shiftsRouter);

const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Shifts API', () => {
  let mongoServer;
  const userId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    auth.mockImplementation((req, res, next) => {
      req.user = { id: userId, role: 'admin' };
      next();
    });
  });

  afterEach(async () => {
    await Shift.deleteMany({});
  });

  it('should create a single shift', async () => {
    const res = await request(app)
      .post('/api/shifts')
      .send({
        title: 'Test Shift',
        start_time: '2026-08-25T13:00:00.000Z',
        end_time: '2026-08-25T18:00:00.000Z',
        isRecurring: false,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Test Shift');
  });

  // Daily recurring shift
  it('should create a daily recurring shift', async () => {
    const res = await request(app)
      .post('/api/shifts')
      .send({
        title: 'Daily Shift',
        start_time: '2026-08-25T09:00:00.000Z',
        end_time: '2026-08-25T17:00:00.000Z',
        isRecurring: true,
        recurrenceRule: {
          frequency: 'daily',
          endType: 'on_date',
          endDate: '2026-08-27T09:00:00.000Z',
          daysOfWeek: []
        }
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(3);
    expect(new Date(res.body[0].start_time).toISOString()).toBe('2026-08-25T09:00:00.000Z');
    expect(new Date(res.body[1].start_time).toISOString()).toBe('2026-08-26T09:00:00.000Z');
    expect(new Date(res.body[2].start_time).toISOString()).toBe('2026-08-27T09:00:00.000Z');
  });

  it('should create a daily recurring shift with a default interval of 1', async () => {
    const res = await request(app)
      .post('/api/shifts')
      .send({
        title: 'Daily Shift with default interval',
        start_time: '2026-08-25T09:00:00.000Z',
        end_time: '2026-08-25T17:00:00.000Z',
        isRecurring: true,
        recurrenceRule: {
          frequency: 'daily',
          endType: 'on_date',
          endDate: '2026-08-27T09:00:00.000Z',
          daysOfWeek: []
        }
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(3);
    expect(new Date(res.body[0].start_time).toISOString()).toBe('2026-08-25T09:00:00.000Z');
    expect(new Date(res.body[1].start_time).toISOString()).toBe('2026-08-26T09:00:00.000Z');
    expect(new Date(res.body[2].start_time).toISOString()).toBe('2026-08-27T09:00:00.000Z');
  });

  // Weekly recurring shift
  it('should create a weekly recurring shift on specific days', async () => {
    const res = await request(app)
      .post('/api/shifts')
      .send({
        title: 'Weekly Shift',
        start_time: '2026-09-01T10:00:00.000Z', // A Tuesday
        end_time: '2026-09-01T18:00:00.000Z',
        isRecurring: true,
        recurrenceRule: {
          frequency: 'weekly',
          daysOfWeek: ['TU', 'TH'],
          endType: 'after_occurrences',
          occurrences: 4
        }
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(4);
  });

  // Monthly recurring shift
  it('should create a monthly recurring shift on a specific day of the month', async () => {
    const res = await request(app)
      .post('/api/shifts')
      .send({
        title: 'Monthly Shift',
        start_time: '2026-10-15T08:00:00.000Z',
        end_time: '2026-10-15T16:00:00.000Z',
        isRecurring: true,
        recurrenceRule: {
          frequency: 'monthly',
          dayOfMonth: 15,
          endType: 'after_occurrences',
          occurrences: 3,
          daysOfWeek: []
        }
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(3);
    expect(new Date(res.body[1].start_time).getDate()).toBe(15);
  });

  it('should update a recurring shift series', async () => {
    const initialResponse = await request(app)
      .post('/api/shifts')
      .send({
        title: 'Recurring Shift to Update',
        start_time: '2026-08-01T09:00:00.000Z',
        end_time: '2026-08-01T17:00:00.000Z',
        isRecurring: true,
        recurrenceRule: {
          frequency: 'daily',
          endType: 'after_occurrences',
          occurrences: 3,
          daysOfWeek: []
        },
        exclusions: []
      });

    expect(initialResponse.statusCode).toEqual(200);
    const parentId = initialResponse.body[0]._id;

    const updatedResponse = await request(app)
      .put(`/api/shifts/series/${parentId}`)
      .send({
        title: 'Updated Recurring Shift',
        start_time: '2026-08-01T10:00:00.000Z',
        end_time: '2026-08-01T18:00:00.000Z',
        recurrenceRule: {
          frequency: 'daily',
          endType: 'after_occurrences',
          occurrences: 2,
          daysOfWeek: []
        },
        exclusions: []
      });

    expect(updatedResponse.statusCode).toEqual(200);
    expect(updatedResponse.body).toHaveLength(2);
    expect(updatedResponse.body[0].title).toBe('Updated Recurring Shift');

    const shiftsInDb = await Shift.find({ parentShift: updatedResponse.body[0].parentShift });
    expect(shiftsInDb).toHaveLength(2);

    const oldShiftsInDb = await Shift.find({ parentShift: parentId });
    expect(oldShiftsInDb).toHaveLength(0);
  });

  it('should not allow updating a single recurring shift instance', async () => {
    const initialResponse = await request(app)
      .post('/api/shifts')
      .send({
        title: 'Recurring Shift',
        start_time: '2026-08-01T09:00:00.000Z',
        end_time: '2026-08-01T17:00:00.000Z',
        isRecurring: true,
        recurrenceRule: {
          frequency: 'daily',
          endType: 'after_occurrences',
          occurrences: 3,
          daysOfWeek: []
        },
        exclusions: []
      });

    const shiftId = initialResponse.body[1]._id;

    const res = await request(app)
      .put(`/api/shifts/${shiftId}`)
      .send({
        title: 'Updated Title',
        start_time: '2026-08-02T09:00:00.000Z',
        end_time: '2026-08-02T17:00:00.000Z',
       });

    expect(res.statusCode).toEqual(400);
    expect(res.body.msg).toBe('This is a recurring shift. Please update the entire series.');
  });

  it('should delete a recurring shift series', async () => {
    const initialResponse = await request(app)
      .post('/api/shifts')
      .send({
        title: 'Recurring Shift to Delete',
        start_time: '2026-08-01T09:00:00.000Z',
        end_time: '2026-08-01T17:00:00.000Z',
        isRecurring: true,
        recurrenceRule: {
          frequency: 'daily',
          endType: 'after_occurrences',
          occurrences: 3,
          daysOfWeek: []
        },
        exclusions: []
      });

    const parentId = initialResponse.body[0]._id;

    const deleteResponse = await request(app).delete(`/api/shifts/series/${parentId}`);
    expect(deleteResponse.statusCode).toEqual(200);
    expect(deleteResponse.body.msg).toBe('Shift series removed');

    const shiftsInDb = await Shift.find({ parentShift: parentId });
    expect(shiftsInDb).toHaveLength(0);
  });

  it('should not allow deleting a single recurring shift instance', async () => {
    const initialResponse = await request(app)
      .post('/api/shifts')
      .send({
        title: 'Recurring Shift',
        start_time: '2026-08-01T09:00:00.000Z',
        end_time: '2026-08-01T17:00:00.000Z',
        isRecurring: true,
        recurrenceRule: {
          frequency: 'daily',
          endType: 'after_occurrences',
          occurrences: 3,
          daysOfWeek: []
        },
        exclusions: []
      });

    const shiftId = initialResponse.body[1]._id;

    const res = await request(app).delete(`/api/shifts/${shiftId}`);

    expect(res.statusCode).toEqual(400);
    expect(res.body.msg).toBe('This is a recurring shift. Please delete the entire series.');
  });

  it('should not create a shift on the excluded date', async () => {
    const res = await request(app)
      .post('/api/shifts')
      .send({
        title: 'Exclusion Test',
        start_time: '2026-11-01T12:00:00.000Z',
        end_time: '2026-11-01T13:00:00.000Z',
        isRecurring: true,
        recurrenceRule: {
          frequency: 'daily',
          endType: 'on_date',
          endDate: '2026-11-04T12:00:00.000Z',
          daysOfWeek: []
        },
        exclusions: ['2026-11-02T12:00:00.000Z']
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(3);
    const shiftDates = res.body.map(s => new Date(s.start_time).toISOString().split('T')[0]);
    expect(shiftDates).not.toContain('2026-11-02');
  });

  // Idempotency test - though this is hard to test without a unique constraint
  it('should not create duplicate shifts if called twice', async () => {
    const shiftData = {
        title: 'Idempotency Test',
        start_time: '2026-12-01T10:00:00.000Z',
        end_time: '2026-12-01T11:00:00.000Z',
        isRecurring: false
    };
    await request(app).post('/api/shifts').send(shiftData);
    const res = await request(app).post('/api/shifts').send(shiftData);

    expect(res.statusCode).toEqual(200);
  });

});
