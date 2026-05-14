import React from 'react';
import {Link} from "react-router-dom";
import styles from '../styles/HeaderFooter.module.css';
import {useTranslation} from '../utils/useTranslation';

const NavigatorDesktop = ({item}) => {
    const {getLabel} = useTranslation();

    return (
        <Link className={`nav-item m-1 border border-dark rounded-pill btn ${styles['common-button']}`}
              to={item.route}>
            {getLabel(item)}
        </Link>
    );
};

export default NavigatorDesktop;