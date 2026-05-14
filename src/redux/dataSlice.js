import { createSlice } from '@reduxjs/toolkit';

const dataSlice = createSlice({
    name: 'data',
    initialState: {
        albums: null,
        bar: null,
        food: null,
        dessert: null,
    },
    reducers: {
        setAlbums: (state, action) => { state.albums = action.payload; },
        setBar: (state, action) => { state.bar = action.payload; },
        setFood: (state, action) => { state.food = action.payload; },
        setDessert: (state, action) => { state.dessert = action.payload; },
    }
});

export const { setAlbums, setBar, setFood, setDessert } = dataSlice.actions;
export default dataSlice.reducer;
