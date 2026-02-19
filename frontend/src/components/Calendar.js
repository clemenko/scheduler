import React, { useState, useContext, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ShiftModal from './ShiftModal';
import { ShiftContext } from '../context/ShiftContext';

// Convert naive UTC (local wall-clock stored as UTC) back to a local Date for display
const fromNaiveUTC = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
};

const Calendar = () => {
  const { shifts, fetchShifts } = useContext(ShiftContext);
  const [selectedShift, setSelectedShift] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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
    setSelectedShift(clickInfo.event.extendedProps);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedShift(null);
    fetchShifts(); // Refetch shifts from context after modal closes
  };

  const today = new Date();
  const next12Months = new Date(new Date().setMonth(today.getMonth() + 12));

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        validRange={{
          start: today,
          end: next12Months
        }}
        events={formattedShifts}
        eventClick={handleShiftClick}
        showNonCurrentDates={false}
        fixedWeekCount={false}
      />
      <ShiftModal
        open={modalOpen}
        handleClose={handleModalClose}
        shift={selectedShift}
      />
    </>
  );
};

export default Calendar;
