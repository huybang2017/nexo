import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/types';

interface RiskLevelBadgeProps {
  riskLevel: RiskLevel;
  riskGrade?: string;
  size?: 'sm' | 'md' | 'lg';
  showGrade?: boolean;
}

const riskLevelConfig: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  LOW: {
    label: 'Low Risk',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20 border-emerald-500/30',
  },
  MEDIUM: {
    label: 'Medium Risk',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20 border-yellow-500/30',
  },
  HIGH: {
    label: 'High Risk',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20 border-orange-500/30',
  },
  VERY_HIGH: {
    label: 'Very High Risk',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30',
  },
  CRITICAL: {
    label: 'Critical Risk',
    color: 'text-red-500',
    bgColor: 'bg-red-600/20 border-red-600/30',
  },
};

export function RiskLevelBadge({ 
  riskLevel, 
  riskGrade, 
  size = 'md',
  showGrade = true 
}: RiskLevelBadgeProps) {
  const config = riskLevelConfig[riskLevel] || riskLevelConfig.CRITICAL;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.bgColor,
        config.color,
        sizeClasses[size]
      )}
    >
      {showGrade && riskGrade && (
        <span className="font-bold">{riskGrade}</span>
      )}
      <span>{config.label}</span>
    </span>
  );
}

