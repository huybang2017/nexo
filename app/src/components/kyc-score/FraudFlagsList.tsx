import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { KycFraudFlag } from '@/types';

interface FraudFlagsListProps {
  flags: KycFraudFlag[];
  onResolve?: (flagId: number) => void;
  showActions?: boolean;
}

const fraudTypeLabels: Record<string, string> = {
  DOCUMENT_DUPLICATE: 'Duplicate Document',
  DOCUMENT_TAMPERING: 'Document Tampering',
  DOCUMENT_EXPIRED: 'Expired Document',
  DOCUMENT_LOW_QUALITY: 'Low Quality Document',
  DOCUMENT_BLURRY: 'Blurry Document',
  DOCUMENT_OCR_MISMATCH: 'OCR Mismatch',
  ID_CARD_DUPLICATE: 'Duplicate ID Card',
  ID_CARD_INVALID_FORMAT: 'Invalid ID Format',
  ID_CARD_EXPIRED: 'Expired ID Card',
  FACE_MISMATCH: 'Face Mismatch',
  FACE_LOW_CONFIDENCE: 'Low Face Confidence',
  FACE_MULTIPLE_DETECTED: 'Multiple Faces',
  PROFILE_UNDERAGE: 'Underage User',
  PROFILE_SUSPICIOUS_EMAIL: 'Suspicious Email',
  PROFILE_SUSPICIOUS_PHONE: 'Suspicious Phone',
  PROFILE_KNOWN_FRAUD_DB: 'Known Fraud DB Match',
  PROFILE_IP_BLACKLISTED: 'Blacklisted IP',
  PROFILE_VPN_DETECTED: 'VPN Detected',
  PROFILE_DEVICE_FRAUD: 'Fraudulent Device',
  BEHAVIOR_RAPID_SUBMISSION: 'Rapid Submission',
  BEHAVIOR_COPY_PASTE_DETECTED: 'Copy-Paste Detected',
  BEHAVIOR_MULTIPLE_ATTEMPTS: 'Multiple Attempts',
  CROSS_CHECK_BANK_MISMATCH: 'Bank Info Mismatch',
  CROSS_CHECK_ADDRESS_MISMATCH: 'Address Mismatch',
};

export function FraudFlagsList({ flags, onResolve, showActions = false }: FraudFlagsListProps) {
  if (flags.length === 0) {
    return (
      <div className="flex items-center gap-2 text-emerald-400 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
        <CheckCircle size={20} />
        <span>No fraud flags detected</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {flags.map((flag, index) => (
        <motion.div
          key={flag.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={cn(
            'p-4 rounded-lg border',
            flag.isResolved 
              ? 'bg-slate-800/50 border-slate-700'
              : flag.isCritical 
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-orange-500/10 border-orange-500/30'
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {flag.isCritical ? (
                <XCircle className="text-red-400 mt-0.5" size={20} />
              ) : (
                <AlertTriangle className="text-orange-400 mt-0.5" size={20} />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-medium',
                    flag.isResolved ? 'text-slate-400' : 'text-white'
                  )}>
                    {fraudTypeLabels[flag.fraudType] || flag.fraudType}
                  </span>
                  {flag.isCritical && !flag.isResolved && (
                    <Badge variant="destructive" className="text-xs">Critical</Badge>
                  )}
                  {flag.isResolved && (
                    <Badge variant="secondary" className="text-xs bg-emerald-500/20 text-emerald-400">
                      Resolved
                    </Badge>
                  )}
                </div>
                <p className={cn(
                  'text-sm',
                  flag.isResolved ? 'text-slate-500' : 'text-slate-400'
                )}>
                  {flag.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(flag.createdAt)}
                  </span>
                  <span>
                    Penalty: <span className="text-red-400">{flag.scorePenalty} pts</span>
                  </span>
                  <span>
                    Confidence: <span className="text-blue-400">{flag.confidenceScore}%</span>
                  </span>
                </div>
              </div>
            </div>
            
            {showActions && !flag.isResolved && onResolve && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onResolve(flag.id)}
                className="border-slate-600 hover:bg-slate-700"
              >
                Resolve
              </Button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}


