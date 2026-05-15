import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Button, Typography, TextField, IconButton,
    CircularProgress, Divider, LinearProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const API_URL = process.env.REACT_APP_API_URL || '';
const GALLERY_FOLDER_ID = '1vgFTvXTjniT1Pg4w0PqGV5k6BYNrK_pP';

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

const emptyForm = { titleEn: '', titleRu: '', titleHe: '', date: '' };

const AdminGallery = () => {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [creating, setCreating] = useState(false);
    const [newAlbum, setNewAlbum] = useState(null);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [uploadedFileIds, setUploadedFileIds] = useState([]);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [saving, setSaving] = useState(false);
    const filesRef = useRef(null);

    const loadAlbums = () => {
        setLoading(true);
        fetch(`${API_URL}/api/albums`)
            .then(res => res.json())
            .then(data => setAlbums(Array.isArray(data) ? data : []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadAlbums(); }, []);

    const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleCreate = async () => {
        if (!form.titleRu && !form.titleEn) return alert('Введите название альбома');
        setCreating(true);
        try {
            const res = await fetch(`${API_URL}/api/albums`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, items: [] }),
            });
            if (!res.ok) throw new Error('Failed to create album');
            const album = await res.json();
            setNewAlbum(album);
            setForm(emptyForm);
            setUploadedFileIds([]);
            setUploadedCount(0);
            setTotalCount(0);
            loadAlbums();
        } catch (err) {
            alert(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleUploadPhotos = async () => {
        const files = filesRef.current?.files;
        if (!files || files.length === 0) return alert('Выберите файлы');
        setUploadingPhotos(true);
        setTotalCount(files.length);
        setUploadedCount(0);
        const ids = [];
        const errors = [];
        for (let i = 0; i < files.length; i++) {
            try {
                const fd = new FormData();
                fd.append('file', files[i]);
                fd.append('folderId', GALLERY_FOLDER_ID);
                const res = await fetch(`${API_URL}/api/drive/upload`, { method: 'POST', body: fd });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Upload failed');
                ids.push(data.fileId);
                setUploadedCount(i + 1);
            } catch (err) {
                errors.push(files[i].name + ': ' + err.message);
                setUploadedCount(i + 1);
            }
        }
        setUploadingPhotos(false);
        if (errors.length > 0) {
            alert('Ошибки при загрузке:\n' + errors.join('\n'));
        }
        setUploadedFileIds(ids);
    };

    const handleSaveAlbum = async () => {
        if (!newAlbum) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/albums/${newAlbum._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: uploadedFileIds }),
            });
            if (!res.ok) throw new Error('Failed to save album');
            setNewAlbum(null);
            setUploadedFileIds([]);
            setUploadedCount(0);
            setTotalCount(0);
            loadAlbums();
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить альбом?')) return;
        try {
            const res = await fetch(`${API_URL}/api/albums/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            loadAlbums();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 'bold' }}>Альбомы</Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress sx={{ color: '#e53935' }} />
                </Box>
            ) : (
                <Box sx={{ mb: 4 }}>
                    {albums.length === 0 && (
                        <Typography sx={{ color: '#aaa', mb: 2 }}>Нет альбомов</Typography>
                    )}
                    {albums.map(album => (
                        <Box
                            key={album._id}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 2,
                                backgroundColor: '#2a2a2a', borderRadius: 1, p: 2, mb: 1
                            }}
                        >
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
                                    {album.titleRu || album.titleEn}
                                </Typography>
                                <Typography sx={{ color: '#aaa', fontSize: '0.8rem' }}>
                                    {album.date ? new Date(album.date).toLocaleDateString('ru-RU') : '—'} &nbsp;·&nbsp;
                                    {album.items ? album.items.length : 0} фото
                                </Typography>
                            </Box>
                            <IconButton
                                onClick={() => handleDelete(album._id)}
                                sx={{ color: '#ef5350' }} size="small"
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            )}

            <Divider sx={{ borderColor: '#3a3a3a', mb: 3 }} />

            <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 'bold' }}>
                Создать новый альбом
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 500 }}>
                <TextField label="titleRu" value={form.titleRu} onChange={handleChange('titleRu')} size="small" sx={fieldSx} />
                <TextField label="titleEn" value={form.titleEn} onChange={handleChange('titleEn')} size="small" sx={fieldSx} />
                <TextField label="titleHe" value={form.titleHe} onChange={handleChange('titleHe')} size="small" sx={fieldSx} />
                <TextField
                    label="Дата"
                    type="date"
                    value={form.date}
                    onChange={handleChange('date')}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    sx={fieldSx}
                />
                <Button
                    onClick={handleCreate}
                    disabled={creating}
                    variant="contained"
                    sx={{ backgroundColor: '#e53935', '&:hover': { backgroundColor: '#c62828' }, alignSelf: 'flex-start' }}
                >
                    {creating ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Создать альбом'}
                </Button>
            </Box>

            {newAlbum && (
                <Box sx={{ mt: 4, backgroundColor: '#2a2a2a', borderRadius: 2, p: 3 }}>
                    <Typography sx={{ color: '#66bb6a', fontWeight: 'bold', mb: 2 }}>
                        Альбом создан: {newAlbum.titleRu || newAlbum.titleEn}
                    </Typography>
                    <Typography sx={{ color: '#aaa', mb: 2 }}>
                        Загрузите фотографии в этот альбом:
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
                        <input type="file" accept="image/*" multiple ref={filesRef} style={{ color: '#aaa' }} />
                        <Button
                            onClick={handleUploadPhotos}
                            disabled={uploadingPhotos}
                            variant="outlined"
                            sx={{ color: '#90caf9', borderColor: '#90caf9', minWidth: 180 }}
                        >
                            {uploadingPhotos ? <CircularProgress size={18} sx={{ color: '#90caf9' }} /> : 'Загрузить все в Drive'}
                        </Button>
                    </Box>

                    {totalCount > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ color: '#aaa', mb: 1, fontSize: '0.9rem' }}>
                                Загружено {uploadedCount} из {totalCount}
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={(uploadedCount / totalCount) * 100}
                                sx={{ backgroundColor: '#3a3a3a', '& .MuiLinearProgress-bar': { backgroundColor: '#66bb6a' } }}
                            />
                        </Box>
                    )}

                    {uploadedFileIds.length > 0 && uploadedFileIds.length === totalCount && (
                        <Button
                            onClick={handleSaveAlbum}
                            disabled={saving}
                            variant="contained"
                            sx={{ backgroundColor: '#66bb6a', '&:hover': { backgroundColor: '#43a047' } }}
                        >
                            {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : `Сохранить альбом с фото (${uploadedFileIds.length})`}
                        </Button>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default AdminGallery;
