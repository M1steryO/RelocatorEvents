import { NotFoundCard } from './NotFoundCard';
import './ServiceUnavailablePage.css';

export const ServiceUnavailablePage = () => {
    return (
        <div className="service-unavailable-page">
            <NotFoundCard
                title="503"
                subtitle="Сервер долго не отвечает, попробуй перезагрузить страницу"
            />
        </div>

    );
};
