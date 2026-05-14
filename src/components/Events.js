import { useState, useEffect } from 'react';
import Event from "./Event";
import EventDetails from "./EventDetails";

const API_URL = process.env.REACT_APP_API_URL || '';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [selectedEventIndex, setSelectedEventIndex] = useState(-1);

    useEffect(() => {
        fetch(`${API_URL}/api/events`)
            .then(res => res.json())
            .then(data => setEvents(data))
            .catch(console.error);
    }, []);

    const handleCardClick = (id) => setSelectedEventIndex(id);
    const handleBackClick = () => setSelectedEventIndex(-1);

    return (
        <div>
            {selectedEventIndex > -1 ?
                (<EventDetails event={events[selectedEventIndex]} onBack={handleBackClick}/>)
                :
                (<div style={{height: "100%", display: "flex", flexWrap: "wrap", justifyContent: "space-evenly"}}>
                    {events.map((i, index) => <Event key={index} event={i} details={handleCardClick} index={index}/>)}
                </div>)}
        </div>
    );
};

export default Events;
