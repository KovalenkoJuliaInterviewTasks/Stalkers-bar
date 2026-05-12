import React, {useState} from 'react';
import {events} from "../utils/temporaryConstants";
import Event from "./Event";
import EventDetails from "./EventDetails";

const Events = () =>
{
    const [selectedEventIndex, setSelectedEventIndex] = useState(-1);
    const handleCardClick = (id) => {
        setSelectedEventIndex(id);
    };
    const handleBackClick = () => {
        setSelectedEventIndex(-1);
    };
    return (
        <div>
        {selectedEventIndex > -1 ?
            (<EventDetails event={events[selectedEventIndex]} onBack={handleBackClick}/>)
            :
            (<div style={{height: "100%", display: "flex", flexWrap: "wrap", justifyContent: "space-evenly"}}>
                {events.map((i, index) => <Event key={index} event={i} details={handleCardClick} index={index}/>)}
            </div>)}
        </div>);
};

export default Events;