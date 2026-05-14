import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setBar } from '../redux/dataSlice';
import MenuSection from "./MenuSection";

const API_URL = process.env.REACT_APP_API_URL || '';

const Bar = () => {
    const dispatch = useDispatch();
    const sections = useSelector(state => state.data.bar) || [];

    useEffect(() => {
        if (sections.length > 0) return;
        fetch(`${API_URL}/api/menu/bar`)
            .then(res => res.json())
            .then(data => dispatch(setBar(data)))
            .catch(console.error);
    }, []);

    return (
        <div>
            {sections.map(i => <MenuSection key={i.titleEn} item={i}/>)}
        </div>
    );
};

export default Bar;
