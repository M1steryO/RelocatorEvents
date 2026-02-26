import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MEDIA_BASE_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { eventsService } from '../services/eventsService';
import type { Event } from '../services/eventsService';
import { reviewsService } from '../services/reviewsService';
import type { Review as ApiReview } from '../services/reviewsService';
import { MediaType } from '../services/reviewsService';
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
    media: Array<{ url: string; type: string }>;
}

interface MediaUploadItem {
    id: string;
    file: File;
    previewUrl?: string;
    type: string;
    isLoading: boolean;
    storageKey?: string;
    mediaType: MediaType;
}

const mapReview = (review: ApiReview, index: number): ReviewItem => ({
    id: String(index),
    author: 'Пользователь',
    date: '',
    rating: review.grade,
    pros: review.advantages || '-',
    cons: review.disadvantages || '-',
    description: review.text,
    media: (review.media || []).map((item) => {
        const storageKey = (item as { storage_key?: string; storageKey?: string }).storage_key
            || (item as { storageKey?: string }).storageKey
            || '';
        const rawType: string | undefined = typeof item.type === 'string' ? item.type : undefined;
        const isVideo = item.type === MediaType.MEDIA_TYPE_VIDEO || rawType === 'MEDIA_TYPE_VIDEO';
        return {
            url: storageKey ? `${MEDIA_BASE_URL}/${storageKey}` : '',
            type: isVideo ? 'video' : 'image',
        };
    }).filter((item) => item.url),
});

const REVIEW_TEXT_MAX_LENGTH = 200;

const getReviewNoun = (count: number) => {
    const absCount = Math.abs(count);
    const lastTwo = absCount % 100;
    if (lastTwo >= 11 && lastTwo <= 14) {
        return 'отзывов';
    }
    const last = absCount % 10;
    if (last === 1) {
        return 'отзыв';
    }
    if (last >= 2 && last <= 4) {
        return 'отзыва';
    }
    return 'отзывов';
};

