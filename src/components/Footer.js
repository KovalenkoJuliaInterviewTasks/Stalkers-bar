import React from 'react';
import styles from '../styles/HeaderFooter.module.css'
import {useSelector} from "react-redux";
import {footerEn, footerHe, footerRu} from "../utils/constants";

const Footer = () => {
    const lang = useSelector(state => state.lang.lang);
    const getFooter = () =>  {
        switch (lang)  {
            case 'EN': return footerEn;
            case 'RU': return footerRu;
            case 'HE': return footerHe;
            default: return footerRu;
        }
    }
    return (
        <footer className={`${styles['header']}`}>
            <div className={`d-flex p-1`} dir={lang === 'HE' ? 'rtl' : 'ltr'}>
                <div className={'flex-grow-1'} style={{
                    textAlign: lang === 'HE' ? 'right' : 'left',
                    whiteSpace: "normal",
                    wordWrap: "break-word"
                }}>
                    <p>{getFooter().address}</p>
                    <p>{getFooter().phone}</p>
                    <p>Email: stakerslemc@gmail.com</p>
                </div>
                <div className={'d-flex justify-content-between p-1 '}>
                    <div className={'p-1'}>
                        <a href="https://waze.com/ul?ll=31.2375747,34.7918634&navigate=yes" target="_blank" rel="noreferrer">
                            <img src={`/images/waze.png`} alt='Waze' title='Waze'/>
                        </a>
                    </div>
                    <div className={'p-1'}>
                        <a href="https://www.google.com/maps?q=31.2375747,34.7918634" target="_blank" rel="noreferrer">
                            <img src={`/images/google.png`} alt='Google Map' title='Google Map'/>
                        </a>
                    </div>
                    <div className={'p-1'}>
                        <a href="https://www.facebook.com/profile.php?id=61571688320392" target="_blank" rel="noreferrer">
                            <img src={`/images/facebook.png`} alt='Facebook' title='Facebook'/>
                        </a>
                    </div>
                    <div className={'p-1'}>
                        <a href="https://api.whatsapp.com/send?phone=972545574713" target="_blank" rel="noreferrer">
                            <img src={`/images/whatsApp.png`} alt='WhatsApp' title='WhatsApp'/>
                        </a>
                    </div>
                </div>
            </div>
            <p className={'px-1'}>{getFooter().work}</p>
            <div className={'text-center'}>{getFooter().copyright}</div>
            <div className={'text-center'}>©2025 «StalkersSocialClub»</div>
        </footer>
    );
};


export default Footer;