const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={`bg-card rounded-card shadow-soft ${hover ? 'hover:shadow-card transition-shadow' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;




