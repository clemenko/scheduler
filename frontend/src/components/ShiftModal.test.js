import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthContext } from '../context/AuthContext';
import ShiftModal from './ShiftModal';
import axios from 'axios';

jest.mock('axios');

const adminUser = { id: 'admin1', name: 'Admin', role: 'admin' };
const viewerUser = { id: 'viewer1', name: 'Viewer', role: 'viewer' };

const shift = {
  _id: 'shift1',
  title: 'Morning Shift',
  start_time: '2026-09-01T09:00:00.000Z',
  end_time: '2026-09-01T17:00:00.000Z',
  signups: [
    { _id: 'signup1', user: { _id: 'user1', name: 'Alice' }, vehicle: { name: 'Engine 1' } },
    { _id: 'signup2', user: { _id: 'viewer1', name: 'Bob' }, vehicle: { name: 'Ladder 2' } },
  ],
};

const vehicles = [
  { _id: 'v1', name: 'Engine 1' },
  { _id: 'v2', name: 'Ladder 2' },
];

function renderModal(user, props = {}) {
  axios.get.mockResolvedValue({ data: vehicles });
  return render(
    <AuthContext.Provider value={{ user }}>
      <ShiftModal open={true} handleClose={jest.fn()} shift={shift} {...props} />
    </AuthContext.Provider>
  );
}

describe('ShiftModal', () => {
  it('renders shift title and times', () => {
    renderModal(viewerUser);
    expect(screen.getByText('Morning Shift')).toBeInTheDocument();
  });

  it('renders the list of signups', () => {
    renderModal(viewerUser);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  it('shows Delete button for admin on all signups', () => {
    renderModal(adminUser);
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    expect(deleteButtons).toHaveLength(2);
  });

  it('shows Delete button only for the current users own signup', () => {
    renderModal(viewerUser);
    // viewerUser.id === 'viewer1' matches signup2 (Bob / viewer1)
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    expect(deleteButtons).toHaveLength(1);
  });

  it('shows "No one has signed up" message when signups is empty', () => {
    axios.get.mockResolvedValue({ data: vehicles });
    render(
      <AuthContext.Provider value={{ user: viewerUser }}>
        <ShiftModal open={true} handleClose={jest.fn()} shift={{ ...shift, signups: [] }} />
      </AuthContext.Provider>
    );
    expect(screen.getByText(/No one has signed up/i)).toBeInTheDocument();
  });

  it('renders the Sign Up button', () => {
    renderModal(viewerUser);
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });
});
