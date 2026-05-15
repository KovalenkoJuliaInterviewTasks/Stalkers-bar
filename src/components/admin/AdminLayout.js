import React from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import AdminMenu from './AdminMenu';
import AdminGallery from './AdminGallery';
import AdminEvents from './AdminEvents';

const AdminLayout = () => {
    const location = useLocation();

    const getTabValue = () => {
        if (location.pathname.startsWith('/superadmins/gallery')) return 1;
        if (location.pathname.startsWith('/superadmins/events')) return 2;
        return 0;
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#1a1a1a', color: '#fff' }}>
            <Box sx={{ backgroundColor: '#0d0d0d', borderBottom: '1px solid #3a3a3a', px: 3, py: 2 }}>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold', mb: 2 }}>
                    Admin Panel
                </Typography>
                <Tabs
                    value={getTabValue()}
                    sx={{
                        '& .MuiTab-root': { color: '#aaa', textTransform: 'none', fontSize: '1rem' },
                        '& .Mui-selected': { color: '#fff' },
                        '& .MuiTabs-indicator': { backgroundColor: '#e53935' },
                    }}
                >
                    <Tab label="Menu" component={Link} to="/superadmins/menu" />
                    <Tab label="Gallery" component={Link} to="/superadmins/gallery" />
                    <Tab label="Events" component={Link} to="/superadmins/events" />
                </Tabs>
            </Box>

            <Box sx={{ p: 3 }}>
                <Routes>
                    <Route path="menu" element={<AdminMenu />} />
                    <Route path="gallery" element={<AdminGallery />} />
                    <Route path="events" element={<AdminEvents />} />
                    <Route index element={<AdminMenu />} />
                </Routes>
            </Box>
        </Box>
    );
};

export default AdminLayout;
