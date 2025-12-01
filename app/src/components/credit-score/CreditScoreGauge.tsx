import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/types';

interface CreditScoreGaugeProps {
  score: number;
  maxScore?: number;
  riskLevel: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

const riskColors: Record<RiskLevel, { gradient: string; text: string }> = {
  LOW: { gradient: 'from-emerald-500 to-emerald-400', text: 'text-emerald-400' },
  MEDIUM: { gradient: 'from-yellow-500 to-yellow-400', text: 'text-yellow-400' },
  HIGH: { gradient: 'from-orange-500 to-orange-400', text: 'text-orange-400' },
  VERY_HIGH: { gradient: 'from-red-500 to-red-400', text: 'text-red-400' },
  CRITICAL: { gradient: 'from-red-600 to-red-500', text: 'text-red-500' },
};

export function CreditScoreGauge({
  score,
  maxScore = 1000,
  riskLevel,
  size = 'md',
  showLabels = true,
}: CreditScoreGaugeProps) {
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
  const colors = riskColors[riskLevel] || riskColors.CRITICAL;

  const sizeConfig = {
    sm: { container: 'w-32 h-32', text: 'text-2xl', label: 'text-xs' },
    md: { container: 'w-48 h-48', text: 'text-4xl', label: 'text-sm' },
    lg: { container: 'w-64 h-64', text: 'text-5xl', label: 'text-base' },
  };

  const config = sizeConfig[size];

  // Calculate the stroke dashoffset for the arc
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75; // 75% of circle

  return (
    <div className={cn('relative flex flex-col items-center', config.container)}>
      <svg
        className="w-full h-full -rotate-135"
        viewBox="0 0 100 100"
      >
        {/* Background arc */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.25}
          className="text-zinc-800"
        />
        {/* Progress arc */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn('transition-all duration-1000 ease-out', `stroke-current ${colors.text}`)}
          style={{
            filter: 'drop-shadow(0 0 6px currentColor)',
          }}
        />
      </svg>

      {/* Score display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold', config.text, colors.text)}>
          {score}
        </span>
        {showLabels && (
          <>
            <span className={cn('text-zinc-500', config.label)}>
              / {maxScore}
            </span>
            <span className={cn('mt-1 font-medium text-zinc-400', config.label)}>
              Credit Score
            </span>
          </>
        )}
      </div>
    </div>
  );
}

