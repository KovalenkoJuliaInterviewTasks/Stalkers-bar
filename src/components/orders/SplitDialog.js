import React, { useEffect, useState } from 'react';
import {
    Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, TextField, Typography,
    useMediaQuery,
} from '@mui/material';
import QtyStepper from './QtyStepper';
import { ordersApi, money } from './api';
import { dialogPaperSx, fieldSx, primaryBtnSx } from './styles';

const sameName = (a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base', numeric: true }) === 0;

// First free name like "5/1", "5/2", …
const suggestName = (base, names) => {
    for (let n = 1; n < 100; n++) {
        const candidate = `${base}/${n}`;
        if (!names.some(name => sameName(name, candidate))) return candidate;
    }
    return `${base}/`;
};

// Bill split: the chosen quantity of each line is moved to a new bill.
const SplitDialog = ({ open, onClose, table, onSplit }) => {
    const fullScreen = useMediaQuery('(max-width:600px)');
    const [qtys, setQtys] = useState({});
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setQtys({});
        setError('');
        setName(`${table.name}/1`);
        ordersApi.list()
            .then(tables => setName(suggestName(table.name, tables.map(t => t.name))))
            .catch(() => {}); // the suggestion is optional — the name can be typed manually
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    const setQty = (lineId, qty) => setQtys(q => ({ ...q, [lineId]: qty }));
    const items = table.items.filter(l => (qtys[l._id] || 0) > 0);
    const movedSum = table.items.reduce((s, l) => s + (qtys[l._id] || 0) * l.price, 0);
    const movedCount = items.reduce((s, l) => s + qtys[l._id], 0);

    const submit = async () => {
        setBusy(true);
        setError('');
        try {
            await onSplit(name.trim(), items.map(l => ({ lineId: l._id, qty: qtys[l._id] })));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm"
                PaperProps={{ sx: dialogPaperSx }}>
            <DialogTitle>Разделить счёт</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth label="Название нового счёта" value={name} sx={{ ...fieldSx, mt: 1, mb: 2 }}
                    inputProps={{ maxLength: 60 }} onChange={e => setName(e.target.value)}
                />
                <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                    Сколько перенести в новый счёт. На кухню и бар ничего не отправляется.
                </Typography>
                {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 1 }}>{error}</Alert>}
                {table.items.map((line, idx) => {
                    const qty = qtys[line._id] || 0;
                    return (
                        <Box key={line._id}>
                            {idx > 0 && <Divider sx={{ borderColor: '#333' }} />}
                            <Box sx={{ py: 1.25, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Box sx={{ flex: '1 1 180px', minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: qty ? 'bold' : 'normal' }}>
                                        {line.titleRu}{line.cap && <span style={{ color: '#aaa' }}> {line.cap}</span>}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#888' }}>
                                        в счёте {line.qty} × {money(line.price)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                                    <QtyStepper value={qty} min={0} max={line.qty} onChange={v => setQty(line._id, v)} />
                                    <Button size="small" onClick={() => setQty(line._id, qty === line.qty ? 0 : line.qty)}
                                            sx={{ color: qty === line.qty ? '#e53935' : '#aaa', minWidth: 48 }}>
                                        все
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    );
                })}
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid #3a3a3a', flexWrap: 'wrap', gap: 1 }}>
                <Typography sx={{ mr: 'auto', pl: 1 }}>
                    {movedCount ? `Переносится ${movedCount} шт на ${money(movedSum)}` : 'Ничего не выбрано'}
                </Typography>
                <Button onClick={onClose} sx={{ color: '#aaa' }}>Отмена</Button>
                <Button variant="contained" sx={primaryBtnSx} onClick={submit}
                        disabled={busy || !movedCount || !name.trim()}>
                    Перенести
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SplitDialog;
