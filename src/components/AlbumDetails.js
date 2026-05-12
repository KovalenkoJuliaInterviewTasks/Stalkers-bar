import React from 'react';
import Slider from "react-slick";
import { Box, IconButton } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
const AlbumDetails = ({photos, onBack}) => {
    const settings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        autoplay: true,
        autoplaySpeed: 3000
    };

    const sliderRef = React.useRef(null);

    return (
        <Box sx={{ position: "relative", width: "70%", margin: "auto", textAlign: "center"}}>
            <button onClick={onBack} style={{position: "absolute", top: 0, right: 0, background: "transparent", fontSize: "2vw", color: "white", zIndex: 3}}>X</button>
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
                    <Box key={index} sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
                    }}>
                        <img
                            src={`/images/${photo}`}
                            alt={`${index + 1}`}
                            style={{
                                height: "400px",
                                width: "auto",
                                maxWidth: "100%",
                                objectFit: "contain",
                                borderRadius: "10px",
                                margin: "auto"
                            }}
                        />
                    </Box>
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