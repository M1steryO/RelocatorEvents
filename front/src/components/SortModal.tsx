import { useState, useEffect, useRef, useCallback } from 'react';
import './SortModal.css';

interface SortModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (sortOption: string) => void;
    currentSort?: string;
}

const SORT_OPTIONS = [
    { value: 'popular', label: 'Популярное' },
    { value: 'rating', label: 'По рейтингу' },
    { value: 'cheaper', label: 'Дешевле' },
    { value: 'expensive', label: 'Дороже' },
    { value: 'new', label: 'Новинки' },
];

export const SortModal = ({ isOpen, onClose, onApply, currentSort = 'popular' }: SortModalProps) => {
    const [selectedSort, setSelectedSort] = useState(currentSort);
    const [isClosing, setIsClosing] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSelectedSort(currentSort);
    }, [currentSort, isOpen]);

    const handleClose = useCallback(() => {
        if (isClosing) return; // Предотвращаем множественные вызовы
        setIsClosing(true);
        document.body.style.overflow = '';
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300); // Время анимации закрытия
    }, [isClosing, onClose]);

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
            document.body.style.overflow = 'hidden';
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || isClosing) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, isClosing, handleClose]);

    const handleApply = () => {
        onApply(selectedSort);
        handleClose();
    };

    if (!isOpen && !isClosing) return null;

    return (
        <div className={`sort-modal-overlay ${isClosing ? 'closing' : ''}`}>
            <div className={`sort-modal ${isClosing ? 'closing' : ''}`} ref={modalRef}>
                <div className="sort-header">
                    <h2 className="sort-title">Показать сначала</h2>
                </div>

                <div className="sort-content">
                    {SORT_OPTIONS.map((option) => (
                        <label key={option.value} className="sort-option">
                            <input
                                type="radio"
                                name="sort"
                                value={option.value}
                                checked={selectedSort === option.value}
                                onChange={(e) => setSelectedSort(e.target.value)}
                                className="sort-radio"
                            />
                            <span className="sort-option-label">{option.label}</span>
                        </label>
                    ))}
                </div>

                <div className="sort-footer">
                    <button
                        className="sort-apply-button"
                        onClick={handleApply}
                    >
                        Применить
                    </button>
                </div>
            </div>
        </div>
    );
};


