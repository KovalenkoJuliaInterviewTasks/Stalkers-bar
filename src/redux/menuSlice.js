import {createSlice} from "@reduxjs/toolkit";

const menuSlice = createSlice({
    name: 'menu',
    initialState: {item: 'bar'},
    reducers: {
        changeMenuNavItem(state, action){
            state.item = action.payload
        }
    }
})

export const {changeMenuNavItem} = menuSlice.actions;
export default menuSlice.reducer;