export const EventReviewsPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [isReviewsLoading, setIsReviewsLoading] = useState(true);
    const [reviewsSummary, setReviewsSummary] = useState({
        rating: 0,
        reviews_count: 0,
        ratings_count: 0,
    });
    const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddingReview, setIsAddingReview] = useState(false);
    const [isRatingOpen, setIsRatingOpen] = useState(false);
    const [rating, setRating] = useState<number | null>(null);
    const [pros, setPros] = useState('');
    const [cons, setCons] = useState('');
    const [description, setDescription] = useState('');
    const [mediaUploads, setMediaUploads] = useState<MediaUploadItem[]>([]);
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
                setIsReviewsLoading(false);
                return;
            }
            if (lastLoadedReviewsRef.current === eventId) {
                return;
            }
            lastLoadedReviewsRef.current = eventId;

            setIsReviewsLoading(true);
            try {
                const response = await reviewsService.listReviews(Number(eventId));
                setReviews(response.reviews.map(mapReview));
                setReviewsSummary({
                    rating: response.rating ?? 0,
                    reviews_count: response.reviews_count ?? 0,
                    ratings_count: response.ratings_count ?? 0,
                });
            } catch (error) {
                console.error('Failed to load reviews:', error);
                setReviews([]);
            } finally {
                setIsReviewsLoading(false);
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

    const hasReviews = reviewsSummary.reviews_count > 0 || reviews.length > 0;
    const isSubmitDisabled = rating === null
        || description.trim().length === 0
        || mediaUploads.some((item) => item.isLoading);

    useEffect(() => {
        return () => {
            mediaUploads.forEach(upload => {
                if (upload.previewUrl) {
                    URL.revokeObjectURL(upload.previewUrl);
                }
            });
        };
    }, [mediaUploads]);

    const handleMediaChange = async (eventInput: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(eventInput.target.files || []);
        if (files.length === 0) {
            return;
        }

        const availableSlots = Math.max(0, 3 - mediaUploads.length);
        const filesToAdd = files.slice(0, availableSlots);

        filesToAdd.forEach((file) => {
            const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const mediaType = file.type.startsWith('video/')
                ? MediaType.MEDIA_TYPE_VIDEO
                : file.type.startsWith('image/')
                    ? MediaType.MEDIA_TYPE_IMAGE
                    : MediaType.MEDIA_TYPE_UNKNOWN;

            setMediaUploads((prev) => [
                ...prev,
                {
                    id: uploadId,
                    file,
                    type: file.type,
                    isLoading: true,
                    mediaType,
                },
            ]);

            const objectName = `${Date.now()}-${file.name}`;
            const reviewId = 0;

            reviewsService.getReviewPresignedUrl(objectName, reviewId)
                .then(async (presigned) => {
                    const uploadResponse = await fetch(presigned.presigned_url, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': file.type || 'application/octet-stream',
                        },
                        body: file,
                    });

                    if (!uploadResponse.ok) {
                        throw new Error(`Upload failed: ${uploadResponse.status}`);
                    }

                    const previewUrl = URL.createObjectURL(file);
                    setMediaUploads((prev) => prev.map((item) => (
                        item.id === uploadId
                            ? { ...item, isLoading: false, previewUrl, storageKey: presigned.object_key }
                            : item
                    )));
                })
                .catch((error) => {
                    console.error('Failed to upload media:', error);
                    alert('Не удалось загрузить файл. Попробуйте еще раз.');
                    setMediaUploads((prev) => prev.filter((item) => item.id !== uploadId));
                });
        });

        eventInput.target.value = '';
    };

    const handleRemoveMedia = (indexToRemove: number) => {
        setMediaUploads((prevUploads) => {
            const toRemove = prevUploads[indexToRemove];
            if (toRemove?.previewUrl) {
                URL.revokeObjectURL(toRemove.previewUrl);
            }
            return prevUploads.filter((_, index) => index !== indexToRemove);
        });
    };

    const handleSubmitReview = async () => {
        if (!eventId || isSubmitDisabled || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        try {
            const mediaAttachments = mediaUploads
                .filter((item) => !item.isLoading && item.storageKey)
                .map((item) => ({
                    storage_key: item.storageKey as string,
                    type: item.mediaType,
                }));

            await reviewsService.createReview(Number(eventId), {
                grade: rating ?? 0,
                advantages: pros,
                disadvantages: cons,
                text: description.trim(),
                media: mediaAttachments,
            });
            const response = await reviewsService.listReviews(Number(eventId));
            setReviews(response.reviews.map(mapReview));
            setReviewsSummary({
                rating: response.rating ?? 0,
                reviews_count: response.reviews_count ?? 0,
                ratings_count: response.ratings_count ?? 0,
            });
            setIsAddingReview(false);
            setRating(null);
            setPros('');
            setCons('');
            setDescription('');
            setMediaUploads([]);
        } catch (error) {
            console.error('Failed to create review:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || isReviewsLoading) {
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
                            <div className="review-form-field">
                                <input
                                    className="review-form-input"
                                    placeholder="Достоинства"
                                    value={pros}
                                    maxLength={REVIEW_TEXT_MAX_LENGTH}
                                    onChange={(e) => setPros(e.target.value.slice(0, REVIEW_TEXT_MAX_LENGTH))}
                                />
                                <span className="review-form-char-count">{pros.length}/{REVIEW_TEXT_MAX_LENGTH}</span>
                            </div>
                            <div className="review-form-field">
                                <input
                                    className="review-form-input"
                                    placeholder="Недостатки"
                                    value={cons}
                                    maxLength={REVIEW_TEXT_MAX_LENGTH}
                                    onChange={(e) => setCons(e.target.value.slice(0, REVIEW_TEXT_MAX_LENGTH))}
                                />
                                <span className="review-form-char-count">{cons.length}/{REVIEW_TEXT_MAX_LENGTH}</span>
                            </div>
                            <div className="review-form-field">
                                <textarea
                                    className="review-form-input review-form-textarea"
                                    placeholder="Описание"
                                    value={description}
                                    maxLength={REVIEW_TEXT_MAX_LENGTH}
                                    onChange={(e) => setDescription(e.target.value.slice(0, REVIEW_TEXT_MAX_LENGTH))}
                                />
                                <span className="review-form-char-count">{description.length}/{REVIEW_TEXT_MAX_LENGTH}</span>
                            </div>
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
                    {mediaUploads.length > 0 && (
                        <div className="review-media-count">Файлов: {mediaUploads.length}</div>
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
                    {mediaUploads.length > 0 && (
                        <div className="review-media-preview">
                            {mediaUploads.map((upload, index) => (
                                <div
                                    key={upload.id}
                                    className={`review-media-item ${upload.isLoading ? 'review-media-item-loading' : ''}`}
                                >
                                    <button
                                        type="button"
                                        className="review-media-remove"
                                        onClick={() => handleRemoveMedia(index)}
                                        aria-label="Удалить файл"
                                    >
                                        ×
                                    </button>
                                    {upload.isLoading ? (
                                        <div className="review-media-loader">
                                            <div className="loader-spinner"></div>
                                        </div>
                                    ) : upload.type.startsWith('video/') ? (
                                        <video src={upload.previewUrl} controls />
                                    ) : (
                                        <img src={upload.previewUrl} alt={`media-${index + 1}`} />
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
                                {reviewsSummary.rating.toFixed(1).replace('.', ',')}
                            </div>
                            <div className="reviews-summary-text">
                                <div className="reviews-summary-count">
                                    {reviewsSummary.reviews_count} {getReviewNoun(reviewsSummary.reviews_count)}
                                </div>
                            </div>
                        </section>
                    )}

                    <section className="event-reviews-list">
                        {reviews.length > 0 ? (
                            reviews.map(review => (
                                <div key={review.id} className="review-card">
                                    {review.media.length > 0 && (
                                        <div className="review-card-media">
                                    {review.media.map((mediaItem, mediaIndex) => (
                                        <button
                                            key={`${review.id}-${mediaIndex}`}
                                            type="button"
                                            className="review-card-media-item review-card-media-action"
                                            onClick={() => setFullscreenMedia(mediaItem)}
                                            aria-label="Открыть медиа"
                                        >
                                            {mediaItem.type === 'video' ? (
                                                <video src={mediaItem.url} />
                                            ) : (
                                                <img src={mediaItem.url} alt={`review-media-${mediaIndex + 1}`} />
                                            )}
                                        </button>
                                    ))}
                                        </div>
                                    )}
                                    <div className="review-card-body">
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
            {fullscreenMedia && (
                <div
                    className="review-media-fullscreen"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setFullscreenMedia(null)}
                >
                    <button
                        type="button"
                        className="review-media-fullscreen-close"
                        aria-label="Закрыть"
                        onClick={() => setFullscreenMedia(null)}
                    >
                        ×
                    </button>
                    {fullscreenMedia.type === 'video' ? (
                        <video
                            className="review-media-fullscreen-content"
                            src={fullscreenMedia.url}
                            controls
                            autoPlay
                            onClick={(event) => event.stopPropagation()}
                        />
                    ) : (
                        <img
                            className="review-media-fullscreen-content"
                            src={fullscreenMedia.url}
                            alt="review-media-fullscreen"
                            onClick={(event) => event.stopPropagation()}
                        />
                    )}
                </div>
            )}
        </div>
    );
};
