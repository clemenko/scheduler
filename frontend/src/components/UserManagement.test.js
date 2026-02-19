import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../context/AuthContext';
import UserManagement from './UserManagement';
import axios from 'axios';

jest.mock('axios');

const currentUser = { id: 'admin1', name: 'Admin', role: 'admin' };

const users = [
  { _id: 'admin1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
  { _id: 'user2', name: 'Regular User', email: 'user@example.com', role: 'viewer' },
];

function renderComponent(showSnackbar = jest.fn()) {
  axios.get.mockResolvedValue({ data: users });
  return render(
    <AuthContext.Provider value={{ user: currentUser }}>
      <UserManagement showSnackbar={showSnackbar} />
    </AuthContext.Provider>
  );
}

describe('UserManagement', () => {
  it('fetches and displays users on mount', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Regular User')).toBeInTheDocument();
    });
  });

  it('displays user emails', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });
  });

  it('renders the Add User button', async () => {
    renderComponent();
    expect(screen.getByRole('button', { name: /Add User/i })).toBeInTheDocument();
  });

  it('opens the user form modal when Add User is clicked', async () => {
    renderComponent();
    await userEvent.click(screen.getByRole('button', { name: /Add User/i }));
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });

  it('disables delete and role controls for the current user', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Admin User')).toBeInTheDocument());

    const resetButtons = screen.getAllByRole('button', { name: /Reset Password/i });
    // Delete icon buttons: current user row should be disabled
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    const adminDeleteBtn = deleteButtons.find(btn => btn.closest('tr')?.textContent.includes('Admin User'));
    expect(adminDeleteBtn).toBeDisabled();

    // Reset password button is not disabled for other users
    expect(resetButtons[1]).not.toBeDisabled();
  });

  it('calls showSnackbar with success after deleting a user', async () => {
    const showSnackbar = jest.fn();
    axios.get.mockResolvedValue({ data: users });
    axios.delete.mockResolvedValue({});

    render(
      <AuthContext.Provider value={{ user: currentUser }}>
        <UserManagement showSnackbar={showSnackbar} />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(screen.getByText('Regular User')).toBeInTheDocument());

    // Re-mock get for the refetch after delete
    axios.get.mockResolvedValue({ data: [users[0]] });

    const deleteButtons = screen.getAllByRole('button', { name: '' });
    const viewerDeleteBtn = deleteButtons.find(btn => btn.closest('tr')?.textContent.includes('Regular User'));
    await userEvent.click(viewerDeleteBtn);

    await waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith('User deleted successfully.', 'success');
    });
  });
});
