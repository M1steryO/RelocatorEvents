import { useLocation, useNavigate } from 'react-router-dom';
import './BottomNavigation.css';

export const BottomNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <nav className="bottom-navigation">
            <button
                className={`nav-item ${isHome ? 'active' : ''}`}
                onClick={() => navigate('/')}
                type="button"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="22" viewBox="0 0 24 22" fill="none">
                    <path d="M16.7634 20.3918H6.79336C5.68879 20.3918 4.79336 19.4964 4.79336 18.3918L4.79337 13.794C4.79337 12.7481 3.94547 11.9002 2.89954 11.9002C1.12193 11.9002 0.323729 9.6722 1.69694 8.54339L10.32 1.455C11.0684 0.839768 12.1502 0.849452 12.8875 1.47798L21.5819 8.88972C22.7915 9.92083 22.0623 11.9002 20.4729 11.9002C19.5287 11.9002 18.7634 12.6656 18.7634 13.6097V18.3918C18.7634 19.4964 17.8679 20.3918 16.7634 20.3918Z" stroke="#414141" strokeWidth="2"/>
                </svg>
                <span>Лента</span>
            </button>
        </nav>
    );
};
