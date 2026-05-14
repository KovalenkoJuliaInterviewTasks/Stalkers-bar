import { useState, useEffect } from 'react';
import MenuSection from "./MenuSection";

const API_URL = process.env.REACT_APP_API_URL || '';

const Dessert = () => {
    const [sections, setSections] = useState([]);

    useEffect(() => {
        fetch(`${API_URL}/api/menu/dessert`)
            .then(res => res.json())
            .then(data => setSections(data))
            .catch(console.error);
    }, []);

    return (
        <div>
            {sections.map(i => <MenuSection key={i.titleEn} item={i} direct={'column'}/>)}
        </div>
    );
};

export default Dessert;
