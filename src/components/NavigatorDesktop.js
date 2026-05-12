import React from 'react';
import {Link} from "react-router-dom";
import {useSelector} from "react-redux";
import styles from '../styles/HeaderFooter.module.css'
const NavigatorDesktop = ({item}) =>
{
     const lang = useSelector(state => state.lang.lang);

    const getLable = item =>{
        switch (lang){
            case 'EN': return item.titleEn;
            case 'RU': return item.titleRu;
            case 'HE': return item.titleHe;
            default: return item.titleRu;
        }
    }

    return (
       <Link className={`nav-item m-1 border border-dark rounded-pill btn ${styles['common-button']}`}
                                          to={item.route}>
           {getLable(item)}
                </Link>)


};

export default NavigatorDesktop;