import React from 'react';
import styles from '../styles/Menu.module.css'
import {navMenuItemsArray} from "../utils/constants";
import {useDispatch, useSelector} from "react-redux";
import {changeMenuNavItem} from "../redux/menuSlice";
import Bar from "./Bar";
import Snack from "./Snack";


const Menu = () =>
{
    const lang = useSelector(state => state.lang.lang);
    const menuItem = useSelector(state => state.menu.item);
    const dispatch = useDispatch();

    const getLable = item =>{
        switch (lang){
            case 'EN': return item.titleEn;
            case 'RU': return item.titleRu;
            case 'HE': return item.titleHe;
            default: return item.titleRu;
        }
    }
    const renderContent = () => {
        switch (menuItem) {
            case navMenuItemsArray[0].route:
                return <Bar/>;
            case navMenuItemsArray[1].route:
                return <Snack/>;
            default: return <Bar/>;
         }
    };
    return (
        <div className={`${styles.menu}`}>
            <div className={`${styles.navigate}`}>
                <ul style={{display: 'flex', flexDirection: 'row'}}>
                    {navMenuItemsArray.map(i => <li className={`nav-item mx-1 border border-dark rounded-pill btn flex-column`}
                              key={i.route} onClick={() =>dispatch(changeMenuNavItem(i.route))} >{getLable(i)}</li>)}
                </ul>
            </div>
            <div className={`${styles.main}`}>
                {renderContent()}
            </div>
        </div>);
};

export default Menu;