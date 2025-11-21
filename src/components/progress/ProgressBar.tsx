interface ProgressBarProps {
  percentage: number; // 0-100
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  percentage,
  showLabel = true,
  height = 'md',
  className = '',
}: ProgressBarProps) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  // Determine height class
  const heightClass = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }[height];

  // Determine color based on percentage
  const getColorClass = () => {
    if (clampedPercentage === 100) {
      return 'bg-green-500';
    } else if (clampedPercentage >= 50) {
      return 'bg-blue-500';
    } else if (clampedPercentage > 0) {
      return 'bg-blue-400';
    } else {
      return 'bg-gray-300';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">
            {clampedPercentage}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`${heightClass} ${getColorClass()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${clampedPercentage}%` }}
          role="progressbar"
          aria-valuenow={clampedPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
