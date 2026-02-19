import React from 'react';
import { render, screen } from '@testing-library/react';
import { ShiftContext } from '../context/ShiftContext';
import { AuthContext } from '../context/AuthContext';
import Calendar from './Calendar';

// Mock FullCalendar component
jest.mock('@fullcalendar/react', () => (props) => {
  return <div data-testid="fullcalendar" data-events={JSON.stringify(props.events)} />;
});

describe('Calendar', () => {
  it('should format and pass shifts to FullCalendar', () => {
    const shifts = [
      {
        _id: '1',
        title: 'Morning Shift',
        start_time: '2026-08-25T09:00:00.000Z',
        end_time: '2026-08-25T17:00:00.000Z',
      },
      {
        _id: '2',
        title: 'Night Shift',
        start_time: '2026-08-26T21:00:00.000Z',
        end_time: '2026-08-27T05:00:00.000Z',
      },
    ];

    const user = { name: 'Test User', role: 'admin' };

    render(
      <AuthContext.Provider value={{ user }}>
        <ShiftContext.Provider value={{ shifts, fetchShifts: jest.fn() }}>
          <Calendar />
        </ShiftContext.Provider>
      </AuthContext.Provider>
    );

    const fullCalendar = screen.getByTestId('fullcalendar');
    const events = JSON.parse(fullCalendar.getAttribute('data-events'));

    expect(events).toHaveLength(2);
    expect(events[0].title).toBe('Morning Shift');
    expect(new Date(events[0].start)).toEqual(new Date('2026-08-25T09:00:00.000Z'));
    expect(new Date(events[0].end)).toEqual(new Date('2026-08-25T17:00:00.000Z'));
  });
});
