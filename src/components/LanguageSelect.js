import React, {useState} from 'react';
import styles from '../styles/LanguageSelect.module.css';
import {useDispatch} from "react-redux";
import {changeLang} from "../redux/languageSlice";

const options = [
    {value: 'EN', label: 'EN', image: `/images/EN.png`},
    {value: 'HE', label: 'HE', image: `/images/HE.png`},
    {value: 'RU', label: 'RU', image: `/images/RU.png`}
];

const LanguageSelect = () => {
    const dispatch = useDispatch();

    const [selectedOption, setSelectedOption] = useState(options[2]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <span className="custom-select text-end mx-4 fixed-top">
            <span className="selected-option"
                  onMouseOver={() => setIsDropdownOpen(true)}>
                <img src={selectedOption.image} alt={selectedOption.label}/>
                {selectedOption.label}&nbsp;&nbsp;
            </span>
            <span className={`${styles['options-dropdown']} ${isDropdownOpen ? styles.open : ''}`}>
                {options.map(option => (
                    <span
                        key={option.value}
                        className="option"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOption(option);
                            dispatch(changeLang(option.value));
                            setIsDropdownOpen(false)
                        }}
                    >
                        <img src={option.image} alt={option.label}/>
                        {option.label}&nbsp;&nbsp;
                    </span>
                ))}
            </span>
        </span>
    );
};

export default LanguageSelect;
