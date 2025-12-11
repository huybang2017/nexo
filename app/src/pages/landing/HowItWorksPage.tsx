import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus,
  FileCheck,
  Wallet,
  FileText,
  Search,
  PiggyBank,
  ArrowRight,
  CheckCircle2,
  Clock,
  Shield,
} from "lucide-react";

const borrowerSteps = [
  {
    icon: UserPlus,
    title: "Create Account",
    description:
      "Sign up with your email or Google account. It only takes 2 minutes.",
  },
  {
    icon: FileCheck,
    title: "Complete KYC",
    description:
      "Verify your identity by uploading your ID card and a selfie. This ensures platform safety.",
  },
  {
    icon: FileText,
    title: "Submit Loan Request",
    description:
      "Fill out the loan application form. Specify the amount, purpose, and term.",
  },
  {
    icon: Clock,
    title: "Wait for Approval",
    description: "Our team reviews your application within 24-48 hours.",
  },
  {
    icon: PiggyBank,
    title: "Get Funded",
    description:
      "Once approved, lenders can invest in your loan. Funds are disbursed when fully funded.",
  },
  {
    icon: Wallet,
    title: "Repay Monthly",
    description:
      "Make monthly payments through your wallet. Build credit with on-time payments.",
  },
];

const lenderSteps = [
  {
    icon: UserPlus,
    title: "Create Account",
    description: 'Sign up and choose "Lender" as your role.',
  },
  {
    icon: FileCheck,
    title: "Complete KYC",
    description: "Verify your identity to start investing.",
  },
  {
    icon: Wallet,
    title: "Deposit Funds",
    description: "Add funds to your wallet via VNPay or bank transfer.",
  },
  {
    icon: Search,
    title: "Browse Marketplace",
    description: "Explore available loans. Filter by risk, rate, and purpose.",
  },
  {
    icon: PiggyBank,
    title: "Invest",
    description: "Choose loans that match your criteria and invest any amount.",
  },
  {
    icon: Wallet,
    title: "Earn Returns",
    description:
      "Receive monthly payments as borrowers repay. Track your portfolio.",
  },
];

const benefits = [
  {
    title: "For Borrowers",
    items: [
      "Lower interest rates than traditional loans",
      "Fast approval process (24-48 hours)",
      "No collateral required for smaller amounts",
      "Flexible repayment terms (1-60 months)",
      "Build credit score with on-time payments",
      "Transparent fees with no hidden charges",
    ],
  },
  {
    title: "For Lenders",
    items: [
      "Higher returns than savings accounts (up to 18%)",
      "Diversify across multiple loans",
      "Choose your risk level",
      "Monthly passive income",
      "Full transparency on borrower profiles",
      "Easy withdrawal of funds",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold mb-4">How Nexo Works</h1>
          <p className="text-xl text-muted-foreground">
            Whether you're looking to borrow or invest, we've made the process
            simple and transparent.
          </p>
        </div>

        {/* Tabs for Borrower/Lender */}
        <Tabs defaultValue="borrower" className="mb-16">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="borrower">I Want to Borrow</TabsTrigger>
            <TabsTrigger value="lender">I Want to Invest</TabsTrigger>
          </TabsList>

          <TabsContent value="borrower" className="mt-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {borrowerSteps.map((step, index) => (
                <Card key={index} className="relative card-hover">
                  <div className="absolute top-4 right-4 text-4xl font-bold text-primary/10">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button size="lg" asChild>
                <Link to="/register?role=borrower">
                  Apply for a Loan <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="lender" className="mt-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lenderSteps.map((step, index) => (
                <Card key={index} className="relative card-hover">
                  <div className="absolute top-4 right-4 text-4xl font-bold text-primary/10">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button size="lg" asChild>
                <Link to="/register?role=lender">
                  Start Investing <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Benefits</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Safety */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="py-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">
                  Your Safety is Our Priority
                </h3>
                <p className="text-muted-foreground mb-4">
                  All users undergo strict KYC verification. We use bank-level
                  encryption and security measures to protect your data and
                  funds. Our platform is monitored 24/7 for suspicious
                  activities.
                </p>
                <Button variant="outline" asChild>
                  <Link to="/security">Learn About Our Security</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
