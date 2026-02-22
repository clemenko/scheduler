'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, TextField, Checkbox, FormControlLabel, Select, MenuItem, InputLabel, FormControl, FormGroup } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import axios from 'axios';
import { fromNaiveUTC, toNaiveUTC } from '@/utils/dateUtils';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', sm: 500 },
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto'
};

const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

const ShiftFormModal = ({ open, handleClose, currentShift, onSave }) => {
  const [title, setTitle] = useState('');
  const [start_time, setStartTime] = useState(null);
  const [end_time, setEndTime] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [formError, setFormError] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [recurrenceRule, setRecurrenceRule] = useState({
    frequency: 'weekly',
    daysOfWeek: [],
    dayOfMonth: 1,
    endType: 'on_date',
    endDate: null,
    occurrences: 1
  });

  useEffect(() => {
    if (open) {
      const fetchVehicles = async () => {
        try {
          const res = await axios.get('/api/vehicles');
          setVehicles(res.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchVehicles();
    }
  }, [open]);

  useEffect(() => {
    if (currentShift) {
      setTitle(currentShift.title);
      setStartTime(fromNaiveUTC(currentShift.start_time));
      setEndTime(fromNaiveUTC(currentShift.end_time));
      setIsRecurring(currentShift.isRecurring);
      setVehicle(currentShift.vehicle?._id || currentShift.vehicle || '');
      if (currentShift.isRecurring) {
        setRecurrenceRule({
          ...currentShift.recurrenceRule,
          endDate: currentShift.recurrenceRule.endDate
            ? fromNaiveUTC(currentShift.recurrenceRule.endDate)
            : null
        });
      }
    } else {
      setTitle('');
      setStartTime(null);
      setEndTime(null);
      setIsRecurring(false);
      setFormError('');
      setVehicle('');
      setRecurrenceRule({
        frequency: 'weekly',
        daysOfWeek: [],
        dayOfMonth: 1,
        endType: 'on_date',
        endDate: null,
        occurrences: 1
      });
    }
  }, [currentShift]);

  const handleRecurrenceChange = (e) => {
    setRecurrenceRule({ ...recurrenceRule, [e.target.name]: e.target.value });
  };

  const handleDayOfWeekChange = (day) => {
    const newDays = recurrenceRule.daysOfWeek.includes(day)
      ? recurrenceRule.daysOfWeek.filter(d => d !== day)
      : [...recurrenceRule.daysOfWeek, day];
    setRecurrenceRule({ ...recurrenceRule, daysOfWeek: newDays });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (isRecurring && recurrenceRule.endType === 'on_date' && !recurrenceRule.endDate) {
      setFormError('Please select an end date for the recurring shift.');
      return;
    }

    const shiftData = {
      title,
      start_time: toNaiveUTC(start_time),
      end_time: toNaiveUTC(end_time),
      isRecurring,
      recurrenceRule: {
        ...recurrenceRule,
        endDate: recurrenceRule.endDate ? toNaiveUTC(recurrenceRule.endDate) : null
      },
      exclusions: [],
      vehicle: vehicle || undefined
    };

    try {
      if (currentShift) {
        if (isRecurring) {
          await axios.put(`/api/shifts/series/${currentShift.parentShift || currentShift._id}`, shiftData, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
        } else {
          await axios.put(`/api/shifts/${currentShift._id}`, shiftData, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
        }
      } else {
        await axios.post('/api/shifts', shiftData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      onSave();
      document.activeElement?.blur();
      handleClose();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.msg || 'An error occurred while saving the shift.');
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">
          {currentShift ? (isRecurring ? 'Edit Shift Series' : 'Edit Shift') : 'Add Shift'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField label="Title" fullWidth margin="normal" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <DateTimePicker
            label="Start Time"
            value={start_time}
            onChange={(newValue) => setStartTime(newValue)}
            minutesStep={15}
            slotProps={{ textField: { fullWidth: true, margin: 'normal', required: true } }}
          />
          <DateTimePicker
            label="End Time"
            value={end_time}
            onChange={(newValue) => setEndTime(newValue)}
            minutesStep={15}
            slotProps={{ textField: { fullWidth: true, margin: 'normal', required: true } }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Vehicle (Optional)</InputLabel>
            <Select
              value={vehicle}
              label="Vehicle (Optional)"
              onChange={(e) => setVehicle(e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {vehicles.map(v => (
                <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel control={<Checkbox checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />} label="Recurring Shift" />

          {isRecurring && (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>Frequency</InputLabel>
                <Select name="frequency" value={recurrenceRule.frequency} onChange={handleRecurrenceChange}>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>

              {recurrenceRule.frequency === 'weekly' && (
                <FormGroup row>
                  {daysOfWeek.map(day => (
                    <FormControlLabel
                      key={day}
                      control={<Checkbox checked={recurrenceRule.daysOfWeek.includes(day)} onChange={() => handleDayOfWeekChange(day)} />}
                      label={day}
                    />
                  ))}
                </FormGroup>
              )}

              {recurrenceRule.frequency === 'monthly' && (
                <TextField label="Day of Month" type="number" name="dayOfMonth" value={recurrenceRule.dayOfMonth} onChange={handleRecurrenceChange} fullWidth margin="normal" />
              )}

              <FormControl fullWidth margin="normal">
                <InputLabel>End Condition</InputLabel>
                <Select name="endType" value={recurrenceRule.endType} onChange={handleRecurrenceChange}>
                  <MenuItem value="never">Never</MenuItem>
                  <MenuItem value="on_date">On Date</MenuItem>
                  <MenuItem value="after_occurrences">After Occurrences</MenuItem>
                </Select>
              </FormControl>

              {recurrenceRule.endType === 'on_date' && (
                <DateTimePicker
                  label="End Date"
                  value={recurrenceRule.endDate ? new Date(recurrenceRule.endDate) : null}
                  onChange={(newValue) => handleRecurrenceChange({ target: { name: 'endDate', value: newValue } })}
                  minutesStep={15}
                  slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                />
              )}

              {recurrenceRule.endType === 'after_occurrences' && (
                <TextField label="Occurrences" type="number" name="occurrences" value={recurrenceRule.occurrences} onChange={handleRecurrenceChange} fullWidth margin="normal" />
              )}
            </>
          )}

          {formError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {formError}
            </Typography>
          )}

          <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
            {currentShift ? 'Update Shift' : 'Add Shift'}
          </Button>
        </form>
      </Box>
    </Modal>
  );
};

export default ShiftFormModal;
