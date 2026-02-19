import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../context/AuthContext';
import Admin from './Admin';
import axios from 'axios';

jest.mock('axios');

// Mock child panels to isolate Admin tab behaviour
jest.mock('./SettingsManagement', () => () => <div>Settings Panel</div>);
jest.mock('./UserManagement', () => () => <div>User Management Panel</div>);
jest.mock('./VehicleManagement', () => () => <div>Vehicles Panel</div>);
jest.mock('./ShiftManagement', () => () => <div>Shifts Panel</div>);

const adminUser = { id: 'admin1', name: 'Admin', role: 'admin' };

function renderAdmin() {
  return render(
    <AuthContext.Provider value={{ user: adminUser }}>
      <Admin />
    </AuthContext.Provider>
  );
}

describe('Admin', () => {
  it('renders the Admin Dashboard heading', () => {
    renderAdmin();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('renders all four tabs', () => {
    renderAdmin();
    expect(screen.getByRole('tab', { name: /Settings/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /User Management/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Vehicles/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Shifts/i })).toBeInTheDocument();
  });

  it('shows the Settings panel by default', () => {
    renderAdmin();
    expect(screen.getByText('Settings Panel')).toBeInTheDocument();
  });

  it('shows the User Management panel when that tab is clicked', async () => {
    renderAdmin();
    await userEvent.click(screen.getByRole('tab', { name: /User Management/i }));
    expect(screen.getByText('User Management Panel')).toBeInTheDocument();
  });

  it('shows the Vehicles panel when that tab is clicked', async () => {
    renderAdmin();
    await userEvent.click(screen.getByRole('tab', { name: /Vehicles/i }));
    expect(screen.getByText('Vehicles Panel')).toBeInTheDocument();
  });

  it('shows the Shifts panel when that tab is clicked', async () => {
    renderAdmin();
    await userEvent.click(screen.getByRole('tab', { name: /Shifts/i }));
    expect(screen.getByText('Shifts Panel')).toBeInTheDocument();
  });
});
