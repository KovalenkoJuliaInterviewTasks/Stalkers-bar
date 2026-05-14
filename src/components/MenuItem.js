import React from 'react';
import {Card, CardContent, CardMedia, Typography} from "@mui/material";
import {useTranslation} from '../utils/useTranslation';

const MenuItem = ({item, layout}) => {
    const {getLabel, getDesc} = useTranslation();
    const isRow = layout === 'row';

    return (
        <Card sx={{
            margin: 1,
            width: { xs: "44vw", sm: "40vw", md: "30vw" },
            display: "flex",
            flexDirection: isRow ? "row" : "column",
            alignItems: "center",
            backgroundColor: '#2C2C2C'
        }}>
            <CardMedia
                sx={isRow
                    ? { width: "40%", height: "100%", minHeight: { xs: "25vw", md: "15vw" } }
                    : { width: "100%", height: { xs: "30vw", sm: "25vw", md: "20vw" } }
                }
                image={`/images/${item.image}`}
            />
            <CardContent sx={{
                textAlign: 'center',
                backgroundColor: '#2C2C2C',
                color: "white",
                padding: 0,
                width: isRow ? "60%" : "100%"
            }}>
                <Typography gutterBottom sx={{ fontSize: 'clamp(11px, 3vw, 26px)' }}>
                    {getLabel(item)}
                </Typography>
                <Typography color='text.secondary' sx={{ fontSize: 'clamp(10px, 2.5vw, 22px)', color: "white" }}>
                    {getDesc(item)}
                </Typography>
                {item.cost1 && (
                    <Typography color='text.secondary' sx={{ fontSize: 'clamp(10px, 2.5vw, 22px)', fontWeight: 'bold', color: "white" }}>
                        {item.cap1}&nbsp;&nbsp;&nbsp;{item.cost1} ₪
                    </Typography>
                )}
                {item.cost2 && (
                    <Typography color='text.secondary' sx={{ fontSize: 'clamp(10px, 2.5vw, 22px)', fontWeight: 'bold', color: "white" }}>
                        {item.cap2}&nbsp;&nbsp;&nbsp;{item.cost2} ₪
                    </Typography>
                )}
                {item.cost && (
                    <Typography color='text.secondary' sx={{ fontSize: 'clamp(10px, 2.5vw, 22px)', fontWeight: 'bold', color: "white" }}>
                        {item.cap}&nbsp;&nbsp;&nbsp;{item.cost} ₪
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default MenuItem;
