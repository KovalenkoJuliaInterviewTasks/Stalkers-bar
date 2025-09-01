import React from 'react';
import {useSelector} from "react-redux";
import {Card, CardContent, CardMedia, Typography} from "@mui/material";

const Album = ({album, details, index}) => {
    const lang = useSelector(state => state.lang.lang);
    const getTitle = album => {
        switch (lang) {
            case 'EN': return album.titleEn;
            case 'RU': return album.titleRu;
            case 'HE': return album.titleHe;
            default: return 'RU';
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
    const formatDate = (isoDate) => {
        return new Date(isoDate).toLocaleDateString(getLocale(), {
            day: 'numeric', month: 'long', year: 'numeric',
        });
    }
    return (
        <Card sx={{
            width: "30%",
            marginBottom: "1em",
            marginTop: "1em",
            boxShadow: 3,
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: 2,
            background: "linear-gradient(180deg, #2a2a2a 30%, #444444 80%)",
            cursor: "pointer"
        }} onClick={() => details(index)}>
            <CardMedia component="img" image={`/images/${album.items[0]}`} alt={getTitle(album)}
                sx={{
                    width: "90%",
                    height: "auto",
                    objectFit: "contain"
                }}
            />
            <CardContent sx={{textAlign: "center", backgroundColor: "transparent", color: "white"}}>
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{
                    fontSize: { xs: "1rem", md: "1.5rem", lg: "2rem" }}}>
                    {getTitle(album)}
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="white" gutterBottom
                            dir={lang === 'HE' ? 'rtl' : 'ltr'} sx={{
                    fontSize: { xs: "1rem", md: "1rem", lg: "1.5rem" }
                }}>
                    {formatDate(album.date)}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default Album;