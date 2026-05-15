import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDessert } from '../redux/dataSlice';
import MenuSection from "./MenuSection";

const API_URL = process.env.REACT_APP_API_URL || '';

const Dessert = () => {
    const dispatch = useDispatch();
    const sections = useSelector(state => state.data.dessert) || [];

    useEffect(() => {
        if (sections.length > 0) return;
        fetch(`${API_URL}/api/menu/dessert`)
            .then(res => res.json())
            .then(data => dispatch(setDessert(data)))
            .catch(console.error);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div>
            {sections.map(i => <MenuSection key={i.titleEn} item={i} direct={'column'}/>)}
        </div>
    );
};

export default Dessert;
