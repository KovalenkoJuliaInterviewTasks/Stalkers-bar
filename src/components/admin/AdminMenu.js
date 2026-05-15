import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Button, Tabs, Tab, Typography, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, IconButton, CircularProgress, Chip, Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AddIcon from '@mui/icons-material/Add';
import { getImageUrl } from '../../utils/imageUrl';

const API_URL = process.env.REACT_APP_API_URL || '';
const MENU_FOLDER_ID = '146eQxN5UcpWWywNfAosXT-R6sVEUC6Mv';

const MENU_TYPES = [
    { key: 'bar', label: 'Жидкости' },
    { key: 'food', label: 'Твёрдое топливо' },
    { key: 'dessert', label: 'Сладкое топливо' },
];

const emptyItem = {
    titleEn: '', titleRu: '', titleHe: '',
    descEn: '', descRu: '', descHe: '',
    cost1: '', cap1: '', cost2: '', cap2: '',
    image: '',
};

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

const AdminMenu = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [currentSectionId, setCurrentSectionId] = useState(null);
    const [formData, setFormData] = useState(emptyItem);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

    const menuType = MENU_TYPES[tabIndex].key;

    const loadSections = () => {
        setLoading(true);
        fetch(`${API_URL}/api/menu/${menuType}`)
            .then(res => res.json())
            .then(data => setSections(Array.isArray(data) ? data : [data]))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadSections(); }, [tabIndex]);

    const openAddDialog = (sectionId) => {
        setEditItem(null);
        setCurrentSectionId(sectionId);
        setFormData(emptyItem);
        setDialogOpen(true);
    };

    const openEditDialog = (sectionId, item) => {
        setEditItem(item);
        setCurrentSectionId(sectionId);
        setFormData({ ...emptyItem, ...item });
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setEditItem(null);
        setFormData(emptyItem);
    };

    const handleChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleUpload = async () => {
        const file = fileRef.current?.files[0];
        if (!file) return alert('Выберите файл');
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('folderId', MENU_FOLDER_ID);
            const res = await fetch(`${API_URL}/api/drive/upload`, { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            setFormData(prev => ({ ...prev, image: data.fileId }));
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            const payload = { ...formData };
            if (editItem) {
                const res = await fetch(`${API_URL}/api/menu/${currentSectionId}/items/${editItem._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error('Failed to update item');
            } else {
                const res = await fetch(`${API_URL}/api/menu/${currentSectionId}/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error('Failed to add item');
            }
            closeDialog();
            loadSections();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleToggle = async (sectionId, itemId) => {
        try {
            const res = await fetch(`${API_URL}/api/menu/${sectionId}/items/${itemId}/toggle`, { method: 'PATCH' });
            if (!res.ok) throw new Error('Failed to toggle');
            loadSections();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (sectionId, itemId) => {
        if (!window.confirm('Удалить позицию?')) return;
        try {
            const res = await fetch(`${API_URL}/api/menu/${sectionId}/items/${itemId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            loadSections();
        } catch (err) {
            alert(err.message);
        }
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
                {MENU_TYPES.map(t => <Tab key={t.key} label={t.label} />)}
            </Tabs>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress sx={{ color: '#e53935' }} />
                </Box>
            ) : (
                sections.map(section => (
                    <Box key={section._id || section.sectionId} sx={{ mb: 4, backgroundColor: '#2a2a2a', borderRadius: 2, p: 2 }}>
                        <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 'bold' }}>
                            {section.titleRu || section.titleEn || 'Секция'}
                        </Typography>
                        <Divider sx={{ borderColor: '#3a3a3a', mb: 2 }} />

                        {section.items && section.items.map(item => (
                            <Box
                                key={item._id}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: 2, mb: 1,
                                    backgroundColor: '#3a3a3a', borderRadius: 1, p: 1,
                                    opacity: item.hidden ? 0.5 : 1,
                                }}
                            >
                                {item.image && (
                                    <img
                                        src={getImageUrl(item.image)}
                                        alt={item.titleRu}
                                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                                    />
                                )}
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
                                        {item.titleRu || item.titleEn}
                                    </Typography>
                                    {(item.cost1 || item.cost2) && (
                                        <Typography sx={{ color: '#aaa', fontSize: '0.85rem' }}>
                                            {item.cost1 && `${item.cost1}₪ (${item.cap1})`}
                                            {item.cost1 && item.cost2 && ' / '}
                                            {item.cost2 && `${item.cost2}₪ (${item.cap2})`}
                                        </Typography>
                                    )}
                                </Box>
                                {item.hidden && (
                                    <Chip label="Скрыто" size="small" sx={{ backgroundColor: '#555', color: '#aaa' }} />
                                )}
                                <IconButton
                                    onClick={() => openEditDialog(section.sectionId, item)}
                                    sx={{ color: '#90caf9' }} size="small"
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    onClick={() => handleToggle(section.sectionId, item._id)}
                                    sx={{ color: item.hidden ? '#66bb6a' : '#ffa726' }} size="small"
                                >
                                    {item.hidden ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                                </IconButton>
                                <IconButton
                                    onClick={() => handleDelete(section.sectionId, item._id)}
                                    sx={{ color: '#ef5350' }} size="small"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}

                        <Button
                            startIcon={<AddIcon />}
                            onClick={() => openAddDialog(section.sectionId)}
                            sx={{ mt: 1, color: '#e53935', borderColor: '#e53935', '&:hover': { borderColor: '#ff6659', backgroundColor: 'rgba(229,57,53,0.08)' } }}
                            variant="outlined"
                            size="small"
                        >
                            Добавить позицию
                        </Button>
                    </Box>
                ))
            )}

            <Dialog
                open={dialogOpen}
                onClose={closeDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { backgroundColor: '#1a1a1a', color: '#fff' } }}
            >
                <DialogTitle sx={{ color: '#fff', borderBottom: '1px solid #3a3a3a' }}>
                    {editItem ? 'Редактировать позицию' : 'Добавить позицию'}
                </DialogTitle>
                <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {['titleEn', 'titleRu', 'titleHe'].map(f => (
                        <TextField key={f} label={f} value={formData[f]} onChange={handleChange(f)} size="small" sx={fieldSx} />
                    ))}
                    {['descEn', 'descRu', 'descHe'].map(f => (
                        <TextField key={f} label={f} value={formData[f]} onChange={handleChange(f)} size="small" multiline rows={2} sx={fieldSx} />
                    ))}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="cost1" value={formData.cost1} onChange={handleChange('cost1')} size="small" sx={{ ...fieldSx, flex: 1 }} />
                        <TextField label="cap1" value={formData.cap1} onChange={handleChange('cap1')} size="small" sx={{ ...fieldSx, flex: 1 }} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="cost2" value={formData.cost2} onChange={handleChange('cost2')} size="small" sx={{ ...fieldSx, flex: 1 }} />
                        <TextField label="cap2" value={formData.cap2} onChange={handleChange('cap2')} size="small" sx={{ ...fieldSx, flex: 1 }} />
                    </Box>

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
                        {formData.image && (
                            <Box sx={{ mt: 1 }}>
                                <img
                                    src={getImageUrl(formData.image)}
                                    alt="preview"
                                    style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                                />
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid #3a3a3a', px: 3, py: 2 }}>
                    <Button onClick={closeDialog} sx={{ color: '#aaa' }}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: '#e53935', '&:hover': { backgroundColor: '#c62828' } }}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminMenu;
