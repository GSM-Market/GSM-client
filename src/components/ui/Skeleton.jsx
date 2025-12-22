const Skeleton = ({ className = '', variant = 'default' }) => {
  const variants = {
    default: 'h-4 bg-gray-200 rounded',
    text: 'h-4 bg-gray-200 rounded',
    card: 'h-48 bg-gray-200 rounded-card',
    avatar: 'h-12 w-12 bg-gray-200 rounded-full',
  };
  
  return (
    <div className={`animate-pulse ${variants[variant]} ${className}`}></div>
  );
};

export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-card shadow-soft overflow-hidden">
      <Skeleton variant="card" className="w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="w-3/4" />
        <Skeleton className="w-1/2" />
        <Skeleton className="w-1/3 h-3" />
      </div>
    </div>
  );
};

export default Skeleton;




