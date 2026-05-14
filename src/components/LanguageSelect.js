import {useDispatch, useSelector} from "react-redux";
import {changeLang} from "../redux/languageSlice";
import styles from '../styles/LanguageSelect.module.css';

const options = [
    {value: 'EN', image: `/images/EN.png`},
    {value: 'HE', image: `/images/HE.png`},
    {value: 'RU', image: `/images/RU.png`}
];

const LanguageSelect = () => {
    const dispatch = useDispatch();
    const lang = useSelector(state => state.lang.lang);

    return (
        <div className={styles['lang-bar']}>
            {options.map(option => (
                <button
                    key={option.value}
                    className={`${styles['lang-btn']} ${lang === option.value ? styles['active'] : ''}`}
                    onClick={() => dispatch(changeLang(option.value))}
                >
                    <img src={option.image} alt={option.value}/>
                    {option.value}
                </button>
            ))}
        </div>
    );
};

export default LanguageSelect;
