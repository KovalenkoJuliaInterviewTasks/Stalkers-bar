import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL || '';

const money = (n) => `${(Math.round((n || 0) * 100) / 100).toLocaleString('ru-RU')} ₪`;
const formatDay = (d) => new Date(d).toLocaleDateString('ru-RU', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
const formatTime = (d) => new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
const formatDateTime = (d) => `${new Date(d).toLocaleDateString('ru-RU')} ${formatTime(d)}`;
const monthTitle = (d) => {
    const s = new Date(d).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
};
const monthKey = (d) => {
    const date = new Date(d);
    return `${date.getFullYear()}-${date.getMonth()}`;
};

const cellSx = { color: '#fff', borderColor: '#333' };
const headSx = { ...cellSx, color: '#aaa', fontWeight: 'bold' };
const num = { textAlign: 'right', whiteSpace: 'nowrap' };

const sum = (days, field) => days.reduce((s, d) => s + (d[field] || 0), 0);

// Closed days grouped by month, with a monthly total
const groupByMonth = (days) => {
    const groups = [];
    for (const day of days) {
        const key = monthKey(day.openedAt);
        let g = groups[groups.length - 1];
        if (!g || g.key !== key) {
            g = { key, title: monthTitle(day.openedAt), days: [] };
            groups.push(g);
        }
        g.days.push(day);
    }
    return groups;
};

const Stat = ({ label, value }) => (
    <Box sx={{ minWidth: 110 }}>
        <Typography variant="body2" sx={{ color: '#aaa' }}>{label}</Typography>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{value}</Typography>
    </Box>
);

const AdminSales = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        fetch(`${API_URL}/api/sales`)
            .then(async res => {
                const body = await res.json();
                if (!res.ok) throw new Error(body.error || 'Не удалось загрузить продажи');
                setData(body);
            })
            .catch(err => setError(err.message));
    }, []);

    useEffect(() => { load(); }, [load]);

    const closeDay = async () => {
        setBusy(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/sales/close-day`, { method: 'POST' });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'Не удалось закрыть день');
            setConfirmOpen(false);
            load();
        } catch (err) {
            setError(err.message);
            setConfirmOpen(false);
        } finally {
            setBusy(false);
        }
    };

    if (!data && !error) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: '#e53935' }} /></Box>;

    const current = data?.current;
    const groups = groupByMonth(data?.days || []);

    return (
        <Box sx={{ maxWidth: 900 }}>
            {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

            {/* Current (not yet closed) day */}
            <Box sx={{ backgroundColor: '#242424', border: '1px solid #3a3a3a', borderRadius: 2, p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Текущий день</Typography>
                        <Typography variant="body2" sx={{ color: '#aaa' }}>
                            {current ? `Первый оплаченный счёт: ${formatDateTime(current.openedAt)}` : 'Оплаченных счетов пока нет'}
                        </Typography>
                    </Box>
                    <Button variant="contained" disabled={!current || busy} onClick={() => setConfirmOpen(true)}
                            sx={{ backgroundColor: '#e53935', '&:hover': { backgroundColor: '#c62828' } }}>
                        Закрыть день
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Stat label="Бар" value={money(current?.bar)} />
                    <Stat label="Кухня" value={money(current?.kitchen)} />
                    <Stat label="Всего" value={money(current?.total)} />
                    <Stat label="Счетов" value={current?.bills || 0} />
                </Box>
            </Box>

            {/* Closed days */}
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Закрытые дни</Typography>
            {groups.length === 0 ? (
                <Typography sx={{ color: '#888' }}>Пока ни один день не закрыт.</Typography>
            ) : (
                <TableContainer sx={{ backgroundColor: '#242424', border: '1px solid #3a3a3a', borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={headSx}>День</TableCell>
                                <TableCell sx={headSx}>Время</TableCell>
                                <TableCell sx={{ ...headSx, ...num }}>Бар</TableCell>
                                <TableCell sx={{ ...headSx, ...num }}>Кухня</TableCell>
                                <TableCell sx={{ ...headSx, ...num }}>Всего</TableCell>
                                <TableCell sx={{ ...headSx, ...num }}>Счетов</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groups.map(g => (
                                <React.Fragment key={g.key}>
                                    <TableRow sx={{ backgroundColor: '#1c1c1c' }}>
                                        <TableCell sx={{ ...cellSx, fontWeight: 'bold' }} colSpan={2}>{g.title}</TableCell>
                                        <TableCell sx={{ ...cellSx, ...num, fontWeight: 'bold' }}>{money(sum(g.days, 'bar'))}</TableCell>
                                        <TableCell sx={{ ...cellSx, ...num, fontWeight: 'bold' }}>{money(sum(g.days, 'kitchen'))}</TableCell>
                                        <TableCell sx={{ ...cellSx, ...num, fontWeight: 'bold' }}>{money(sum(g.days, 'total'))}</TableCell>
                                        <TableCell sx={{ ...cellSx, ...num, fontWeight: 'bold' }}>{sum(g.days, 'bills')}</TableCell>
                                    </TableRow>
                                    {g.days.map(d => (
                                        <TableRow key={d._id}>
                                            <TableCell sx={cellSx}>{formatDay(d.openedAt)}</TableCell>
                                            <TableCell sx={{ ...cellSx, color: '#aaa', whiteSpace: 'nowrap' }}>
                                                {formatTime(d.openedAt)}–{formatTime(d.closedAt)}
                                            </TableCell>
                                            <TableCell sx={{ ...cellSx, ...num }}>{money(d.bar)}</TableCell>
                                            <TableCell sx={{ ...cellSx, ...num }}>{money(d.kitchen)}</TableCell>
                                            <TableCell sx={{ ...cellSx, ...num, fontWeight: 'bold' }}>{money(d.total)}</TableCell>
                                            <TableCell sx={{ ...cellSx, ...num }}>{d.bills}</TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}
                    PaperProps={{ sx: { backgroundColor: '#1f1f1f', color: '#fff' } }}>
                <DialogTitle>Закрыть день?</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#ccc' }}>
                        Итог дня ({money(current?.total)}, счетов: {current?.bills || 0}) будет сохранён.
                        Следующие оплаченные счета пойдут в новый день.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)} sx={{ color: '#aaa' }}>Отмена</Button>
                    <Button onClick={closeDay} variant="contained" disabled={busy}
                            sx={{ backgroundColor: '#e53935', '&:hover': { backgroundColor: '#c62828' } }}>
                        Закрыть день
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminSales;
