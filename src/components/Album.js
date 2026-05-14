import React from 'react';
import { getImageUrl } from '../utils/imageUrl';
import {Card, CardContent, CardMedia, Typography} from "@mui/material";
import {useTranslation} from '../utils/useTranslation';

const Album = ({album, details, index}) => {
    const {lang, getLabel, formatDate} = useTranslation();
    return (
        <Card sx={{
            width: { xs: "90%", sm: "45%", md: "30%" },
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
            <CardMedia component="img" image={getImageUrl(album.items[0])} alt={getLabel(album)}
                sx={{
                    width: "90%",
                    height: "auto",
                    objectFit: "contain"
                }}
            />
            <CardContent sx={{textAlign: "center", backgroundColor: "transparent", color: "white"}}>
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{
                    fontSize: { xs: "1rem", md: "1.5rem", lg: "2rem" }}}>
                    {getLabel(album)}
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