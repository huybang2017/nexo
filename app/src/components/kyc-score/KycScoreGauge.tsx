import { cn } from '@/lib/utils';
import type { KycRiskLevel } from '@/types';

interface KycScoreGaugeProps {
  score: number;
  maxScore?: number;
  riskLevel: KycRiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const riskColors: Record<KycRiskLevel, string> = {
  LOW: 'stroke-emerald-400',
  MEDIUM: 'stroke-yellow-400',
  HIGH: 'stroke-orange-400',
  FRAUD: 'stroke-red-500',
};

const textColors: Record<KycRiskLevel, string> = {
  LOW: 'text-emerald-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400',
  FRAUD: 'text-red-500',
};

export function KycScoreGauge({ 
  score, 
  maxScore = 1000, 
  riskLevel,
  size = 'md',
  showLabel = true 
}: KycScoreGaugeProps) {
  const percentage = Math.min(100, (score / maxScore) * 100);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  const sizes = {
    sm: { container: 'w-24 h-24', text: 'text-xl', subtext: 'text-xs' },
    md: { container: 'w-32 h-32', text: 'text-2xl', subtext: 'text-sm' },
    lg: { container: 'w-40 h-40', text: 'text-3xl', subtext: 'text-base' },
  };

  const sizeConfig = sizes[size];

  return (
    <div className={cn('relative', sizeConfig.container)}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          className={cn('transition-all duration-1000', riskColors[riskLevel])}
          style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold', sizeConfig.text, textColors[riskLevel])}>
          {score}
        </span>
        {showLabel && (
          <span className={cn('text-slate-500', sizeConfig.subtext)}>
            / {maxScore}
          </span>
        )}
      </div>
    </div>
  );
}


