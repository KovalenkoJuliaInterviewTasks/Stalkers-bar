export const ACCENT = '#e53935';

export const fieldSx = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: '#2a2a2a',
        color: '#fff',
        '& fieldset': { borderColor: '#3a3a3a' },
        '&:hover fieldset': { borderColor: '#666' },
        '&.Mui-focused fieldset': { borderColor: ACCENT },
    },
    '& .MuiInputLabel-root': { color: '#aaa' },
    '& .MuiInputLabel-root.Mui-focused': { color: ACCENT },
    '& .MuiFormHelperText-root': { color: '#888' },
};

export const selectSx = {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3a3a3a' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#666' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT },
    '& .MuiSvgIcon-root': { color: '#aaa' },
};

export const cardSx = {
    backgroundColor: '#242424',
    border: '1px solid #3a3a3a',
    borderRadius: 2,
    color: '#fff',
};

export const dialogPaperSx = { backgroundColor: '#1f1f1f', color: '#fff' };

export const checkboxSx = { color: '#888', '&.Mui-checked': { color: ACCENT } };

export const primaryBtnSx = { backgroundColor: ACCENT, '&:hover': { backgroundColor: '#c62828' } };
