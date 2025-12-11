import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    category: "General",
    questions: [
      {
        q: "What is Nexo P2P Lending?",
        a: "Nexo is a peer-to-peer lending platform that connects borrowers who need funding with investors looking for better returns. We facilitate loans for various purposes including business, education, medical, and personal needs.",
      },
      {
        q: "Is Nexo regulated?",
        a: "Nexo operates in compliance with Vietnamese financial regulations. We are registered with the relevant authorities and follow strict KYC/AML procedures.",
      },
      {
        q: "How does Nexo make money?",
        a: "Nexo charges a small platform fee (1.5-2.5%) on loans that are successfully funded. This fee is only charged when a loan is disbursed.",
      },
    ],
  },
  {
    category: "For Borrowers",
    questions: [
      {
        q: "What do I need to apply for a loan?",
        a: "You need to be at least 18 years old, have a valid Vietnamese ID (CCCD), complete KYC verification, and have a bank account for fund transfers.",
      },
      {
        q: "How much can I borrow?",
        a: "Loan amounts range from ₫1,000,000 to ₫500,000,000 depending on your credit score and loan purpose. First-time borrowers may have lower limits.",
      },
      {
        q: "What interest rates can I expect?",
        a: "Interest rates range from 10% to 18% per year, depending on your credit score, loan amount, and term. Rates are fixed for the duration of your loan.",
      },
      {
        q: "How long does approval take?",
        a: "We review applications within 24-48 hours. Once approved, your loan is listed on the marketplace for investors to fund.",
      },
      {
        q: "What happens if I can't repay on time?",
        a: "Late payments incur a 1% daily late fee on the overdue amount. Continued non-payment affects your credit score and may result in collection actions.",
      },
    ],
  },
  {
    category: "For Lenders",
    questions: [
      {
        q: "What returns can I expect?",
        a: "Returns typically range from 10% to 18% per year, depending on the risk grade of loans you invest in. Higher risk loans offer higher potential returns.",
      },
      {
        q: "Is there a minimum investment amount?",
        a: "The minimum investment per loan is ₫500,000. There is no maximum limit.",
      },
      {
        q: "How do I get paid?",
        a: "Borrowers make monthly payments which are automatically distributed to all lenders proportionally. Funds are credited to your wallet within 24 hours.",
      },
      {
        q: "What if a borrower defaults?",
        a: "We have a collection process for defaulted loans. While we cannot guarantee full recovery, we work to recover as much as possible on behalf of lenders.",
      },
      {
        q: "Can I withdraw my invested funds early?",
        a: "Invested funds are locked until the loan is repaid. However, you can withdraw any uninvested funds from your wallet at any time.",
      },
    ],
  },
  {
    category: "Account & Security",
    questions: [
      {
        q: "How is my data protected?",
        a: "We use bank-level 256-bit SSL encryption for all data transmission. Your personal information is stored securely and never shared with third parties without your consent.",
      },
      {
        q: "What is KYC and why is it required?",
        a: "KYC (Know Your Customer) is a verification process required by financial regulations. It helps us verify your identity and prevent fraud.",
      },
      {
        q: "How do I reset my password?",
        a: 'Click "Forgot Password" on the login page. We\'ll send a reset link to your registered email address.',
      },
      {
        q: "Can I have both borrower and lender accounts?",
        a: "Yes, you can use Nexo as both a borrower and a lender with the same account. However, you cannot invest in your own loans.",
      },
    ],
  },
  {
    category: "Payments & Withdrawals",
    questions: [
      {
        q: "What payment methods are supported?",
        a: "We support VNPay for deposits and bank transfers for withdrawals. More payment methods will be added soon.",
      },
      {
        q: "How long do withdrawals take?",
        a: "Withdrawal requests are processed within 24-48 hours. Funds typically arrive in your bank account within 1-3 business days.",
      },
      {
        q: "Are there any fees for deposits or withdrawals?",
        a: "Deposits are free. Withdrawals may incur a small bank transfer fee depending on your bank.",
      },
    ],
  },
];

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFaqs = faqs
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.a.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((category) => category.questions.length > 0);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Find answers to common questions about Nexo P2P Lending.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search FAQ..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8 max-w-4xl mx-auto">
          {filteredFaqs.map((category, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{category.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {category.questions.map((faq, i) => (
                    <div
                      key={i}
                      className="border-b border-border/50 pb-4 last:border-0 last:pb-0"
                    >
                      <h3 className="font-semibold mb-2">{faq.q}</h3>
                      <p className="text-muted-foreground text-sm">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No questions found matching your search.
              </p>
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <Card className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">
              Our support team is here to help. Contact us anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@nexo.vn"
                className="text-primary hover:underline"
              >
                support@nexo.vn
              </a>
              <span className="hidden sm:inline text-muted-foreground">|</span>
              <a href="tel:1900xxxxxx" className="text-primary hover:underline">
                1900 xxxx xxx
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
