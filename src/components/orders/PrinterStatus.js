import React, { useCallback, useEffect, useState } from 'react';
import {
    Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Typography,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { printApi } from './api';
import { dialogPaperSx, primaryBtnSx } from './styles';

const REFRESH_MS = 15000;
const ROLE_LABEL = { kitchen: 'кухня', bar: 'бар', bills: 'счета' };
const STATUS_LABEL = {
    pending: 'ждёт печати', printing: 'печатается', error: 'ошибка', expired: 'не напечатано вовремя',
};

const formatTime = (date) => new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

// Индикатор в шапке: на связи ли программа печати и есть ли застрявшие задания.
const PrinterStatus = () => {
    const [status, setStatus] = useState(null);
    const [open, setOpen] = useState(false);

    const load = useCallback(() => {
        printApi.status().then(setStatus).catch(() => setStatus(null));
    }, []);

    useEffect(() => {
        load();
        const timer = setInterval(load, REFRESH_MS);
        return () => clearInterval(timer);
    }, [load]);

    if (!status || !status.configured) return null; // печать через посредника не настроена

    const problems = status.problems.length;
    const ok = status.online && problems === 0;
    const label = !status.online ? 'Принтеры не на связи'
        : problems ? `Проблемы с печатью: ${problems}` : 'Принтеры на связи';

    const act = async (fn) => {
        try {
            await fn();
        } finally {
            load();
        }
    };

    return (
        <>
            <Chip
                icon={<PrintIcon sx={{ color: '#fff !important' }} />}
                label={label}
                onClick={() => { load(); setOpen(true); }}
                sx={{ backgroundColor: ok ? '#2e7d32' : '#c62828', color: '#fff', fontWeight: 'bold' }}
            />
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: dialogPaperSx }}>
                <DialogTitle>Печать</DialogTitle>
                <DialogContent>
                    {status.online ? (
                        <Box sx={{ mb: 2 }}>
                            {status.printers.map(p => (
                                <Typography key={p.name}>
                                    ✓ <b>{p.name}</b> — {p.roles.map(r => ROLE_LABEL[r]).join(', ')}, {p.paper} мм
                                </Typography>
                            ))}
                        </Box>
                    ) : (
                        <Typography sx={{ color: '#ff8a80', mb: 2 }}>
                            Программа печати на компьютере в баре не отвечает
                            {status.lastSeen ? ` (последний раз в ${formatTime(status.lastSeen)})` : ''}.
                            Проверьте, что компьютер включён и программа запущена. Задания ждут в очереди 30 минут.
                        </Typography>
                    )}

                    {problems === 0 ? (
                        <Typography sx={{ color: '#aaa' }}>Застрявших заданий нет.</Typography>
                    ) : status.problems.map(j => (
                        <Box key={j._id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, borderTop: '1px solid #333', flexWrap: 'wrap' }}>
                            <Box sx={{ flex: '1 1 220px' }}>
                                <Typography>{j.label}</Typography>
                                <Typography variant="body2" sx={{ color: '#aaa' }}>
                                    {formatTime(j.queuedAt)} · {STATUS_LABEL[j.status] || j.status}
                                    {j.error ? ` · ${j.error}` : ''}
                                </Typography>
                            </Box>
                            <Button size="small" variant="contained" sx={primaryBtnSx} onClick={() => act(() => printApi.retry(j._id))}>
                                Повторить
                            </Button>
                            <Button size="small" sx={{ color: '#aaa' }} onClick={() => act(() => printApi.dismiss(j._id))}>
                                Убрать
                            </Button>
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} sx={{ color: '#fff' }}>Закрыть</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default PrinterStatus;
