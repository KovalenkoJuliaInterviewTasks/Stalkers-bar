import React from 'react';
import {dessertItems} from "../utils/temporaryConstants";
import MenuSection from "./MenuSection";

const Dessert = () =>
{
    return (
        <div>
            {dessertItems.map(i => <MenuSection key={i.titleEn} item={i} direct={'column'}/>)}
        </div>
    );
};

export default Dessert;