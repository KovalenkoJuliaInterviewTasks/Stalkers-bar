import React from 'react';
import {foodItems} from "../utils/temporaryConstants";
import MenuSection from "./MenuSection";

const Snack = () => {
    return (
        <div>
            {foodItems.map(i => <MenuSection key={i.title} item={i} direct={'column'}/>)}
        </div>
    );
};

export default Snack;