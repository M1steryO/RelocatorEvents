import { useLocation, useNavigate } from 'react-router-dom';
import './BottomNavigation.css';

export const BottomNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isProfile = location.pathname === '/profile';
    const isHome = location.pathname === '/';
    const isFavourites = location.pathname === '/favourites';

    const navigateWithTransition = (path: '/profile' | '/' | '/favourites') => {
        if (location.pathname === path) {
            return;
        }

        const goToPath = () => navigate(path);
        const transitionDocument = document as Document & {
            startViewTransition?: (callback: () => void) => unknown;
        };

        if (typeof transitionDocument.startViewTransition === 'function') {
            transitionDocument.startViewTransition(goToPath);
            return;
        }

        goToPath();
    };

    return (
        <nav className="bottom-navigation">
            <button
                className={`nav-item ${isProfile ? 'active' : ''}`}
                onClick={() => navigateWithTransition('/profile')}
                type="button"
            >
                {isProfile ? (
                    <svg width="19" height="21" viewBox="0 0 19 21" fill="#414141" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.49989 8C7.45951 8 5.80545 6.433 5.80545 4.5C5.80545 2.567 7.45951 1 9.49989 1C11.5403 1 13.1943 2.567 13.1943 4.5C13.1943 6.433 11.5403 8 9.49989 8Z" stroke="#414141" stroke-width="2"/>
                    <path d="M1.96573 13.7924C2.49221 12.1299 4.03516 11 5.7791 11L13.2209 11C14.9648 11 16.5078 12.1299 17.0343 13.7924L17.3509 14.7924C18.1675 17.3711 16.2425 20 13.5376 20H5.46243C2.75752 20 0.832472 17.3711 1.64906 14.7924L1.96573 13.7924Z" stroke="#414141" stroke-width="2"/>
                    </svg>
                    
                ) : (
                    <svg width="19" height="21" viewBox="0 0 19 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.49989 8C7.45951 8 5.80545 6.433 5.80545 4.5C5.80545 2.567 7.45951 1 9.49989 1C11.5403 1 13.1943 2.567 13.1943 4.5C13.1943 6.433 11.5403 8 9.49989 8Z" stroke="#414141" stroke-width="2" />
                        <path d="M1.96573 13.7924C2.49221 12.1299 4.03516 11 5.7791 11L13.2209 11C14.9648 11 16.5078 12.1299 17.0343 13.7924L17.3509 14.7924C18.1675 17.3711 16.2425 20 13.5376 20H5.46243C2.75752 20 0.832472 17.3711 1.64906 14.7924L1.96573 13.7924Z" stroke="#414141" stroke-width="2" />
                    </svg>

                )}
                <span>Профиль</span>
            </button>
            <button
                className={`nav-item ${isHome ? 'active' : ''}`}
                onClick={() => navigateWithTransition('/')}
                type="button"
            >


                {isHome ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="22" viewBox="0 0 24 22" fill="none">
                        <path d="M16.7634 20.3918H6.79336C5.68879 20.3918 4.79336 19.4964 4.79336 18.3918L4.79337 13.794C4.79337 12.7481 3.94547 11.9002 2.89954 11.9002C1.12193 11.9002 0.323729 9.6722 1.69694 8.54339L10.32 1.455C11.0684 0.839768 12.1502 0.849452 12.8875 1.47798L21.5819 8.88972C22.7915 9.92083 22.0623 11.9002 20.4729 11.9002C19.5287 11.9002 18.7634 12.6656 18.7634 13.6097V18.3918C18.7634 19.4964 17.8679 20.3918 16.7634 20.3918Z" fill="#414141" stroke="#414141" stroke-width="2" />
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
                onClick={() => navigateWithTransition('/favourites')}
                type="button"
            >
                {isFavourites ? (
                    <svg width="23" height="21" viewBox="0 0 23 21" fill="#414141" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.5 4.75243C10.0239 4.75243 10.0239 1 5.59545 1C1.53608 1 0.393649 5.56486 1.28359 9.22078C2.17353 12.8767 8.54773 20 11.5 20" stroke="#414141" stroke-width="2" />
                    <path d="M11.5 4.75243C12.9761 4.75243 12.9761 1 17.4045 1C21.4639 1 22.6064 5.56486 21.7164 9.22078C20.8265 12.8767 14.4523 20 11.5 20" stroke="#414141" stroke-width="2" />
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
