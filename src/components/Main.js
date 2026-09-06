import {Route, Routes} from "react-router-dom";
import Home from "./Home";
import Gallery from "./Gallery";
import Menu from "./Menu";
import Events from "./Events";

const Main = () =>
{
    return (
        <div className={'main'}>
            <Routes>
                <Route index element={<Home/>}/>
                <Route path="home" element={<Home/>}/>
                <Route path="events" element={<Events/>}/>
                <Route path="menu" element={<Menu/>}/>
                <Route path="gallery" element={<Gallery/>}/>
                <Route path="*" element={<Home />} />
            </Routes>
        </div>
   );
};

export default Main;