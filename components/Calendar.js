'use client';

import React, { useState, useContext, useMemo, useEffect, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button, Box } from '@mui/material';
import axios from 'axios';
import ShiftModal from '@/components/ShiftModal';
import ShiftFormModal from '@/components/ShiftFormModal';
import { ShiftContext } from '@/context/ShiftContext';
import { AuthContext } from '@/context/AuthContext';
import { fromNaiveUTC } from '@/utils/dateUtils';

const Calendar = () => {
  const { shifts, fetchShifts } = useContext(ShiftContext);
  const { user } = useContext(AuthContext);
  const [selectedShift, setSelectedShift] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editShift, setEditShift] = useState(null);
  const calendarRef = useRef(null);
  const [calendarHeight, setCalendarHeight] = useState(600);
  const [headerColor, setHeaderColor] = useState('#1976d2');

  const updateHeight = useCallback(() => {
    const offset = calendarRef.current?.getBoundingClientRect().top || 0;
    setCalendarHeight(Math.min(window.innerHeight - offset - 16, 900));
  }, []);

  useEffect(() => {
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [updateHeight]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings');
        if (res.data.headerColor) setHeaderColor(res.data.headerColor);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const styleId = 'fc-today-highlight';
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = `.fc-day-today { background-color: ${headerColor}1A !important; }`;
    return () => { if (style.parentNode) style.parentNode.removeChild(style); };
  }, [headerColor]);

  const formattedShifts = useMemo(() => shifts.map(shift => ({
    title: shift.title,
    start: fromNaiveUTC(shift.start_time),
    end: fromNaiveUTC(shift.end_time),
    id: shift._id,
    extendedProps: {
      ...shift
    }
  })), [shifts]);

  const handleShiftClick = (clickInfo) => {
    if (!user) return;
    setSelectedShift(clickInfo.event.extendedProps);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedShift(null);
    fetchShifts();
  };

  const handleCreateShift = () => {
    setEditShift(null);
    setFormModalOpen(true);
  };

  const handleEditShift = (shift) => {
    setSelectedShift(null);
    setModalOpen(false);
    setEditShift(shift);
    setFormModalOpen(true);
  };

  const handleFormModalClose = () => {
    setFormModalOpen(false);
    setEditShift(null);
    fetchShifts();
  };

  return (
    <>
      {user && user.role !== 'viewer' && (
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" color="primary" onClick={handleCreateShift}>
            Add Shift
          </Button>
        </Box>
      )}
      <div ref={calendarRef}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height={calendarHeight}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek'
        }}
        events={formattedShifts}
        eventClick={handleShiftClick}
        showNonCurrentDates={false}
        fixedWeekCount={false}
      />
      </div>
      <ShiftModal
        open={modalOpen}
        handleClose={handleModalClose}
        shift={selectedShift}
        onEdit={handleEditShift}
      />
      <ShiftFormModal
        open={formModalOpen}
        handleClose={handleFormModalClose}
        currentShift={editShift}
        onSave={fetchShifts}
      />
    </>
  );
};

export default Calendar;
