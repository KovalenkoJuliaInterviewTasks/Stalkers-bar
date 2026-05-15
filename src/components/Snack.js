import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFood } from '../redux/dataSlice';
import MenuSection from "./MenuSection";

const API_URL = process.env.REACT_APP_API_URL || '';

const Snack = () => {
    const dispatch = useDispatch();
    const sections = useSelector(state => state.data.food) || [];

    useEffect(() => {
        if (sections.length > 0) return;
        fetch(`${API_URL}/api/menu/food`)
            .then(res => res.json())
            .then(data => dispatch(setFood(data)))
            .catch(console.error);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div>
            {sections.map(i => <MenuSection key={i.titleEn} item={i} direct={'column'}/>)}
        </div>
    );
};

export default Snack;
