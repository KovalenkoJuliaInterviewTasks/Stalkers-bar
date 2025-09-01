import React, {useState} from 'react';
import AlbumDetails from "./AlbumDetails";
import Album from "./Album";
import {albums} from "../utils/temporaryConstants";

const Gallery = () =>
{
    const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(-1);
    const handleCardClick = (id) => {
        setSelectedAlbumIndex(id);
    };
    const handleBackClick = () => {
        setSelectedAlbumIndex(-1);
    };
    return (
        <div>
            {selectedAlbumIndex > -1 ?
                (<AlbumDetails photos={albums[selectedAlbumIndex].items} onBack={handleBackClick}/>)
                :
                (<div style={{height: "100%", display: "flex", flexWrap: "wrap", justifyContent: "space-evenly"}}>
                    {albums.map((i, index) => <Album key={index} album={i} details={handleCardClick} index={index}/>)}
                </div>)}
        </div>);
};

export default Gallery;