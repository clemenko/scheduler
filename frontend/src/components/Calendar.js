import React, { useState, useContext, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import EventModal from './EventModal';
import { EventContext } from '../context/EventContext';

const Calendar = () => {
  const { events, fetchEvents } = useContext(EventContext);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const formattedEvents = useMemo(() => events.map(event => ({
    title: event.title,
    start: new Date(event.start_time),
    end: new Date(event.end_time),
    id: event._id,
    extendedProps: {
      ...event
    }
  })), [events]);

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event.extendedProps);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedEvent(null);
    fetchEvents(); // Refetch events from context after modal closes
  };

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: '',
          center: 'title',
          right: ''
        }}
        validRange={{
          start: startOfMonth,
          end: endOfMonth
        }}
        events={formattedEvents}
        eventClick={handleEventClick}
        showNonCurrentDates={false}
        fixedWeekCount={false}
      />
      <EventModal
        open={modalOpen}
        handleClose={handleModalClose}
        event={selectedEvent}
      />
    </>
  );
};

export default Calendar;
