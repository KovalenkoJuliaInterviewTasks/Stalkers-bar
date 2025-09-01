import React from 'react';
import {useSelector} from "react-redux";
import MenuItemBar from "./MenuItemBar";
import MenuItemFood from "./MenuItemFood";


const MenuSection = ({item, direct}) => {
    const lang = useSelector(state => state.lang.lang);

    const getLable = item => {
        switch (lang) {
            case 'EN': return item.titleEn;
            case 'RU': return item.titleRu;
            case 'HE': return item.titleHe;
            default: return item.titleRu;
        }
    }

    return (
        <div>
            <p style={{fontWeight: "bold", textAlign: "center", marginBottom: 0}}>{getLable(item)}</p>
            <div style={{display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1vw"}}>
                {item.items && item.items.map((item, index) =>
                    direct ? <MenuItemFood item={item} key={index} /> :
                        <MenuItemBar item={item} key={index} />
                )}
            </div>
        </div>);
};

export default MenuSection;