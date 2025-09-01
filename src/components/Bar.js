import React from 'react';
import {barItems} from "../utils/temporaryConstants";
import MenuSection from "./MenuSection";

const Bar = () =>
{
    return (
        <div>
            {barItems.map(i => <MenuSection key={i.title} item={i}/>)}
        </div>
    );
};

export default Bar;