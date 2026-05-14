import React, { useState } from 'react';
import { getImageUrl } from '../utils/imageUrl';
import Slider from "react-slick";
import { Box, IconButton, useMediaQuery } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const SlideImage = ({ photo, index }) => {
    const [portrait, setPortrait] = useState(false);
    const isMobile = useMediaQuery('(max-width:768px)');

    const imgStyle = (isMobile && portrait)
        ? { width: "100%", height: "auto", maxWidth: "100%" }
        : { width: "auto", height: "auto", maxWidth: "100%", maxHeight: "65vh" };

    return (
        <img
            src={getImageUrl(photo)}
            alt={`${index + 1}`}
            onLoad={(e) => setPortrait(e.target.naturalHeight > e.target.naturalWidth)}
            style={{
                ...imgStyle,
                objectFit: "contain",
                borderRadius: "10px",
                display: "block",
                margin: "auto"
            }}
        />
    );
};

const AlbumDetails = ({photos, onBack}) => {
    const isMobile = useMediaQuery('(max-width:768px)');

    const settings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        autoplay: true,
        autoplaySpeed: 3000,
        adaptiveHeight: isMobile,
    };

    const sliderRef = React.useRef(null);

    return (
        <Box sx={{
            position: "relative",
            width: { xs: "96%", sm: "80%", md: "70%" },
            margin: "auto",
            textAlign: "center",
            '& .slick-list': { transition: 'height 0.3s ease' },
            '& .slick-slide > div': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            },
            '@media (min-width: 769px)': {
                '& .slick-list': { height: '65vh !important', transition: 'none' },
                '& .slick-track': { height: '100%' },
                '& .slick-slide': { height: '100%' },
                '& .slick-slide > div': { height: '100%' },
            }
        }}>
            <button onClick={onBack} style={{position: "absolute", top: 0, right: 0, background: "transparent", fontSize: "clamp(14px, 2vw, 24px)", color: "white", zIndex: 3}}>X</button>
            <IconButton
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: 10,
                    transform: "translateY(-50%)",
                    color: "white",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    zIndex: 2,
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" }
                }}
                onClick={() => sliderRef.current.slickPrev()}
            >
                <ArrowBackIos />
            </IconButton>

            <Slider ref={sliderRef} {...settings}>
                {photos.map((photo, index) => (
                    <div key={index}>
                        <SlideImage photo={photo} index={index} />
                    </div>
                ))}
            </Slider>

            <IconButton
                sx={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", color: "white", backgroundColor: "rgba(0,0,0,0.5)" }}
                onClick={() => sliderRef.current.slickNext()}
            >
                <ArrowForwardIos />
            </IconButton>
        </Box>
    );
};

export default AlbumDetails;
