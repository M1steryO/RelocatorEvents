import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { eventsService } from '../services/eventsService';
import type { Event } from '../services/eventsService';
import { reviewsService } from '../services/reviewsService';
import type { Review as ApiReview } from '../services/reviewsService';
import './EventReviewsPage.css';
import { NotFoundCard } from './NotFoundCard';

interface ReviewItem {
    id: string;
    author: string;
    date: string;
    rating: number;
    pros: string;
    cons: string;
    description: string;
}

const mapReview = (review: ApiReview, index: number): ReviewItem => ({
    id: String(index),
    author: 'Пользователь',
    date: '',
    rating: review.grade,
    pros: review.advantages || '-',
    cons: review.disadvantages || '-',
    description: review.text,
});

export const EventReviewsPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddingReview, setIsAddingReview] = useState(false);
    const [isRatingOpen, setIsRatingOpen] = useState(false);
    const [rating, setRating] = useState<number | null>(null);
    const [pros, setPros] = useState('');
    const [cons, setCons] = useState('');
    const [description, setDescription] = useState('');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<Array<{ url: string; type: string }>>([]);
    const mediaInputRef = useRef<HTMLInputElement | null>(null);

    const eventId = id;
    const ratingOptions = Array.from({ length: 11 }, (_, index) => index);

    const lastLoadedEventRef = useRef<string | null>(null);

    useEffect(() => {
        const loadEvent = async () => {
            if (!eventId) {
                setIsLoading(false);
                return;
            }

            if (lastLoadedEventRef.current === eventId) {
                return;
            }
            lastLoadedEventRef.current = eventId;

            setIsLoading(true);
            try {
                const response = await eventsService.getEvent(Number(eventId));
                setEvent(response.event);
            } catch (error) {
                console.error('Failed to load event reviews:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadEvent();
    }, [eventId]);

    const lastLoadedReviewsRef = useRef<string | null>(null);

    useEffect(() => {
        const loadReviews = async () => {
            if (!eventId) {
                return;
            }
            if (lastLoadedReviewsRef.current === eventId) {
                return;
            }
            lastLoadedReviewsRef.current = eventId;

            try {
                const response = await reviewsService.listReviews(Number(eventId));
                setReviews(response.reviews.map(mapReview));
            } catch (error) {
                console.error('Failed to load reviews:', error);
                setReviews([]);
            }
        };

        loadReviews();
    }, [eventId]);

    const handleBack = () => {
        if (isAddingReview) {
            setIsAddingReview(false);
            return;
        }
        navigate(-1);
    };

    const hasReviews = (event?.reviews_count ?? 0) > 0 || reviews.length > 0;
    const isSubmitDisabled = rating === null || description.trim().length === 0;

    useEffect(() => {
        return () => {
            mediaPreviews.forEach(preview => URL.revokeObjectURL(preview.url));
        };
    }, [mediaPreviews]);

    const handleMediaChange = (eventInput: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(eventInput.target.files || []);
        if (files.length === 0) {
            return;
        }

        setMediaFiles((prevFiles) => {
            const nextFiles = [...prevFiles, ...files].slice(0, 3);
            return nextFiles;
        });

        setMediaPreviews((prevPreviews) => {
            const availableSlots = Math.max(0, 3 - prevPreviews.length);
            const filesToAdd = files.slice(0, availableSlots);
            const nextPreviews = [
                ...prevPreviews,
                ...filesToAdd.map(file => ({
                    url: URL.createObjectURL(file),
                    type: file.type,
                })),
            ];
            return nextPreviews;
        });

        eventInput.target.value = '';
    };

    const handleRemoveMedia = (indexToRemove: number) => {
        setMediaFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
        setMediaPreviews((prevPreviews) => {
            const previewToRemove = prevPreviews[indexToRemove];
            if (previewToRemove) {
                URL.revokeObjectURL(previewToRemove.url);
            }
            return prevPreviews.filter((_, index) => index !== indexToRemove);
        });
    };

    const handleSubmitReview = async () => {
        if (!eventId || isSubmitDisabled || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        try {
            await reviewsService.createReview(Number(eventId), {
                grade: rating ?? 0,
                advantages: pros,
                disadvantages: cons,
                text: description.trim(),
                media: [],
            });
            const response = await reviewsService.listReviews(Number(eventId));
            setReviews(response.reviews.map(mapReview));
            setIsAddingReview(false);
            setRating(null);
            setPros('');
            setCons('');
            setDescription('');
            setMediaFiles([]);
            setMediaPreviews([]);
        } catch (error) {
            console.error('Failed to create review:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="event-reviews-page">
                <div className="event-reviews-loader">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="event-reviews-page">
            <header className="event-reviews-header">
                <button className="event-reviews-back" onClick={handleBack} aria-label="Назад">
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="16" viewBox="0 0 8 16" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M7.3472 15.7474C7.75996 15.3804 7.7971 14.7484 7.43015 14.3356L2.35344 8.62504C2.17578 8.42519 2.0813 8.31784 2.01899 8.23557C2.01681 8.2327 2.01476 8.22996 2.01282 8.22735C2.01467 8.22467 2.01662 8.22186 2.01869 8.21892C2.07806 8.13449 2.16867 8.02386 2.33914 7.81784L7.45322 1.63754C7.80531 1.21204 7.7458 0.581678 7.32031 0.229585C6.89481 -0.122506 6.26444 -0.0629985 5.91235 0.362501L0.779368 6.56565C0.635262 6.73975 0.492836 6.91183 0.382621 7.06858C0.260039 7.24293 0.132862 7.45826 0.0631174 7.72947C-0.0268922 8.0795 -0.0203743 8.44737 0.0819781 8.79398C0.161286 9.06256 0.296011 9.27325 0.424693 9.44314C0.540388 9.59588 0.688816 9.7628 0.838995 9.93169C0.845564 9.93908 0.852137 9.94647 0.85871 9.95386L5.93542 15.6644C6.30236 16.0772 6.93444 16.1143 7.3472 15.7474Z" fill="#414141" />
                    </svg>
                </button>
                <div className="event-reviews-title">
                    <div className="event-reviews-subtitle">{event?.title || 'МЕРОПРИЯТИЕ'}</div>
                    <h1>Отзывы</h1>
                </div>
            </header>

            {isAddingReview ? (
                <section className="review-form">
                    <div className="review-form-block">
                        <div className="review-form-label">Оценка</div>
                        <div
                            className={`review-rating-select ${isRatingOpen ? 'open' : ''}`}
                            onClick={() => setIsRatingOpen(prev => !prev)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(eventKey) => {
                                if (eventKey.key === 'Enter' || eventKey.key === ' ') {
                                    eventKey.preventDefault();
                                    setIsRatingOpen(prev => !prev);
                                }
                            }}
                        >
                            <span className={rating === null ? 'review-rating-placeholder' : ''}>
                                {rating === null ? 'От 0 до 10' : rating}
                            </span>
                            <svg width="16" height="10" viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 2L10 10L18 2" stroke="#414141" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        {isRatingOpen && (
                            <div className="review-rating-dropdown">
                                {ratingOptions.map(option => (
                                    <button
                                        key={option}
                                        type="button"
                                        className={`review-rating-option ${rating === option ? 'selected' : ''}`}
                                        onClick={() => {
                                            setRating(option);
                                            setIsRatingOpen(false);
                                        }}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="review-form-block">
                        <div className="review-form-label">Отзыв</div>
                        <div className="review-form-inputs">
                            <input
                                className="review-form-input"
                                placeholder="Достоинства"
                                value={pros}
                                onChange={(eventInput) => setPros(eventInput.target.value)}
                            />
                            <input
                                className="review-form-input"
                                placeholder="Недостатки"
                                value={cons}
                                onChange={(eventInput) => setCons(eventInput.target.value)}
                            />
                            <textarea
                                className="review-form-input review-form-textarea"
                                placeholder="Описание"
                                value={description}
                                onChange={(eventInput) => setDescription(eventInput.target.value)}
                            />
                        </div>
                        <div className="review-form-hint">
                            Например, ваши ожидания, впечатления, посоветуете ли вы мероприятие другим
                        </div>
                    </div>

                    <button
                        className="review-media-button"
                        type="button"
                        onClick={() => mediaInputRef.current?.click()}
                    >
                        <span className="review-media-icon"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="20" viewBox="0 0 22 20" fill="none">
                            <path d="M18 1V7" stroke="#FAF9F6" stroke-width="2" stroke-linecap="round" />
                            <path d="M21 4L15 4" stroke="#FAF9F6" stroke-width="2" stroke-linecap="round" />
                            <path d="M11.4444 4H7.84743C7.11898 4 6.44814 4.39606 6.09625 5.03389L5.76158 5.64053C5.40969 6.27836 4.73885 6.67442 4.0104 6.67442H3C1.89543 6.67442 1 7.56985 1 8.67442V17C1 18.1046 1.89543 19 3 19H16C17.1046 19 18 18.1046 18 17V10.9643" stroke="#FAF9F6" stroke-width="2" stroke-linecap="round" />
                            <circle cx="9.5" cy="11.5" r="3.5" stroke="#FAF9F6" stroke-width="2" />
                        </svg></span>

                        Добавить фото или видео
                    </button>
                    {mediaFiles.length > 0 && (
                        <div className="review-media-count">Файлов: {mediaFiles.length}</div>
                    )}
                    <input
                        ref={mediaInputRef}
                        className="review-media-input"
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        max="3"
                        onChange={handleMediaChange}
                    />
                    {mediaPreviews.length > 0 && (
                        <div className="review-media-preview">
                            {mediaPreviews.map((preview, index) => (
                                <div key={`${preview.url}-${index}`} className="review-media-item">
                                    <button
                                        type="button"
                                        className="review-media-remove"
                                        onClick={() => handleRemoveMedia(index)}
                                        aria-label="Удалить файл"
                                    >
                                        ×
                                    </button>
                                    {preview.type.startsWith('video/') ? (
                                        <video src={preview.url} controls />
                                    ) : (
                                        <img src={preview.url} alt={`media-${index + 1}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            ) : (
                <>
                    {hasReviews && (
                        <section className="event-reviews-summary">
                            <div className="reviews-rating-circle">
                                {(event?.rating ?? 0).toFixed(1).replace('.', ',')}
                            </div>
                            <div className="reviews-summary-text">
                                <div className="reviews-summary-count">{event?.reviews_count || 0} отзывов</div>
                                <div className="reviews-summary-rated">{event?.ratings_count || 0} оценили</div>
                            </div>
                        </section>
                    )}

                    <section className="event-reviews-list">
                        {reviews.length > 0 ? (
                            reviews.map(review => (
                                <div key={review.id} className="review-card">
                                    <div className="review-score">{review.rating}</div>
                                    <div className="review-content">
                                        <div className="review-author">{review.author}</div>
                                        <div className="review-date">{review.date}</div>
                                        <div className="review-lines">
                                            <div className="review-line">
                                                <span>Достоинства:</span> {review.pros}
                                            </div>
                                            <div className="review-line">
                                                <span>Недостатки:</span> {review.cons}
                                            </div>
                                            <div className="review-line">
                                                <span>Описание:</span> {review.description}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <NotFoundCard title="ПОКА НЕТ ОТЗЫВОВ" subtitle="Станьте первым!" />
                        )}
                    </section>
                </>
            )}

            <div className="event-reviews-footer">
                <button
                    className="event-reviews-action"
                    disabled={isAddingReview ? isSubmitDisabled || isSubmitting : false}
                    onClick={() => {
                        if (!isAddingReview) {
                            setIsAddingReview(true);
                            return;
                        }
                        handleSubmitReview();
                    }}
                >
                    Оценить
                </button>
            </div>
        </div>
    );
};
