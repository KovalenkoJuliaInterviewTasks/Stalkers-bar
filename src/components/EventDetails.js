import React from 'react';
import {Card, CardMedia, CardContent, Typography, Box} from "@mui/material";
import {useSelector} from "react-redux";
import {eventEn, eventHE, eventRu} from "../utils/constants";

const EventDetails = ({event, onBack}) => {
    const lang = useSelector(state => state.lang.lang);

    const getDesc = event => {
        switch (lang) {
            case 'EN': return event.descEn;
            case 'RU': return event.descRu;
            case 'HE': return event.descHe;
            default: return event.descRu;
        }
    }
    const getEventInfo = () => {
        switch (lang) {
            case 'EN': return eventEn;
            case 'RU': return eventRu;
            case 'HE': return eventHE;
            default: return eventRu;
        }
    }
    const getLocale = () => {
        switch (lang) {
            case 'EN': return 'en-US';
            case 'RU': return 'ru-RU';
            case 'HE': return 'he-IL';
            default: return 'ru-RU';
        }
    }

    const getOpen = () => {
        switch (lang) {
            case 'EN': return 'Doors Open: ';
            case 'RU': return 'Открытие дверей: ';
            case 'HE': return 'פתיחת דלתות בשעה: ';
            default: return 'Открытие дверей: ';
        }
    }
    const getStart = () => {
        switch (lang) {
            case 'EN': return 'Concert Starts: ';
            case 'RU': return 'Начало концерта: ';
            case 'HE': return 'תחילת המופע בשעה: ';
            default: return 'Начало концерта: ';
        }
    }
    const getPrice = (price) => {
        switch (lang) {
            case 'EN': return `Ticket Price: ${price} ₪ – Cash payment at the entrance.`;
            case 'RU': return `Цена билета ${price} ₪ - оплата на входе наличными.`;
            case 'HE': return `מחיר כרטיס - ${price} ₪, תשלום במזומן בכניסה.`;
            default: return `Цена билета ${price} ₪ - оплата на входе наличными.`;
        }
    }

    const formatDate = (isoDate) => {
        return new Date(isoDate).toLocaleDateString(getLocale(), {
            day: 'numeric', month: 'long', year: 'numeric',
        });
    }

    return (<Card sx={{
        width: "70%",
        margin: "auto",
        boxShadow: 3,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: 2,
        background: "linear-gradient(180deg, #2a2a2a 30%, #444444 80%)",
        position: "relative"
    }} dir={lang === 'HE' ? 'rtl' : 'ltr'}>
        <button onClick={onBack} style={{position: "absolute", top: 0, right: 0, background: "transparent", fontSize: "2vw", color: "white"}}>X</button>
        <CardMedia component="img" image={`/images/${event.image}`} alt={event.title}
            sx={{
                width: "60%",
                height: "auto",
                objectFit: "contain"
            }}
        />
        <CardContent  sx={{textAlign: "center", backgroundColor: "transparent", color: "white", fontSize: { xs: "1rem", md: "1.5rem", lg: "2rem" }}}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
                {event.title}
            </Typography>
            <Typography variant="body1" fontWeight="bold" gutterBottom sx={{whiteSpace: 'pre-line'}}>
                {getDesc(event)}
            </Typography>
            <Box >
                <Typography variant="body1">📅 {formatDate(event.date)}</Typography>
                <Typography variant="body1">🕗 {`${getOpen()} ${event.open}`}</Typography>
                <Typography variant="body1">🎸 {`${getStart()} ${event.start}`}</Typography>
                <Typography variant="body1">💰 {getPrice(event.price)}</Typography>
            </Box>
            <Typography
                variant="body1"
                sx={{mt: 2, fontStyle: "italic", whiteSpace: "pre-line"}}
            >
                {getEventInfo()}
            </Typography>
        </CardContent>
    </Card>);
};
export default EventDetails;