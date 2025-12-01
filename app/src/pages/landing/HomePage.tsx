import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowRight, 
  Shield, 
  TrendingUp, 
  Users, 
  Wallet, 
  CheckCircle,
  Star,
  Building2,
  GraduationCap,
  Heart,
  Home
} from 'lucide-react';

const stats = [
  { label: 'Total Volume', value: '₫50B+', description: 'Funded since 2024' },
  { label: 'Active Users', value: '10,000+', description: 'Borrowers & Lenders' },
  { label: 'Success Rate', value: '98%', description: 'On-time repayment' },
  { label: 'Avg. Return', value: '14%', description: 'Annual for lenders' },
];

const features = [
  {
    icon: Shield,
    title: 'Secure & Verified',
    description: 'All users undergo KYC verification. Your funds are protected with bank-level security.',
  },
  {
    icon: TrendingUp,
    title: 'Competitive Returns',
    description: 'Earn up to 18% annual returns as a lender. Better than traditional savings accounts.',
  },
  {
    icon: Users,
    title: 'Peer-to-Peer',
    description: 'Direct connection between borrowers and lenders. No middleman, lower costs.',
  },
  {
    icon: Wallet,
    title: 'Easy Payments',
    description: 'Seamless deposit and withdrawal via VNPay. Track all transactions in real-time.',
  },
];

const loanPurposes = [
  { icon: Building2, title: 'Business', rate: '12-16%' },
  { icon: GraduationCap, title: 'Education', rate: '10-14%' },
  { icon: Heart, title: 'Medical', rate: '12-15%' },
  { icon: Home, title: 'Home Improvement', rate: '11-15%' },
];

const testimonials = [
  {
    name: 'Nguyễn Văn Minh',
    role: 'Business Owner',
    content: 'Nexo helped me expand my coffee shop when banks rejected my loan. The process was fast and transparent.',
    rating: 5,
  },
  {
    name: 'Trần Thu Hà',
    role: 'Lender',
    content: 'I\'ve been investing on Nexo for 6 months. Returns are consistent and the platform is very user-friendly.',
    rating: 5,
  },
  {
    name: 'Lê Hoàng Đức',
    role: 'Startup Founder',
    content: 'Got funding for my tech startup in just 2 weeks. The community of lenders is amazing.',
    rating: 5,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 py-20 lg:py-32">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        
        <div className="container relative mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary mb-6">
                <Star className="h-4 w-4" />
                #1 P2P Lending Platform in Vietnam
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                <span className="gradient-text">Connect.</span>{' '}
                <span className="gradient-text">Invest.</span>{' '}
                <span className="gradient-text">Grow.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
                Nexo connects borrowers who need funding with investors seeking better returns. 
                Start your journey to financial freedom today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" asChild className="gap-2">
                  <Link to="/register">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/how-it-works">How It Works</Link>
                </Button>
              </div>
            </div>

            <div className="flex-1 w-full max-w-lg">
              <Card className="glass animate-pulse-glow">
                <CardHeader>
                  <CardTitle>Quick Loan Calculator</CardTitle>
                  <CardDescription>See your potential monthly payment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <div className="text-4xl font-bold text-primary mb-2">₫50,000,000</div>
                    <div className="text-muted-foreground">Example loan amount</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-semibold">14%</div>
                      <div className="text-xs text-muted-foreground">Interest Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">12</div>
                      <div className="text-xs text-muted-foreground">Months</div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">₫4.5M</div>
                      <div className="text-xs text-muted-foreground">Monthly</div>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link to="/register">Apply Now</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm font-medium">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Nexo?</h2>
            <p className="text-muted-foreground">
              We're revolutionizing the way people borrow and invest in Vietnam.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover border-border/50">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Loan Purposes */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">Loans for Every Purpose</h2>
            <p className="text-muted-foreground">
              Whether you're starting a business or funding education, we've got you covered.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loanPurposes.map((purpose, index) => (
              <Card key={index} className="text-center card-hover">
                <CardContent className="pt-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <purpose.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{purpose.title}</h3>
                  <p className="text-sm text-muted-foreground">Interest from {purpose.rate}/year</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">
              Get started in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up and complete KYC verification' },
              { step: '02', title: 'Choose Your Role', desc: 'Become a borrower or lender (or both!)' },
              { step: '03', title: 'Start Transacting', desc: 'Request loans or invest in opportunities' },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="text-6xl font-bold text-primary/10 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-muted-foreground">
              Join thousands of satisfied borrowers and lenders
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
            <CardContent className="py-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Join Nexo today and experience the future of peer-to-peer lending. 
                Whether you need funds or want to invest, we're here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/register?role=borrower">Apply for a Loan</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/register?role=lender">Start Investing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/how-it-works" className="hover:text-primary">How It Works</Link></li>
                <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
                <li><Link to="/calculator" className="hover:text-primary">Loan Calculator</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
                <li><Link to="/careers" className="hover:text-primary">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-primary">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
                <li><Link to="/security" className="hover:text-primary">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>support@nexo.vn</li>
                <li>1900 xxxx xxx</li>
                <li>Ho Chi Minh City, Vietnam</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 Nexo P2P Lending. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}


