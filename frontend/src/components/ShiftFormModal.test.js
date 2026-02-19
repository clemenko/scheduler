import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ShiftFormModal from './ShiftFormModal';
import axios from 'axios';

jest.mock('axios');

function renderModal(props = {}) {
  return render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ShiftFormModal open={true} handleClose={jest.fn()} onSave={jest.fn()} {...props} />
    </LocalizationProvider>
  );
}

describe('ShiftFormModal', () => {
  it('renders "Add Shift" heading when no currentShift', () => {
    renderModal();
    expect(screen.getByRole('heading', { name: 'Add Shift' })).toBeInTheDocument();
  });

  it('renders "Edit Shift" heading when currentShift is provided', () => {
    const currentShift = {
      _id: 'shift1',
      title: 'Morning Shift',
      start_time: '2026-09-01T09:00:00.000Z',
      end_time: '2026-09-01T17:00:00.000Z',
      isRecurring: false,
    };
    renderModal({ currentShift });
    expect(screen.getByRole('heading', { name: 'Edit Shift' })).toBeInTheDocument();
  });

  it('pre-fills the title field when editing', () => {
    const currentShift = {
      _id: 'shift1',
      title: 'Existing Shift',
      start_time: '2026-09-01T09:00:00.000Z',
      end_time: '2026-09-01T17:00:00.000Z',
      isRecurring: false,
    };
    renderModal({ currentShift });
    expect(screen.getByDisplayValue('Existing Shift')).toBeInTheDocument();
  });

  it('shows recurrence options when Recurring Shift checkbox is checked', async () => {
    renderModal();
    const checkbox = screen.getByRole('checkbox', { name: /Recurring Shift/i });
    await userEvent.click(checkbox);
    expect(screen.getByText('End Condition')).toBeInTheDocument();
  });

  it('hides recurrence options when Recurring Shift checkbox is unchecked', () => {
    renderModal();
    expect(screen.queryByText('End Condition')).not.toBeInTheDocument();
  });

  it('shows a validation error when on_date end type has no end date', async () => {
    renderModal();

    await userEvent.click(screen.getByRole('checkbox', { name: /Recurring Shift/i }));

    // Submit without setting an end date (default endType is 'on_date', endDate is null)
    fireEvent.submit(screen.getByRole('button', { name: /Add Shift/i }).closest('form'));

    await waitFor(() => {
      expect(screen.getByText(/Please select an end date/i)).toBeInTheDocument();
    });
  });

  it('renders day-of-week checkboxes when frequency is weekly', async () => {
    renderModal();
    await userEvent.click(screen.getByRole('checkbox', { name: /Recurring Shift/i }));
    // Default frequency is weekly — day checkboxes should be visible
    expect(screen.getByRole('checkbox', { name: 'MO' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'FR' })).toBeInTheDocument();
  });

  it('calls onSave and handleClose on successful submission', async () => {
    const onSave = jest.fn();
    const handleClose = jest.fn();
    axios.post.mockResolvedValue({ data: {} });

    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <ShiftFormModal open={true} handleClose={handleClose} onSave={onSave} />
      </LocalizationProvider>
    );

    await userEvent.type(screen.getByLabelText(/Title/i), 'New Shift');

    // Uncheck recurring to avoid end date validation
    const checkbox = screen.getByRole('checkbox', { name: /Recurring Shift/i });
    expect(checkbox).not.toBeChecked();

    fireEvent.submit(screen.getByRole('button', { name: /Add Shift/i }).closest('form'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/shifts',
        expect.objectContaining({ title: 'New Shift', isRecurring: false }),
        expect.any(Object)
      );
      expect(onSave).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
