import {Card, CardMedia, CardContent, Typography, Box} from "@mui/material";
import {eventEn, eventHE, eventRu} from "../utils/constants";
import {useTranslation} from '../utils/useTranslation';

const EventDetails = ({event, onBack}) => {
    const {lang, getDesc, formatDate} = useTranslation();

    const getEventInfo = () => {
        switch (lang) {
            case 'EN': return eventEn;
            case 'RU': return eventRu;
            case 'HE': return eventHE;
            default: return eventRu;
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

    return (<Card sx={{
        width: { xs: "96%", sm: "80%", md: "70%" },
        margin: "auto",
        boxShadow: 3,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: { xs: 1, sm: 2 },
        background: "linear-gradient(180deg, #2a2a2a 30%, #444444 80%)",
        position: "relative"
    }} dir={lang === 'HE' ? 'rtl' : 'ltr'}>
        <button onClick={onBack} style={{position: "absolute", top: 0, right: 0, background: "transparent", fontSize: "clamp(14px, 2vw, 24px)", color: "white"}}>X</button>
        <CardMedia component="img" image={`/images/${event.image}`} alt={event.title}
            sx={{
                width: { xs: "90%", sm: "75%", md: "60%" },
                height: "auto",
                objectFit: "contain"
            }}
        />
        <CardContent sx={{textAlign: "center", backgroundColor: "transparent", color: "white", fontSize: { xs: "0.85rem", sm: "1rem", md: "1.5rem", lg: "2rem" }}}>
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