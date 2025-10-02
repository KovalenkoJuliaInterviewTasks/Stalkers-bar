import React from 'react';
import {barItems} from "../utils/temporaryConstants";
import MenuSection from "./MenuSection";

const Bar = () =>
{
    return (
        <div>
            {barItems.map(i => <MenuSection key={i.titleEn} item={i}/>)}
        </div>
    );
};

export default Bar;