import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Button, Tabs, Tab, Typography, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, IconButton, CircularProgress, Select,
    MenuItem, FormControl, InputLabel, Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getImageUrl } from '../../utils/imageUrl';

const API_URL = process.env.REACT_APP_API_URL || '';
const PERFORMERS_FOLDER_ID = '146eQxN5UcpWWywNfAosXT-R6sVEUC6Mv';

const fieldSx = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: '#2a2a2a',
        color: '#fff',
        '& fieldset': { borderColor: '#3a3a3a' },
        '&:hover fieldset': { borderColor: '#666' },
        '&.Mui-focused fieldset': { borderColor: '#e53935' },
    },
    '& .MuiInputLabel-root': { color: '#aaa' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#e53935' },
};

const selectSx = {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3a3a3a' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#666' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e53935' },
    '& .MuiSvgIcon-root': { color: '#aaa' },
};

const emptyEvent = {
    performerId: '',
    title: '',
    image: '',
    descEn: '', descRu: '', descHe: '',
    date: '', open: '20:00', start: '21:00', price: '',
};

const emptyPerformer = {
    title: '', image: '', descEn: '', descRu: '', descHe: '',
};

// -----------------------------------------------------------------------
// Performer Dialog
// -----------------------------------------------------------------------
const PerformerDialog = ({ open, onClose, editPerformer, onSaved }) => {
    const [form, setForm] = useState(emptyPerformer);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
        setForm(editPerformer ? { ...emptyPerformer, ...editPerformer } : emptyPerformer);
    }, [editPerformer, open]);

    const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleUpload = async () => {
        const file = fileRef.current?.files[0];
        if (!file) return alert('Выберите файл');
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('folderId', PERFORMERS_FOLDER_ID);
            const res = await fetch(`${API_URL}/api/drive/upload`, { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            setForm(prev => ({ ...prev, image: data.fileId }));
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            const method = editPerformer ? 'PUT' : 'POST';
            const url = editPerformer
                ? `${API_URL}/api/performers/${editPerformer._id}`
                : `${API_URL}/api/performers`;
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error('Failed to save performer');
            const saved = await res.json();
            onSaved(saved);
            onClose();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { backgroundColor: '#1a1a1a', color: '#fff' } }}
        >
            <DialogTitle sx={{ color: '#fff', borderBottom: '1px solid #3a3a3a' }}>
                {editPerformer ? 'Редактировать исполнителя' : 'Создать исполнителя'}
            </DialogTitle>
            <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField label="title" value={form.title} onChange={handleChange('title')} size="small" sx={fieldSx} />
                <Box>
                    <Typography sx={{ color: '#aaa', mb: 1, fontSize: '0.85rem' }}>Изображение</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input type="file" accept="image/*" ref={fileRef} style={{ color: '#aaa' }} />
                        <Button
                            onClick={handleUpload}
                            disabled={uploading}
                            variant="outlined"
                            size="small"
                            sx={{ color: '#90caf9', borderColor: '#90caf9', minWidth: 140 }}
                        >
                            {uploading ? <CircularProgress size={18} sx={{ color: '#90caf9' }} /> : 'Загрузить в Drive'}
                        </Button>
                    </Box>
                    {form.image && (
                        <img
                            src={getImageUrl(form.image)}
                            alt="preview"
                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, marginTop: 8 }}
                        />
                    )}
                </Box>
                {['descEn', 'descRu', 'descHe'].map(f => (
                    <TextField key={f} label={f} value={form[f]} onChange={handleChange(f)} size="small" multiline rows={2} sx={fieldSx} />
                ))}
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid #3a3a3a', px: 3, py: 2 }}>
                <Button onClick={onClose} sx={{ color: '#aaa' }}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: '#e53935', '&:hover': { backgroundColor: '#c62828' } }}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// -----------------------------------------------------------------------
