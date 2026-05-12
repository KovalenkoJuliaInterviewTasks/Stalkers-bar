import {configureStore} from "@reduxjs/toolkit";
import lang from './languageSlice'
import menu from './menuSlice'

const store = configureStore({
    reducer: {lang, menu}
});

export default store;