import React from 'react';
import styles from '../styles/Menu.module.css'
import {navMenuItemsArray} from "../utils/constants";
import {useDispatch, useSelector} from "react-redux";
import {changeMenuNavItem} from "../redux/menuSlice";
import Bar from "./Bar";
import Snack from "./Snack";
import Dessert from "./Dessert";
import {useTranslation} from '../utils/useTranslation';


const Menu = () =>
{
    const {getLabel} = useTranslation();
    const menuItem = useSelector(state => state.menu.item);
    const dispatch = useDispatch();
    const renderContent = () => {
        switch (menuItem) {
            case navMenuItemsArray[0].route:
                return <Bar/>;
            case navMenuItemsArray[1].route:
                return <Snack/>;
            case navMenuItemsArray[2].route:
                return <Dessert/>;
            default: return <Bar/>;
         }
    };
    return (
        <div className={`${styles.menu}`}>
            <div className={`${styles.navigate}`}>
                <ul style={{display: 'flex', flexDirection: 'row'}}>
                    {navMenuItemsArray.map(i => <li className={`nav-item border border-dark rounded-pill btn flex-column`}
                              key={i.route} onClick={() =>dispatch(changeMenuNavItem(i.route))} >{getLabel(i)}</li>)}
                </ul>
            </div>
            <div className={`${styles.main}`}>
                {renderContent()}
            </div>
        </div>);
};

export default Menu;