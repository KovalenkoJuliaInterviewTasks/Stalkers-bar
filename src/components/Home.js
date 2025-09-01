import React from 'react';
import {useSelector} from "react-redux";
import {headerEn, headerHe, headerRu} from "../utils/constants";
import styles from "../styles/Home.module.css"

const Home = () =>
{
    const lang = useSelector(state => state.lang.lang);

    const getText = () =>{
        switch (lang){
            case 'EN': return headerEn;
            case 'RU': return headerRu;
            case 'HE': return headerHe;
            default: return headerRu;
        }
    }

    return (
        <div style={{ display: "flex", alignItems: "center", flexDirection: lang === 'HE' ? 'row-reverse' : 'row'}}
             dir={lang === 'HE' ? 'rtl' : 'ltr'}>
            <div className={`${styles['text-box']}`}>
                <div className={`${styles['home']}`}>{getText().text}</div>
                <div className={`${styles['home']} ${styles['little']}`}>{getText().subtext}</div>
            </div>
            <div className={`${styles['img-box']}`}>
                <img src={`/images/logo.png`} alt={'logo'}/>
            </div>
        </div>
    );
};

export default Home;