// Events Tab
// -----------------------------------------------------------------------
const EventsTab = ({ performers, onPerformerCreated }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editEvent, setEditEvent] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyEvent);
    const [performerDialogOpen, setPerformerDialogOpen] = useState(false);

    const loadEvents = () => {
        setLoading(true);
        fetch(`${API_URL}/api/events?all=true`)
            .then(res => res.json())
            .then(data => setEvents(Array.isArray(data) ? data : []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadEvents(); }, []);

    const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handlePerformerSelect = (e) => {
        const pid = e.target.value;
        setForm(prev => ({ ...prev, performerId: pid }));
        const performer = performers.find(p => p._id === pid);
        if (performer) {
            setForm(prev => ({
                ...prev,
                performerId: pid,
                title: performer.title || prev.title,
                image: performer.image || prev.image,
                descEn: performer.descEn || prev.descEn,
                descRu: performer.descRu || prev.descRu,
                descHe: performer.descHe || prev.descHe,
            }));
        }
    };

    const openAdd = () => {
        setEditEvent(null);
        setForm(emptyEvent);
        setShowForm(true);
    };

    const openEdit = (event) => {
        setEditEvent(event);
        setForm({
            performerId: event.performerId || '',
            title: event.title || '',
            image: event.image || '',
            descEn: event.descEn || '',
            descRu: event.descRu || '',
            descHe: event.descHe || '',
            date: event.date ? event.date.slice(0, 10) : '',
            open: event.open || '20:00',
            start: event.start || '21:00',
            price: event.price ?? '',
        });
        setShowForm(true);
    };

    const cancelForm = () => { setShowForm(false); setEditEvent(null); };

    const handleSave = async () => {
        try {
            const method = editEvent ? 'PUT' : 'POST';
            const url = editEvent ? `${API_URL}/api/events/${editEvent._id}` : `${API_URL}/api/events`;
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error('Failed to save event');
            setShowForm(false);
            setEditEvent(null);
            loadEvents();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить событие?')) return;
        try {
            const res = await fetch(`${API_URL}/api/events/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            loadEvents();
        } catch (err) {
            alert(err.message);
        }
    };

    const handlePerformerCreated = (performer) => {
        onPerformerCreated(performer);
        setForm(prev => ({
            ...prev,
            performerId: performer._id,
            title: performer.title || prev.title,
            image: performer.image || prev.image,
            descEn: performer.descEn || prev.descEn,
            descRu: performer.descRu || prev.descRu,
            descHe: performer.descHe || prev.descHe,
        }));
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>События</Typography>
                {!showForm && (
                    <Button startIcon={<AddIcon />} onClick={openAdd} variant="outlined"
                        sx={{ color: '#e53935', borderColor: '#e53935' }}>
                        Добавить
                    </Button>
                )}
            </Box>

            {loading ? (
                <CircularProgress sx={{ color: '#e53935' }} />
            ) : (
                <Box sx={{ mb: 3 }}>
                    {events.length === 0 && <Typography sx={{ color: '#aaa' }}>Нет событий</Typography>}
                    {events.map(event => (
                        <Box key={event._id} sx={{
                            display: 'flex', alignItems: 'center', gap: 2,
                            backgroundColor: '#2a2a2a', borderRadius: 1, p: 2, mb: 1
                        }}>
                            {event.image && (
                                <img src={getImageUrl(event.image)} alt=""
                                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                            )}
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
                                    {event.title || '—'}
                                </Typography>
                                <Typography sx={{ color: '#aaa', fontSize: '0.8rem' }}>
                                    {event.date ? new Date(event.date).toLocaleDateString('ru-RU') : '—'}
                                    {event.price != null && ` · ${event.price}₪`}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => openEdit(event)} sx={{ color: '#90caf9' }} size="small">
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton onClick={() => handleDelete(event._id)} sx={{ color: '#ef5350' }} size="small">
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            )}

            {showForm && (
                <Box sx={{ backgroundColor: '#2a2a2a', borderRadius: 2, p: 3 }}>
                    <Typography sx={{ color: '#fff', fontWeight: 'bold', mb: 2 }}>
                        {editEvent ? 'Редактировать событие' : 'Новое событие'}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <FormControl size="small" sx={{ minWidth: 250 }}>
                            <InputLabel sx={{ color: '#aaa', '&.Mui-focused': { color: '#e53935' } }}>
                                Исполнитель
                            </InputLabel>
                            <Select
                                value={form.performerId}
                                onChange={handlePerformerSelect}
                                label="Исполнитель"
                                sx={selectSx}
                                MenuProps={{ PaperProps: { sx: { backgroundColor: '#2a2a2a', color: '#fff' } } }}
                            >
                                <MenuItem value=""><em>— не выбран —</em></MenuItem>
                                {performers.map(p => (
                                    <MenuItem key={p._id} value={p._id}>{p.title}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            startIcon={<AddIcon />}
                            onClick={() => setPerformerDialogOpen(true)}
                            variant="outlined"
                            size="small"
                            sx={{ color: '#90caf9', borderColor: '#90caf9' }}
                        >
                            Создать исполнителя
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 500 }}>
                        <TextField label="Название (title)" value={form.title} onChange={handleChange('title')} size="small" sx={fieldSx} />
                        <TextField label="image (fileId)" value={form.image} onChange={handleChange('image')} size="small" sx={fieldSx} />
                        {['descEn', 'descRu', 'descHe'].map(f => (
                            <TextField key={f} label={f} value={form[f]} onChange={handleChange(f)} size="small" multiline rows={2} sx={fieldSx} />
                        ))}
                        <TextField label="Дата" type="date" value={form.date} onChange={handleChange('date')}
                            size="small" InputLabelProps={{ shrink: true }} sx={fieldSx} />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Открытие (open)" value={form.open} onChange={handleChange('open')} size="small" sx={{ ...fieldSx, flex: 1 }} />
                            <TextField label="Начало (start)" value={form.start} onChange={handleChange('start')} size="small" sx={{ ...fieldSx, flex: 1 }} />
                        </Box>
                        <TextField label="Цена (price)" type="number" value={form.price} onChange={handleChange('price')} size="small" sx={fieldSx} />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                        <Button onClick={cancelForm} sx={{ color: '#aaa' }}>Cancel</Button>
                        <Button onClick={handleSave} variant="contained"
                            sx={{ backgroundColor: '#e53935', '&:hover': { backgroundColor: '#c62828' } }}>
                            Save
                        </Button>
                    </Box>
                </Box>
            )}

            <PerformerDialog
                open={performerDialogOpen}
                onClose={() => setPerformerDialogOpen(false)}
                editPerformer={null}
                onSaved={handlePerformerCreated}
            />
        </Box>
    );
};

// -----------------------------------------------------------------------
// Performers Tab
// -----------------------------------------------------------------------
const PerformersTab = ({ performers, onReload }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editPerformer, setEditPerformer] = useState(null);

    const openAdd = () => { setEditPerformer(null); setDialogOpen(true); };
    const openEdit = (p) => { setEditPerformer(p); setDialogOpen(true); };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить исполнителя?')) return;
        try {
            const res = await fetch(`${API_URL}/api/performers/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            onReload();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>Исполнители</Typography>
                <Button startIcon={<AddIcon />} onClick={openAdd} variant="outlined"
                    sx={{ color: '#e53935', borderColor: '#e53935' }}>
                    Добавить
                </Button>
            </Box>

            {performers.length === 0 && <Typography sx={{ color: '#aaa' }}>Нет исполнителей</Typography>}
            {performers.map(p => (
                <Box key={p._id} sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    backgroundColor: '#2a2a2a', borderRadius: 1, p: 2, mb: 1
                }}>
                    {p.image && (
                        <img src={getImageUrl(p.image)} alt={p.title}
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '50%' }} />
                    )}
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{p.title}</Typography>
                    </Box>
                    <IconButton onClick={() => openEdit(p)} sx={{ color: '#90caf9' }} size="small">
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(p._id)} sx={{ color: '#ef5350' }} size="small">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            ))}

            <PerformerDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                editPerformer={editPerformer}
                onSaved={() => { setDialogOpen(false); onReload(); }}
            />
        </Box>
    );
};

