import { motion } from 'framer-motion';
import { Shield, TrendingUp, HelpCircle } from 'lucide-react';
import { CreditScoreCard, CreditScoreHistoryTable } from '@/components/credit-score';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const creditScoreFaqs = [
  {
    question: 'How is my credit score calculated?',
    answer: 'Your credit score is calculated based on several factors: Payment History (35%), Credit Utilization (20%), Credit History Length (15%), Identity Verification (15%), Income Stability (10%), and Behavior Score (5%). Each factor contributes to your overall score out of 1000 points.',
  },
  {
    question: 'How can I improve my credit score?',
    answer: 'You can improve your credit score by: 1) Making all repayments on time or early, 2) Completing your KYC verification, 3) Maintaining a longer account history, 4) Keeping your credit utilization low, 5) Providing accurate income and employment information, and 6) Using the platform responsibly.',
  },
  {
    question: 'What happens if I miss a payment?',
    answer: 'Missing a payment will negatively impact your credit score. Late payments (1-7 days) result in a -20 point impact, 8-14 days late results in -40 points, 15-30 days late results in -70 points, and over 30 days late results in -100 points. Avoiding late payments is crucial for maintaining a good score.',
  },
  {
    question: 'How often is my credit score updated?',
    answer: 'Your credit score is updated in real-time whenever a relevant event occurs (e.g., payment made, KYC verified). Additionally, a comprehensive recalculation is performed every 30 days to ensure accuracy.',
  },
  {
    question: 'What is the minimum score required for a loan?',
    answer: 'A minimum credit score of 300 is required to be eligible for a loan. However, higher scores unlock better benefits: larger loan amounts, lower interest rates, and faster approval times.',
  },
  {
    question: 'How does my credit score affect loan terms?',
    answer: 'Your credit score directly affects the maximum loan amount you can borrow and the interest rate you\'ll receive. Higher scores (800+) qualify for up to 500M VND at 8-14% interest, while lower scores have more limited options.',
  },
];

export const CreditScorePage = () => {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Credit Score</h1>
            <p className="text-slate-400">Track and improve your credit score</p>
          </div>
        </div>
      </motion.div>

      {/* Main Credit Score Card */}
      <motion.div variants={item}>
        <CreditScoreCard showDetails={true} />
      </motion.div>

      {/* Score Improvement Tips */}
      <motion.div variants={item}>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Tips to Improve Your Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <TipCard
                title="Pay On Time"
                description="Make all your loan repayments on or before the due date"
                impact="+15 to +25 points"
                color="emerald"
              />
              <TipCard
                title="Complete KYC"
                description="Verify your identity with complete documentation"
                impact="+50 points"
                color="blue"
              />
              <TipCard
                title="Pay Early"
                description="Paying before the due date shows good financial discipline"
                impact="+25 points"
                color="cyan"
              />
              <TipCard
                title="Low Utilization"
                description="Keep your borrowing below 30% of your limit"
                impact="Up to 100 points"
                color="purple"
              />
              <TipCard
                title="Build History"
                description="Longer account history improves your score"
                impact="Up to 100 points"
                color="amber"
              />
              <TipCard
                title="Complete Profile"
                description="Add income and employment information"
                impact="+30 points"
                color="pink"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Credit Score History */}
      <motion.div variants={item}>
        <CreditScoreHistoryTable />
      </motion.div>

      {/* FAQ Section */}
      <motion.div variants={item}>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <HelpCircle className="w-5 h-5 text-zinc-400" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              {creditScoreFaqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-zinc-800 rounded-lg px-4 bg-zinc-800/30"
                >
                  <AccordionTrigger className="text-white hover:text-indigo-400 text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

function TipCard({
  title,
  description,
  impact,
  color,
}: {
  title: string;
  description: string;
  impact: string;
  color: string;
}) {
  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
    pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' },
  };

  const classes = colorClasses[color] || colorClasses.emerald;

  return (
    <div className={`p-4 rounded-lg border ${classes.bg} ${classes.border}`}>
      <h4 className={`font-medium ${classes.text} mb-1`}>{title}</h4>
      <p className="text-sm text-zinc-400 mb-2">{description}</p>
      <span className={`text-xs font-medium ${classes.text}`}>{impact}</span>
    </div>
  );
}

export default CreditScorePage;

