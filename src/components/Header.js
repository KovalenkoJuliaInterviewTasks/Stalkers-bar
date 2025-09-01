import React from 'react';
import Navigation from "./Navigation";
import LanguageSelect from "./LanguageSelect";
import {navItemsArray} from "../utils/constants";
import styles from '../styles/HeaderFooter.module.css'

const Header = () =>
{
    return (
        <div className={`${styles['header']}`}>
            <div className={'d-flex w-100 flex-row'}>
                <Navigation items = {navItemsArray}/>
                <LanguageSelect/>
            </div>
            <header>
                <img
                    src={`/images/logo.png`} alt={'logo'}
                    style={{ width: "8%", height: "auto", objectFit: "cover" }}
                />
                Stalkers Social Club</header>
        </div>
    );
};

export default Header;