// -----------------------------------------------------------------------
// AdminEvents root
// -----------------------------------------------------------------------
const AdminEvents = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const [performers, setPerformers] = useState([]);

    const loadPerformers = () => {
        fetch(`${API_URL}/api/performers`)
            .then(res => res.json())
            .then(data => setPerformers(Array.isArray(data) ? data : []))
            .catch(console.error);
    };

    useEffect(() => { loadPerformers(); }, []);

    const handlePerformerCreated = (performer) => {
        setPerformers(prev => [...prev, performer]);
    };

    return (
        <Box>
            <Tabs
                value={tabIndex}
                onChange={(_, v) => setTabIndex(v)}
                sx={{
                    mb: 3,
                    '& .MuiTab-root': { color: '#aaa', textTransform: 'none' },
                    '& .Mui-selected': { color: '#fff' },
                    '& .MuiTabs-indicator': { backgroundColor: '#e53935' },
                }}
            >
                <Tab label="События" />
                <Tab label="Исполнители" />
            </Tabs>

            <Divider sx={{ borderColor: '#3a3a3a', mb: 3 }} />

            {tabIndex === 0 && (
                <EventsTab
                    performers={performers}
                    onPerformerCreated={handlePerformerCreated}
                />
            )}
            {tabIndex === 1 && (
                <PerformersTab
                    performers={performers}
                    onReload={loadPerformers}
                />
            )}
        </Box>
    );
};

export default AdminEvents;
