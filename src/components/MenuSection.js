import MenuItem from "./MenuItem";
import {useTranslation} from '../utils/useTranslation';

const MenuSection = ({item, direct}) => {
    const {getLabel} = useTranslation();

    return (
        <div>
            <p style={{fontWeight: "bold", textAlign: "center", marginBottom: 0}}>{getLabel(item)}</p>
            <div style={{display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1vw"}}>
                {item.items && item.items.filter(i => !i.hidden).map((menuItem, index) =>
                    <MenuItem item={menuItem} layout={direct ? 'column' : 'row'} key={index} />
                )}
            </div>
        </div>);
};

export default MenuSection;