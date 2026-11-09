import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
    Divider, IconButton, MenuItem, Select, Snackbar, TextField, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import AddItemDialog from './AddItemDialog';
import QtyStepper from './QtyStepper';
import {
    ordersApi, fetchMenu, billUrl, openPrint, lineTotal, tableTotal, pendingCount, money,
} from './api';
import { cardSx, dialogPaperSx, fieldSx, primaryBtnSx, selectSx } from './styles';

const LANGS = [
    { value: 'RU', label: 'Русский' },
    { value: 'EN', label: 'English' },
    { value: 'HE', label: 'עברית' },
];
const STATION_LABEL = { kitchen: 'Кухня', bar: 'Бар' };

const formatTime = (date) => new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

const ConfirmDialog = ({ open, title, text, confirmLabel, onConfirm, onClose }) => (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: dialogPaperSx }}>
        <DialogTitle>{title}</DialogTitle>
        {text && <DialogContent><Typography sx={{ color: '#ccc' }}>{text}</Typography></DialogContent>}
        <DialogActions>
            <Button onClick={onClose} sx={{ color: '#aaa' }}>Отмена</Button>
            <Button onClick={onConfirm} variant="contained" sx={primaryBtnSx}>{confirmLabel}</Button>
        </DialogActions>
    </Dialog>
);

