import './SectionCard.css';

export default function SectionCard({ title, icon, children }) {
  return (
    <div className="section-card">
      <h3>
        {icon && <span className="section-card-icon">{icon}</span>}
        {title}
      </h3>
      {children}
    </div>
  );
}

