import './NotFoundCard.css';

interface NotFoundCardProps {
    title: string;
    subtitle: string;
}

export const NotFoundCard = ({ title, subtitle }: NotFoundCardProps) => {
    return (
        <div className="events-not-found">
            <div className="events-not-found-container">
                <div className="events-not-found-content">
                    <h2 className="events-not-found-title">{title}</h2>
                    <p className="events-not-found-subtitle">{subtitle}</p>
                </div>
            </div>
        </div>
    );
};