const TableOrder = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [table, setTable] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [menu, setMenu] = useState(null);
    const [menuError, setMenuError] = useState('');
    const [addOpen, setAddOpen] = useState(false);
    const [renameValue, setRenameValue] = useState(null); // null — диалог закрыт
    const [confirm, setConfirm] = useState(null);
    const [snack, setSnack] = useState(null);
    const requestSeq = useRef(0);

    const load = useCallback(() => {
        const seq = ++requestSeq.current;
        ordersApi.get(id)
            .then(t => { if (seq === requestSeq.current) setTable(t); })
            .catch(err => setLoadError(err.message));
    }, [id]);

    useEffect(() => {
        load();
        window.addEventListener('focus', load);
        return () => window.removeEventListener('focus', load);
    }, [load]);

    useEffect(() => {
        fetchMenu().then(setMenu).catch(err => setMenuError(err.message));
    }, []);

    // Выполнить запрос и показать результат. Применяется только ответ на
    // последний запрос, чтобы быстрые клики +/- не откатывали состояние.
    const run = async (fn, { lock = true } = {}) => {
        const seq = ++requestSeq.current;
        if (lock) setBusy(true);
        setError('');
        try {
            const result = await fn();
            const next = result?.table || result;
            if (seq === requestSeq.current && next?._id) setTable(next);
            return result;
        } catch (err) {
            setError(err.message);
            load();
            return null;
        } finally {
            if (lock) setBusy(false);
        }
    };

    if (loadError) {
        return (
            <Box>
                <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>
                <Button onClick={() => navigate('/orders')} startIcon={<ArrowBackIcon />} sx={{ color: '#fff' }}>
                    К столам
                </Button>
            </Box>
        );
    }
    if (!table) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: '#e53935' }} /></Box>;

    const closed = table.status === 'closed';
    const total = tableTotal(table);
    const pendingKitchen = pendingCount(table, 'kitchen');
    const pendingBar = pendingCount(table, 'bar');

    const addItem = async (payload) => {
        const next = await ordersApi.addItem(id, payload);
        setTable(next);
        const line = next.items[next.items.length - 1];
        return `${line.titleRu}${line.cap ? ` ${line.cap}` : ''} × ${line.qty}`;
    };

    const changeQty = (line, qty) => {
        setTable(t => ({ ...t, items: t.items.map(l => (l._id === line._id ? { ...l, qty } : l)) }));
        run(() => ordersApi.updateItem(id, line._id, { qty }), { lock: false });
    };

    const removeLine = (line) => {
        const doRemove = () => { setConfirm(null); run(() => ordersApi.removeItem(id, line._id)); };
        if (line.sentQty > 0) {
            setConfirm({
                title: 'Удалить позицию?',
                text: `«${line.titleRu}» уже отправлено (${line.sentQty} шт). Предупредите ${line.station === 'bar' ? 'бар' : 'кухню'} об отмене.`,
                confirmLabel: 'Удалить',
                onConfirm: doRemove,
            });
        } else {
            doRemove();
        }
    };

    const send = async (station) => {
        const result = await run(() => ordersApi.send(id, station));
        if (result?.ticketId) {
            const ticket = result.table.tickets.find(tk => tk._id === result.ticketId);
            setSnack({ text: `${STATION_LABEL[station]}: заказ №${ticket.number} отправлен на принтер` });
        }
    };

    const closeTable = async () => {
        const result = await run(() => ordersApi.close(id, table.lang));
        if (result) setSnack({ text: `Счёт ${money(result.total)} отправлен на принтер` });
    };

    const reprintBill = async () => {
        const ok = await run(() => ordersApi.printBill(id), { lock: false });
        if (ok) setSnack({ text: 'Счёт отправлен на принтер' });
    };

    const reprintTicket = async (tk) => {
        const ok = await run(() => ordersApi.printTicket(id, tk._id), { lock: false });
        if (ok) setSnack({ text: `${STATION_LABEL[tk.station]}: заказ №${tk.number} отправлен на принтер ещё раз` });
    };

    const changeLang = (lang) => run(() => ordersApi.update(id, { lang }));

    const rename = async () => {
        const name = renameValue.trim();
        if (!name) return;
        const result = await run(() => ordersApi.update(id, { name }));
        if (result) setRenameValue(null);
    };

    const deleteTable = () => setConfirm({
        title: `Удалить стол «${table.name}»?`,
        text: closed
            ? 'Счёт оплачен — стол, заказ и файл счёта будут удалены.'
            : 'Счёт ещё не выставлен. Стол и весь заказ будут удалены без возможности восстановления.',
        confirmLabel: 'Удалить стол',
        onConfirm: async () => {
            setConfirm(null);
            const ok = await run(() => ordersApi.remove(id));
            if (ok) navigate('/orders');
        },
    });

    const reopen = () => setConfirm({
        title: 'Открыть стол снова?',
        text: 'Выставленный счёт будет удалён, заказ снова можно будет менять.',
        confirmLabel: 'Открыть',
        onConfirm: () => { setConfirm(null); run(() => ordersApi.reopen(id)); },
    });

    return (
        <Box sx={{ pb: 4 }}>
            {/* Шапка */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <IconButton onClick={() => navigate('/orders')} sx={{ color: '#fff' }} aria-label="К столам">
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
                    Стол {table.name}
                </Typography>
                <IconButton size="small" onClick={() => setRenameValue(table.name)} sx={{ color: '#aaa' }} aria-label="Переименовать">
                    <EditIcon fontSize="small" />
                </IconButton>
                {closed && <Chip label="Счёт выставлен" color="success" size="small" />}
                <Box sx={{ flexGrow: 1 }} />
                <IconButton onClick={deleteTable} sx={{ color: '#e57373' }} aria-label="Удалить стол" disabled={busy}>
                    <DeleteIcon />
                </IconButton>
            </Box>

            {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

            {/* Позиции */}
            <Box sx={{ ...cardSx, mb: 2 }}>
                {table.items.length === 0 && (
                    <Typography sx={{ color: '#888', p: 2 }}>Заказ пуст</Typography>
                )}
                {table.items.map((line, idx) => (
                    <Box key={line._id}>
                        {idx > 0 && <Divider sx={{ borderColor: '#333' }} />}
                        <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 'bold' }}>
                                    {line.titleRu}{line.cap && <span style={{ color: '#aaa', fontWeight: 'normal' }}> {line.cap}</span>}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                    {line.ice && <Chip size="small" label="ЛЁД" sx={{ backgroundColor: '#1565c0', color: '#fff' }} />}
                                    {line.sectionType === 'custom' && <Chip size="small" label="не из меню" sx={{ backgroundColor: '#424242', color: '#ddd' }} />}
                                    {line.station && (
                                        <Chip
                                            size="small"
                                            label={line.sentQty >= line.qty
                                                ? `${STATION_LABEL[line.station]}: отправлено`
                                                : `${STATION_LABEL[line.station]}: не отправлено ${line.qty - line.sentQty}`}
                                            sx={{
                                                backgroundColor: line.sentQty >= line.qty ? '#2e7d32' : '#5d4037',
                                                color: '#fff',
                                            }}
                                        />
                                    )}
                                </Box>
                                {line.comment && (
                                    <Typography variant="body2" sx={{ color: '#ccc', fontStyle: 'italic', mt: 0.5 }}>
                                        {line.comment}
                                    </Typography>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 'auto' }}>
                                <QtyStepper value={line.qty} disabled={closed} onChange={qty => changeQty(line, qty)} />
                                <Box sx={{ textAlign: 'right', minWidth: 72 }}>
                                    <Typography sx={{ fontWeight: 'bold' }}>{money(lineTotal(line))}</Typography>
                                    <Typography variant="caption" sx={{ color: '#888' }}>{money(line.price)} / шт</Typography>
                                </Box>
                                <IconButton size="small" sx={{ color: '#e57373' }} disabled={closed || busy}
                                            onClick={() => removeLine(line)} aria-label="Удалить позицию">
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    </Box>
                ))}
                <Divider sx={{ borderColor: '#3a3a3a' }} />
                <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Итого</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{money(total)}</Typography>
                </Box>
            </Box>

            {/* Действия */}
            {!closed && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1, mb: 2 }}>
                    <Button variant="contained" startIcon={<AddIcon />} sx={{ ...primaryBtnSx, gridColumn: { sm: '1 / -1' }, py: 1.25 }}
                            onClick={() => setAddOpen(true)} disabled={busy}>
                        Добавить позицию
                    </Button>
                    <Button variant="outlined" startIcon={<RestaurantIcon />} disabled={busy || pendingKitchen === 0}
                            onClick={() => send('kitchen')} sx={{ color: '#fff', borderColor: '#666' }}>
                        На кухню{pendingKitchen ? ` (${pendingKitchen})` : ''}
                    </Button>
                    <Button variant="outlined" startIcon={<LocalBarIcon />} disabled={busy || pendingBar === 0}
                            onClick={() => send('bar')} sx={{ color: '#fff', borderColor: '#666' }}>
                        На бар{pendingBar ? ` (${pendingBar})` : ''}
                    </Button>
                    <Button variant="contained" color="success" startIcon={<ReceiptIcon />}
                            disabled={busy || table.items.length === 0} onClick={closeTable}>
                        Закрыть стол
                    </Button>
                </Box>
            )}

            {/* Счёт */}
            <Box sx={{ ...cardSx, p: 1.5, mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                <Typography>Язык счёта</Typography>
                <Select size="small" value={table.lang} onChange={e => changeLang(e.target.value)} sx={selectSx} disabled={busy}
                        MenuProps={{ PaperProps: { sx: { backgroundColor: '#2a2a2a', color: '#fff' } } }}>
                    {LANGS.map(l => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
                </Select>
                {closed && (
                    <>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button variant="contained" startIcon={<PrintIcon />} sx={primaryBtnSx} onClick={reprintBill}>
                            Печать счёта
                        </Button>
                        <Button startIcon={<OpenInNewIcon />} onClick={() => openPrint(billUrl(id))} sx={{ color: '#aaa' }}
                                title="Открыть счёт в браузере (если принтер недоступен)">
                            Открыть
                        </Button>
                        <Button startIcon={<LockOpenIcon />} onClick={reopen} disabled={busy} sx={{ color: '#aaa' }}>
                            Открыть снова
                        </Button>
                        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={deleteTable} disabled={busy}>
                            Оплачено — удалить
                        </Button>
                    </>
                )}
            </Box>

            {/* История заказов на кухню / бар */}
            {table.tickets.length > 0 && (
                <Box sx={{ ...cardSx, p: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Отправленные заказы</Typography>
                    {[...table.tickets].reverse().map(tk => (
                        <Box key={tk._id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.75, borderTop: '1px solid #333' }}>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" sx={{ color: '#aaa' }}>
                                    {STATION_LABEL[tk.station]} · №{tk.number} · {formatTime(tk.createdAt)}
                                    {tk.done && ' · готово'}
                                </Typography>
                                <Typography variant="body2">
                                    {tk.items.map(i => `${i.title}${i.cap ? ` ${i.cap}` : ''}${i.ice ? ' +лёд' : ''} × ${i.qty}`).join(', ')}
                                </Typography>
                            </Box>
                            <IconButton size="small" sx={{ color: '#aaa' }} aria-label="Напечатать ещё раз" title="Напечатать ещё раз"
                                        onClick={() => reprintTicket(tk)}>
                                <PrintIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            )}

            <AddItemDialog open={addOpen} onClose={() => setAddOpen(false)} menu={menu} menuError={menuError} onAdd={addItem} />

            <Dialog open={renameValue !== null} onClose={() => setRenameValue(null)} PaperProps={{ sx: dialogPaperSx }}>
                <DialogTitle>Название стола</DialogTitle>
                <DialogContent>
                    <TextField autoFocus fullWidth value={renameValue || ''} sx={{ ...fieldSx, mt: 1 }}
                               inputProps={{ maxLength: 60 }}
                               onChange={e => setRenameValue(e.target.value)}
                               onKeyDown={e => e.key === 'Enter' && rename()} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRenameValue(null)} sx={{ color: '#aaa' }}>Отмена</Button>
                    <Button onClick={rename} variant="contained" sx={primaryBtnSx} disabled={!renameValue?.trim() || busy}>
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog open={Boolean(confirm)} {...confirm} onClose={() => setConfirm(null)} />

            <Snackbar
                open={Boolean(snack)} autoHideDuration={8000} onClose={() => setSnack(null)}
                message={snack?.text}
            />
        </Box>
    );
};

export default TableOrder;
