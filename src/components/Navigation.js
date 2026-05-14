import NavigatorDesktop from "./NavigatorDesktop";


const Navigation = ({items}) =>
{
    return (
        <nav className={'w-100'} style={{
            display: "flex",
            justifyContent: "flex-start",
            gap: "6px",
            flexWrap: "nowrap",
            paddingLeft: "10px",
            paddingTop: "4px",
            paddingBottom: "4px"
        }}>
                {items.map(item => <NavigatorDesktop key={item.route} item={item}/>)}
        </nav>
    );
};

export default Navigation;