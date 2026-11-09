import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, Typography } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CheckIcon from '@mui/icons-material/Check';
import { ordersApi } from './api';
import { cardSx } from './styles';

const REFRESH_MS = 10000;
const TITLE = { kitchen: 'Заказы на кухню', bar: 'Заказы на бар' };

const minutesAgo = (date) => Math.max(0, Math.floor((Date.now() - new Date(date)) / 60000));

// Экран кухни/бара: невыполненные заказы всех столов, обновляется каждые 10 секунд.
const StationScreen = ({ station }) => {
    const [tickets, setTickets] = useState(null);
    const [error, setError] = useState('');
    const knownIds = useRef(null);
    const [freshIds, setFreshIds] = useState(new Set());

    const load = useCallback(() => {
        ordersApi.tickets(station)
            .then(list => {
                // Подсвечиваем заказы, появившиеся с момента прошлого обновления
                if (knownIds.current) {
                    setFreshIds(new Set(list.filter(t => !knownIds.current.has(t._id)).map(t => t._id)));
                }
                knownIds.current = new Set(list.map(t => t._id));
                setTickets(list);
                setError('');
            })
            .catch(err => setError(err.message));
    }, [station]);

    useEffect(() => {
        knownIds.current = null;
        setTickets(null);
        load();
        const timer = setInterval(load, REFRESH_MS);
        return () => clearInterval(timer);
    }, [load]);

    const reprint = async (ticket) => {
        try {
            await ordersApi.printTicket(ticket.tableId, ticket._id);
        } catch (err) {
            setError(err.message);
        }
    };

    const markDone = async (ticket) => {
        setTickets(list => list.filter(t => t._id !== ticket._id));
        try {
            await ordersApi.setTicketDone(ticket.tableId, ticket._id, true);
        } catch (err) {
            setError(err.message);
            load();
        }
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>{TITLE[station]}</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {tickets === null ? (
                <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: '#e53935' }} /></Box>
            ) : tickets.length === 0 ? (
                <Typography sx={{ color: '#888', textAlign: 'center', py: 6 }}>Новых заказов нет</Typography>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 1.5 }}>
                    {tickets.map(tk => (
                        <Box key={tk._id} sx={{
                            ...cardSx, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1,
                            borderColor: freshIds.has(tk._id) ? '#e53935' : '#3a3a3a',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
                                <Typography sx={{ fontWeight: 'bold', fontSize: '1.3rem', wordBreak: 'break-word' }}>
                                    Стол {tk.tableName}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#aaa', whiteSpace: 'nowrap' }}>
                                    №{tk.number} · {minutesAgo(tk.createdAt)} мин
                                </Typography>
                            </Box>
                            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                                {tk.items.map((i, idx) => (
                                    <li key={idx}>
                                        <Typography component="span" sx={{ fontWeight: 'bold' }}>{i.title}</Typography>
                                        {i.cap && <span> {i.cap}</span>}
                                        <Typography component="span" sx={{ fontWeight: 'bold', color: '#ff8a80' }}> × {i.qty}</Typography>
                                        {i.ice && <Typography variant="body2" sx={{ color: '#64b5f6' }}>+ ЛЁД</Typography>}
                                        {i.comment && <Typography variant="body2" sx={{ color: '#ccc', fontStyle: 'italic' }}>{i.comment}</Typography>}
                                    </li>
                                ))}
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
                                <IconButton sx={{ color: '#aaa' }} aria-label="Напечатать ещё раз" title="Напечатать ещё раз"
                                            onClick={() => reprint(tk)}>
                                    <PrintIcon />
                                </IconButton>
                                <Button variant="contained" color="success" startIcon={<CheckIcon />} onClick={() => markDone(tk)}>
                                    Готово
                                </Button>
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default StationScreen;
