import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAlbums } from '../redux/dataSlice';
import AlbumDetails from "./AlbumDetails";
import Album from "./Album";

const API_URL = process.env.REACT_APP_API_URL || '';

const Gallery = () => {
    const dispatch = useDispatch();
    const albums = useSelector(state => state.data.albums) || [];
    const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(-1);

    useEffect(() => {
        if (albums.length > 0) return;
        fetch(`${API_URL}/api/albums`)
            .then(res => res.json())
            .then(data => dispatch(setAlbums(data)))
            .catch(console.error);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
