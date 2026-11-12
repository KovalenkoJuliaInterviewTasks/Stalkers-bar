import React, { useEffect, useMemo, useState } from 'react';
import {
    Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Typography, Checkbox, FormControlLabel, CircularProgress, Alert, Collapse,
    useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QtyStepper from './QtyStepper';
import { money } from './api';
import { ACCENT, checkboxSx, dialogPaperSx, fieldSx, primaryBtnSx } from './styles';

// Разделы меню в порядке показа
const GROUPS = [
    { type: 'bar', label: 'Жидкое топливо' },
    { type: 'food', label: 'Твердое топливо' },
    { type: 'dessert', label: 'Сладкое топливо' },
];

const normalize = (s) => String(s || '').toLowerCase().replace(/ё/g, 'е');

const hasPrice = (v) => v !== null && v !== undefined && v !== '';

// Варианты позиции меню: cost1/cap1 … cost3/cap3
const variantsOf = (item) => [1, 2, 3]
    .filter(n => hasPrice(item[`cost${n}`]))
    .map(n => ({ n, cap: item[`cap${n}`] || '', cost: item[`cost${n}`] }));

const emptyConfig = { variant: 1, ice: false, qty: 1, comment: '' };
const emptyCustom = { title: '', price: '', qty: 1, comment: '' };

const MenuItemRow = ({ item, isBar, selected, onSelect, onAdd, busy }) => {
    const variants = variantsOf(item);
    const [cfg, setCfg] = useState({ ...emptyConfig, variant: variants[0]?.n ?? 1 });

    useEffect(() => {
        if (selected) setCfg({ ...emptyConfig, variant: variants[0]?.n ?? 1 });
    }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

    const priceLabel = variants.map(v => (v.cap ? `${v.cap} ${money(v.cost)}` : money(v.cost))).join(' · ');

    return (
        <Box sx={{ borderBottom: '1px solid #2e2e2e' }}>
            <Box
                role="button" tabIndex={0} onClick={onSelect}
                onKeyDown={e => e.key === 'Enter' && onSelect()}
                sx={{
                    display: 'flex', justifyContent: 'space-between', gap: 1, py: 1.25, px: 1, cursor: 'pointer',
                    backgroundColor: selected ? '#2c2c2c' : 'transparent', '&:hover': { backgroundColor: '#2a2a2a' },
                }}
            >
                <Typography sx={{ fontWeight: selected ? 'bold' : 'normal' }}>{item.titleRu || item.titleEn}</Typography>
                <Typography variant="body2" sx={{ color: '#aaa', whiteSpace: 'nowrap' }}>{priceLabel}</Typography>
            </Box>
            <Collapse in={selected} unmountOnExit>
                <Box sx={{ px: 1, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {variants.length > 1 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2 }}>
                            {variants.map(v => (
                                <FormControlLabel
                                    key={v.n}
                                    control={<Checkbox sx={checkboxSx} checked={cfg.variant === v.n}
                                                       onChange={() => setCfg(c => ({ ...c, variant: v.n }))} />}
                                    label={`${v.cap || `Вариант ${v.n}`} — ${money(v.cost)}`}
                                />
                            ))}
                        </Box>
                    )}
                    {isBar && (
                        <FormControlLabel
                            control={<Checkbox sx={checkboxSx} checked={cfg.ice}
                                               onChange={e => setCfg(c => ({ ...c, ice: e.target.checked }))} />}
                            label="ЛЁД"
                        />
                    )}
                    <TextField
                        size="small" label="Комментарий" value={cfg.comment} sx={fieldSx}
                        inputProps={{ maxLength: 300 }}
                        onChange={e => setCfg(c => ({ ...c, comment: e.target.value }))}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <QtyStepper value={cfg.qty} onChange={qty => setCfg(c => ({ ...c, qty }))} />
                        <Button variant="contained" sx={primaryBtnSx} disabled={busy}
                                onClick={() => onAdd({ menuItemId: item._id, ...cfg })}>
                            Добавить
                        </Button>
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
};

const CustomItemForm = ({ onAdd, busy }) => {
    const [form, setForm] = useState(emptyCustom);
    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
    const valid = form.title.trim() && hasPrice(form.price) && Number(form.price) >= 0;

    const submit = async () => {
        const ok = await onAdd({
            custom: true,
            title: form.title.trim(),
            price: Number(form.price),
            qty: form.qty,
            comment: form.comment,
        });
        if (ok) setForm(emptyCustom);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Название" value={form.title} onChange={set('title')} sx={fieldSx}
                       inputProps={{ maxLength: 100 }} autoFocus />
            <TextField label="Цена за 1 шт, ₪" type="number" value={form.price} onChange={set('price')} sx={fieldSx}
                       inputProps={{ min: 0, step: '0.5', inputMode: 'decimal' }} />
            <TextField label="Комментарий" value={form.comment} onChange={set('comment')} sx={fieldSx}
                       inputProps={{ maxLength: 300 }} />
            <Typography variant="body2" sx={{ color: '#aaa' }}>Позиция будет отправлена на бар</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <QtyStepper value={form.qty} onChange={qty => setForm(f => ({ ...f, qty }))} />
                <Button variant="contained" sx={primaryBtnSx} disabled={busy || !valid} onClick={submit}>
                    Добавить
                </Button>
            </Box>
        </Box>
    );
};

const AddItemDialog = ({ open, onClose, menu, menuError, onAdd }) => {
    const fullScreen = useMediaQuery('(max-width:600px)');
    const [customOpen, setCustomOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        if (open) { setSelectedId(null); setNotice(null); setSearch(''); setCustomOpen(false); }
    }, [open]);

    // Все разделы меню одним списком. Каждое слово запроса ищется в любом
    // месте названия, порядок слов не важен.
    const groups = useMemo(() => {
        if (!menu) return [];
        const words = normalize(search).split(/\s+/).filter(Boolean);
        const matches = (item) => {
            if (!words.length) return true;
            const text = normalize([item.titleRu, item.titleEn, item.titleHe].filter(Boolean).join(' '));
            return words.every(w => text.includes(w));
        };
        return GROUPS
            .map(g => ({
                ...g,
                sections: (menu[g.type] || [])
                    .map(s => ({
                        ...s,
                        items: s.items.filter(i => !i.hidden && variantsOf(i).length > 0 && matches(i)),
                    }))
                    .filter(s => s.items.length),
            }))
            .filter(g => g.sections.length);
    }, [menu, search]);

    const add = async (payload) => {
        setBusy(true);
        try {
            await onAdd(payload);
            setNotice(null);
            setSelectedId(null);
            setSearch('');
            if (payload.custom) setCustomOpen(false); // после позиции не из меню — обратно к списку меню
            return true;
        } catch (err) {
            setNotice({ type: 'error', text: err.message });
            return false;
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm"
                PaperProps={{ sx: dialogPaperSx }}>
            <DialogTitle>{customOpen ? 'Позиция не из меню' : 'Добавить позицию'}</DialogTitle>
            <DialogContent sx={{ pt: 0 }}>
                {notice && (
                    <Alert severity={notice.type} onClose={() => setNotice(null)} sx={{ mb: 1 }}>{notice.text}</Alert>
                )}
                {customOpen ? (
                    <>
                        <Button startIcon={<ArrowBackIcon />} onClick={() => setCustomOpen(false)}
                                sx={{ color: '#aaa', textTransform: 'none', mb: 1, px: 0 }}>
                            К меню
                        </Button>
                        <CustomItemForm onAdd={add} busy={busy} />
                    </>
                ) : (
                    <>
                        <Box sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#1f1f1f', pt: 1, pb: 1 }}>
                            <TextField size="small" fullWidth label="Поиск по всему меню" value={search} sx={fieldSx}
                                       onChange={e => { setSearch(e.target.value); setSelectedId(null); }} />
                            <Button fullWidth variant="outlined" startIcon={<AddIcon />} onClick={() => setCustomOpen(true)}
                                    sx={{ mt: 1, color: '#fff', borderColor: '#555', textTransform: 'none' }}>
                                Позиция не из меню
                            </Button>
                        </Box>
                        {menuError ? (
                            <Alert severity="error">{menuError}</Alert>
                        ) : !menu ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress sx={{ color: ACCENT }} /></Box>
                        ) : groups.length === 0 ? (
                            <Typography sx={{ color: '#888', py: 2 }}>Ничего не найдено</Typography>
                        ) : groups.map(g => (
                            <Box key={g.type} sx={{ mt: 1.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', borderBottom: `2px solid ${ACCENT}`, pb: 0.5 }}>
                                    {g.label}
                                </Typography>
                                {g.sections.map(s => (
                                    <Box key={s._id} sx={{ mt: 0.5 }}>
                                        <Typography variant="overline" sx={{ color: ACCENT }}>{s.titleRu || s.titleEn}</Typography>
                                        {s.items.map(item => (
                                            <MenuItemRow
                                                key={item._id} item={item} isBar={g.type === 'bar'} busy={busy}
                                                selected={selectedId === item._id}
                                                onSelect={() => setSelectedId(id => (id === item._id ? null : item._id))}
                                                onAdd={add}
                                            />
                                        ))}
                                    </Box>
                                ))}
                            </Box>
                        ))}
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid #3a3a3a' }}>
                <Button onClick={onClose} sx={{ color: '#fff' }}>Готово</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddItemDialog;
