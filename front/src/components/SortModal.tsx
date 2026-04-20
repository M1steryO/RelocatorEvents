import { useState, useEffect, useRef, useCallback } from 'react';
import './SortModal.css';

interface SortModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (value: string) => void;
    currentSelection?: string;
    options: Array<{ value: string; label: string }>;
    title?: string;
}

export const SortModal = ({
    isOpen,
    onClose,
    onApply,
    currentSelection = '',
    options,
    title = 'Подборки',
}: SortModalProps) => {
    const [selectedValue, setSelectedValue] = useState(currentSelection);
    const [isClosing, setIsClosing] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSelectedValue(currentSelection);
    }, [currentSelection, isOpen]);

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
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
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
        onApply(selectedValue);
        handleClose();
    };

    if (!isOpen && !isClosing) return null;

    return (
        <div className={`sort-modal-overlay ${isClosing ? 'closing' : ''}`}>
            <div className={`sort-modal ${isClosing ? 'closing' : ''}`} ref={modalRef}>
                <div className="sort-header">
                    <h2 className="sort-title">{title}</h2>
                </div>

                <div className="sort-content">
                    {options.map((option) => (
                        <label key={option.value} className="sort-option">
                            <input
                                type="radio"
                                name="sort"
                                value={option.value}
                                checked={selectedValue === option.value}
                                onChange={(e) => setSelectedValue(e.target.value)}
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


