import React from 'react';
import Navigation from "./Navigation";
import LanguageSelect from "./LanguageSelect";
import {navItemsArray} from "../utils/constants";
import styles from '../styles/HeaderFooter.module.css'

const Header = () =>
{
    return (
        <div className={`${styles['header']}`}>
            <div className={styles['nav-row']}>
                <Navigation items={navItemsArray}/>
                <div className={styles['lang-row']}>
                    <LanguageSelect/>
                </div>
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