import { motion } from 'framer-motion';
import { 
  Shield, 
  FileCheck, 
  User, 
  AlertTriangle,
  ChevronRight,
  RefreshCw 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { KycScoreGauge } from './KycScoreGauge';
import { KycRiskBadge } from './KycRiskBadge';
import type { KycScore, KycRiskLevel } from '@/types';

interface KycScoreCardProps {
  score?: KycScore;
  isLoading?: boolean;
  onViewDetails?: () => void;
  onRecalculate?: () => void;
  showDetails?: boolean;
}

export function KycScoreCard({ 
  score, 
  isLoading, 
  onViewDetails,
  onRecalculate,
  showDetails = false 
}: KycScoreCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <Skeleton className="h-6 w-32 bg-slate-700" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Skeleton className="h-32 w-32 rounded-full bg-slate-700" />
          </div>
          <Skeleton className="h-4 w-full bg-slate-700" />
          <Skeleton className="h-4 w-3/4 bg-slate-700" />
        </CardContent>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Shield className="w-12 h-12 text-slate-600" />
            <div>
              <h3 className="font-medium text-slate-300">No KYC Score Available</h3>
              <p className="text-sm text-slate-500 mt-1">
                Complete KYC verification to get your score
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            KYC Score
          </CardTitle>
          <KycRiskBadge riskLevel={score.riskLevel as KycRiskLevel} />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Main Score */}
          <div className="flex items-center gap-6">
            <KycScoreGauge 
              score={score.totalScore} 
              riskLevel={score.riskLevel as KycRiskLevel}
              size="md"
            />
            
            <div className="flex-1 space-y-3">
              <div className="text-sm text-slate-400">
                {score.riskDescription}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Recommendation:</span>
                <span className={cn(
                  'text-sm font-medium',
                  score.recommendedDecision === 'AUTO_APPROVE' ? 'text-emerald-400' :
                  score.recommendedDecision === 'MANUAL_REVIEW' ? 'text-yellow-400' :
                  'text-red-400'
                )}>
                  {score.recommendedDecision?.replace('_', ' ')}
                </span>
              </div>
              {score.fraudFlagsCount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-400">
                    {score.fraudFlagsCount} fraud flag{score.fraudFlagsCount > 1 ? 's' : ''} detected
                    {score.criticalFlagsCount > 0 && (
                      <span className="text-red-400 ml-1">
                        ({score.criticalFlagsCount} critical)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Score Breakdown */}
          {showDetails && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-4">
                <ScoreItem 
                  icon={FileCheck} 
                  label="Document Score" 
                  score={score.documentScore} 
                  weight="40%"
                />
                <ScoreItem 
                  icon={User} 
                  label="Profile Score" 
                  score={score.profileScore} 
                  weight="60%"
                />
              </div>

              {score.fraudPenalty > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <span className="text-sm text-red-400">Fraud Penalty Applied</span>
                  <span className="text-red-400 font-medium">-{score.fraudPenalty} pts</span>
                </div>
              )}

              {/* Component Breakdown */}
              {score.documentScoreBreakdown && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-400">Document Analysis</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <ScoreBar label="Image Quality" value={score.documentScoreBreakdown.imageQualityScore} />
                    <ScoreBar label="OCR Accuracy" value={score.documentScoreBreakdown.ocrAccuracyScore} />
                    <ScoreBar label="Blur Detection" value={score.documentScoreBreakdown.blurDetectionScore} />
                    <ScoreBar label="Tampering Check" value={score.documentScoreBreakdown.tamperingDetectionScore} />
                  </div>
                </div>
              )}

              {score.profileScoreBreakdown && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-400">Profile Analysis</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <ScoreBar label="Age Verification" value={score.profileScoreBreakdown.ageVerificationScore} />
                    <ScoreBar label="Data Completeness" value={score.profileScoreBreakdown.dataCompletenessScore} />
                    <ScoreBar label="Email Trust" value={score.profileScoreBreakdown.emailTrustScore} />
                    <ScoreBar label="Phone Trust" value={score.profileScoreBreakdown.phoneTrustScore} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {onViewDetails && (
              <Button 
                variant="outline" 
                className="flex-1 border-slate-700 hover:bg-slate-800"
                onClick={onViewDetails}
              >
                View Details
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {onRecalculate && (
              <Button 
                variant="outline" 
                className="border-slate-700 hover:bg-slate-800"
                onClick={onRecalculate}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ScoreItem({ 
  icon: Icon, 
  label, 
  score, 
  weight 
}: { 
  icon: typeof Shield; 
  label: string; 
  score: number; 
  weight: string;
}) {
  return (
    <div className="p-3 bg-slate-800/50 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-blue-400" />
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-500">/1000 ({weight})</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-slate-500">{label}</span>
        <span className={cn(
          'font-medium',
          value >= 80 ? 'text-emerald-400' :
          value >= 60 ? 'text-yellow-400' :
          'text-red-400'
        )}>{value}%</span>
      </div>
      <Progress 
        value={value} 
        className="h-1.5 bg-slate-700"
      />
    </div>
  );
}


