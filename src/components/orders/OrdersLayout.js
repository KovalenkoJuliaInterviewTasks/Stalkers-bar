import React from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import TablesList from './TablesList';
import TableOrder from './TableOrder';
import StationScreen from './StationScreen';
import PrinterStatus from './PrinterStatus';
import { ACCENT } from './styles';

const OrdersLayout = () => {
    const location = useLocation();

    const tab = location.pathname.startsWith('/orders/kitchen') ? 1
        : location.pathname.startsWith('/orders/bar') ? 2 : 0;

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#1a1a1a', color: '#fff' }}>
            <Box sx={{ backgroundColor: '#0d0d0d', borderBottom: '1px solid #3a3a3a', px: { xs: 2, sm: 3 }, pt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Заказы</Typography>
                    <PrinterStatus />
                </Box>
                <Tabs
                    value={tab}
                    variant="fullWidth"
                    sx={{
                        maxWidth: 480,
                        '& .MuiTab-root': { color: '#aaa', textTransform: 'none', fontSize: '1rem' },
                        '& .Mui-selected': { color: '#fff !important' },
                        '& .MuiTabs-indicator': { backgroundColor: ACCENT },
                    }}
                >
                    <Tab label="Столы" component={Link} to="/orders" />
                    <Tab label="Кухня" component={Link} to="/orders/kitchen" />
                    <Tab label="Бар" component={Link} to="/orders/bar" />
                </Tabs>
            </Box>

            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1100, mx: 'auto' }}>
                <Routes>
                    <Route index element={<TablesList />} />
                    <Route path="kitchen" element={<StationScreen station="kitchen" />} />
                    <Route path="bar" element={<StationScreen station="bar" />} />
                    <Route path=":id" element={<TableOrder />} />
                </Routes>
            </Box>
        </Box>
    );
};

export default OrdersLayout;
