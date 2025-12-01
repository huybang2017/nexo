import { cn } from '@/lib/utils';
import type { KycRiskLevel } from '@/types';
import { Shield, AlertTriangle, XCircle, Skull } from 'lucide-react';

interface KycRiskBadgeProps {
  riskLevel: KycRiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const riskConfig: Record<KycRiskLevel, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: typeof Shield;
}> = {
  LOW: {
    label: 'Low Risk',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20 border-emerald-500/30',
    icon: Shield,
  },
  MEDIUM: {
    label: 'Medium Risk',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20 border-yellow-500/30',
    icon: AlertTriangle,
  },
  HIGH: {
    label: 'High Risk',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20 border-orange-500/30',
    icon: XCircle,
  },
  FRAUD: {
    label: 'Fraud Detected',
    color: 'text-red-500',
    bgColor: 'bg-red-600/20 border-red-600/30',
    icon: Skull,
  },
};

export function KycRiskBadge({ riskLevel, size = 'md', showIcon = true }: KycRiskBadgeProps) {
  const config = riskConfig[riskLevel] || riskConfig.HIGH;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        config.bgColor,
        config.color,
        sizeClasses[size]
      )}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      <span>{config.label}</span>
    </span>
  );
}


