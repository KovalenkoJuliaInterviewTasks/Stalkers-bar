import {configureStore} from "@reduxjs/toolkit";
import lang from './languageSlice'
import menu from './menuSlice'
import data from './dataSlice'

const store = configureStore({
    reducer: {lang, menu, data}
});

export default store;