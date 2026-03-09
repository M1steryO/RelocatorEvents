import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { favouritesService } from '../services/favouritesService';
import { useAuth } from './AuthContext';

type FavouriteIds = Set<number>;

interface FavouritesContextType {
    favouriteIds: FavouriteIds;
    isFavourite: (eventId: number) => boolean;
    addFavourite: (eventId: number) => Promise<void>;
    removeFavourite: (eventId: number) => Promise<void>;
    toggleFavourite: (eventId: number) => Promise<void>;
    /** Синхронизировать список id избранного (вызывается со страницы избранного после загрузки списка). */
    syncFavouriteIds: (ids: number[]) => void;
}

const FavouritesContext = createContext<FavouritesContextType | undefined>(undefined);

export const useFavourites = () => {
    const ctx = useContext(FavouritesContext);
    if (!ctx) {
        throw new Error('useFavourites must be used within FavouritesProvider');
    }
    return ctx;
};

interface FavouritesProviderProps {
    children: ReactNode;
}

export const FavouritesProvider = ({ children }: FavouritesProviderProps) => {
    const { isAuthenticated } = useAuth();
    const [favouriteIds, setFavouriteIds] = useState<FavouriteIds>(new Set());

    const syncFavouriteIds = useCallback((ids: number[]) => {
        setFavouriteIds(new Set(ids));
    }, []);

    useEffect(() => {
        if (!isAuthenticated) setFavouriteIds(new Set());
    }, [isAuthenticated]);

    const isFavourite = useCallback((eventId: number) => favouriteIds.has(eventId), [favouriteIds]);

    const addFavourite = useCallback(async (eventId: number) => {
        await favouritesService.addFavourite(eventId);
        setFavouriteIds((prev) => new Set(prev).add(eventId));
    }, []);

    const removeFavourite = useCallback(async (eventId: number) => {
        await favouritesService.deleteFavourite(eventId);
        setFavouriteIds((prev) => {
            const next = new Set(prev);
            next.delete(eventId);
            return next;
        });
    }, []);

    const toggleFavourite = useCallback(async (eventId: number) => {
        if (favouriteIds.has(eventId)) {
            await removeFavourite(eventId);
        } else {
            await addFavourite(eventId);
        }
    }, [favouriteIds, addFavourite, removeFavourite]);

    const value: FavouritesContextType = {
        favouriteIds,
        isFavourite,
        addFavourite,
        removeFavourite,
        toggleFavourite,
        syncFavouriteIds,
    };

    return (
        <FavouritesContext.Provider value={value}>
            {children}
        </FavouritesContext.Provider>
    );
};
