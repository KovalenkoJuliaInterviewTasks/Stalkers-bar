import { useState, useEffect } from 'react';
import AlbumDetails from "./AlbumDetails";
import Album from "./Album";

const API_URL = process.env.REACT_APP_API_URL || '';

const Gallery = () => {
    const [albums, setAlbums] = useState([]);
    const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(-1);

    useEffect(() => {
        fetch(`${API_URL}/api/albums`)
            .then(res => res.json())
            .then(data => setAlbums(data))
            .catch(console.error);
    }, []);

    const handleCardClick = (id) => setSelectedAlbumIndex(id);
    const handleBackClick = () => setSelectedAlbumIndex(-1);

    return (
        <div>
            {selectedAlbumIndex > -1 ?
                (<AlbumDetails photos={albums[selectedAlbumIndex].items} onBack={handleBackClick}/>)
                :
                (<div style={{height: "100%", display: "flex", flexWrap: "wrap", justifyContent: "space-evenly"}}>
                    {albums.map((i, index) => <Album key={index} album={i} details={handleCardClick} index={index}/>)}
                </div>)}
        </div>
    );
};

export default Gallery;
