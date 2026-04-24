import { useLocation, useNavigate } from 'react-router-dom';
import './BottomNavigation.css';

export const BottomNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isProfile = location.pathname === '/profile';
    const isHome = location.pathname === '/';
    const isFavourites = location.pathname === '/favourites';

    return (
        <nav className="bottom-navigation">
            <button
                className={`nav-item ${isProfile ? 'active' : ''}`}
                onClick={() => navigate('/profile')}
                type="button"
            >
                {isProfile ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none">
                        <path d="M10 1.75C11.933 1.75 13.5 3.317 13.5 5.25C13.5 7.183 11.933 8.75 10 8.75C8.067 8.75 6.5 7.183 6.5 5.25C6.5 3.317 8.067 1.75 10 1.75Z" fill="#414141" />
                        <path d="M3 16.25C3 13.6266 5.12665 11.5 7.75 11.5H12.25C14.8734 11.5 17 13.6266 17 16.25V18.25H3V16.25Z" fill="#414141" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none">
                        <path d="M10 1.75C11.933 1.75 13.5 3.317 13.5 5.25C13.5 7.183 11.933 8.75 10 8.75C8.067 8.75 6.5 7.183 6.5 5.25C6.5 3.317 8.067 1.75 10 1.75Z" stroke="#414141" strokeWidth="1.8" />
                        <path d="M3 16.25C3 13.6266 5.12665 11.5 7.75 11.5H12.25C14.8734 11.5 17 13.6266 17 16.25V18.25H3V16.25Z" stroke="#414141" strokeWidth="1.8" />
                    </svg>
                )}
                <span>Профиль</span>
            </button>
            <button
                className={`nav-item ${isHome ? 'active' : ''}`}
                onClick={() => navigate('/')}
                type="button"
            >
               
                
                {isHome ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="22" viewBox="0 0 24 22" fill="none">
                    <path d="M16.7634 20.3918H6.79336C5.68879 20.3918 4.79336 19.4964 4.79336 18.3918L4.79337 13.794C4.79337 12.7481 3.94547 11.9002 2.89954 11.9002C1.12193 11.9002 0.323729 9.6722 1.69694 8.54339L10.32 1.455C11.0684 0.839768 12.1502 0.849452 12.8875 1.47798L21.5819 8.88972C22.7915 9.92083 22.0623 11.9002 20.4729 11.9002C19.5287 11.9002 18.7634 12.6656 18.7634 13.6097V18.3918C18.7634 19.4964 17.8679 20.3918 16.7634 20.3918Z" fill="#414141" stroke="#414141" stroke-width="2"/>
                    </svg>
                ) : (
                    
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="22" viewBox="0 0 24 22" fill="none">
                 <path d="M16.7634 20.3918H6.79336C5.68879 20.3918 4.79336 19.4964 4.79336 18.3918L4.79337 13.794C4.79337 12.7481 3.94547 11.9002 2.89954 11.9002C1.12193 11.9002 0.323729 9.6722 1.69694 8.54339L10.32 1.455C11.0684 0.839768 12.1502 0.849452 12.8875 1.47798L21.5819 8.88972C22.7915 9.92083 22.0623 11.9002 20.4729 11.9002C19.5287 11.9002 18.7634 12.6656 18.7634 13.6097V18.3918C18.7634 19.4964 17.8679 20.3918 16.7634 20.3918Z" stroke="#414141" strokeWidth="2" />
                </svg>

                )}

                <span>Лента</span>
            </button>
            <button
                className={`nav-item ${isFavourites ? 'active' : ''}`}
                onClick={() => navigate('/favourites')}
                type="button"
            >
                {isFavourites ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="21" viewBox="0 0 24 21" fill="none">
                    <path d="M18.1857 1C13.5464 1 13.5464 4.75243 12 4.75243C10.4536 4.75243 10.4536 1 5.81429 1C1.56161 1 0.364775 5.56486 1.2971 9.22077C2.22941 12.8767 8.90714 20 12 20C15.0929 20 21.7706 12.8767 22.7029 9.22077C23.6352 5.56486 22.4384 1 18.1857 1Z" fill="#414141" stroke="#414141" stroke-width="2"/>
                    </svg>
                ) : (
                    <svg width="23" height="21" viewBox="0 0 23 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.5 4.75243C10.0239 4.75243 10.0239 1 5.59545 1C1.53608 1 0.393649 5.56486 1.28359 9.22078C2.17353 12.8767 8.54773 20 11.5 20" stroke="#414141" stroke-width="2" />
                        <path d="M11.5 4.75243C12.9761 4.75243 12.9761 1 17.4045 1C21.4639 1 22.6064 5.56486 21.7164 9.22078C20.8265 12.8767 14.4523 20 11.5 20" stroke="#414141" stroke-width="2" />
                    </svg>

                )}
                <span>Избранное</span>
            </button>
        </nav>
    );
};
