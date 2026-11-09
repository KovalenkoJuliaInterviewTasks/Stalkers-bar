import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const btnSx = { color: '#fff', border: '1px solid #3a3a3a', width: 34, height: 34, '&.Mui-disabled': { color: '#555' } };

const QtyStepper = ({ value, onChange, min = 1, max = 999, disabled }) => (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
        <IconButton size="small" sx={btnSx} disabled={disabled || value <= min}
                    onClick={() => onChange(value - 1)} aria-label="Меньше">
            <RemoveIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 'bold' }}>{value}</Typography>
        <IconButton size="small" sx={btnSx} disabled={disabled || value >= max}
                    onClick={() => onChange(value + 1)} aria-label="Больше">
            <AddIcon fontSize="small" />
        </IconButton>
    </Box>
);

export default QtyStepper;
