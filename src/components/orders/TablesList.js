import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, CircularProgress, Chip, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ordersApi, tableTotal, pendingCount, money } from './api';
import { cardSx, fieldSx, primaryBtnSx } from './styles';

const REFRESH_MS = 15000;

const TablesList = () => {
    const navigate = useNavigate();
    const [tables, setTables] = useState(null);
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const load = useCallback(() => {
        ordersApi.list().then(setTables).catch(err => setError(err.message));
    }, []);

    useEffect(() => {
        load();
        const timer = setInterval(load, REFRESH_MS);
        return () => clearInterval(timer);
    }, [load]);

    const create = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        setError('');
        try {
            const table = await ordersApi.create(name.trim());
            setName('');
            navigate(`/orders/${table._id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box>
            <Box component="form" onSubmit={create} sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
                <TextField
                    size="small" fullWidth value={name} onChange={e => setName(e.target.value)}
                    label="Новый стол" placeholder="5, 5 терраса, 1/1"
                    inputProps={{ maxLength: 60 }} sx={fieldSx}
                />
                <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={saving || !name.trim()}
                        sx={{ ...primaryBtnSx, whiteSpace: 'nowrap', height: 40 }}>
                    Открыть
                </Button>
            </Box>

            {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

            {tables === null ? (
                <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: '#e53935' }} /></Box>
            ) : tables.length === 0 ? (
                <Typography sx={{ color: '#888', textAlign: 'center', py: 6 }}>Открытых столов нет</Typography>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1.5 }}>
                    {tables.map(t => {
                        const closed = t.status === 'closed';
                        const pending = pendingCount(t, 'kitchen') + pendingCount(t, 'bar');
                        return (
                            <Box
                                key={t._id} role="button" tabIndex={0}
                                onClick={() => navigate(`/orders/${t._id}`)}
                                onKeyDown={e => e.key === 'Enter' && navigate(`/orders/${t._id}`)}
                                sx={{
                                    ...cardSx, p: 1.5, cursor: 'pointer', minHeight: 96,
                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                    borderColor: closed ? '#2e7d32' : '#3a3a3a',
                                    '&:hover': { borderColor: closed ? '#43a047' : '#666' },
                                }}
                            >
                                <Typography sx={{ fontWeight: 'bold', fontSize: '1.25rem', wordBreak: 'break-word' }}>
                                    {t.name}
                                </Typography>
                                <Box>
                                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                                        {t.items.length} поз. · {money(tableTotal(t))}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                        {closed && <Chip size="small" label="Счёт выставлен" color="success" />}
                                        {!closed && pending > 0 && (
                                            <Chip size="small" label={`Не отправлено: ${pending}`}
                                                  sx={{ backgroundColor: '#5d4037', color: '#fff' }} />
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
};

export default TablesList;
