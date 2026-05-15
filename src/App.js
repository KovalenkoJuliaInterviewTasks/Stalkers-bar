import './App.css';
import { Routes, Route } from 'react-router-dom';
import Header from "./components/Header";
import Main from "./components/Main";
import Footer from "./components/Footer";
import AdminLayout from "./components/admin/AdminLayout";

function App() {
    return (
        <Routes>
            <Route path="/superadmins/*" element={<AdminLayout />} />
            <Route
                path="*"
                element={
                    <div className="App">
                        <Header />
                        <Main />
                        <Footer />
                    </div>
                }
            />
        </Routes>
    );
}

export default App;
