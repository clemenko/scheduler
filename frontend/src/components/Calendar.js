import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import EventModal from './EventModal';

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await axios.get('/api/events');
      const formattedEvents = res.data.map(event => ({
        title: event.title,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        id: event._id,
        extendedProps: {
          ...event
        }
      }));
      setEvents(formattedEvents);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event.extendedProps);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedEvent(null);
    fetchEvents();
  };

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

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
        events={events}
        eventClick={handleEventClick}
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
