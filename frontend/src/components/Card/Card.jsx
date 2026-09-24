import "./Card.css";

export default function Card({
  title,
  eyebrow,
  actions,
  children,
  className = "",
}) {
  return (
    <article className={`card ${className}`}>
      {(title || actions || eyebrow) && (
        <header className="card__header">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2 className="card__title">{title}</h2>}
          </div>

          {actions && <div className="card__actions">{actions}</div>}
        </header>
      )}

      <div className="card__body">{children}</div>
    </article>
  );
}
