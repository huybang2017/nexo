import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Users, Award, Shield, Zap } from "lucide-react";

const team = [
  {
    name: "Nguyễn Minh Tuấn",
    role: "CEO & Co-Founder",
    image: "/team/ceo.jpg",
  },
  { name: "Trần Thu Hương", role: "CTO & Co-Founder", image: "/team/cto.jpg" },
  { name: "Lê Hoàng Đức", role: "CFO", image: "/team/cfo.jpg" },
  { name: "Phạm Thị Mai", role: "Head of Operations", image: "/team/ops.jpg" },
];

const values = [
  {
    icon: Shield,
    title: "Trust & Security",
    desc: "Your security is our top priority. We implement bank-level security measures.",
  },
  {
    icon: Users,
    title: "Community First",
    desc: "We believe in the power of community and peer-to-peer connections.",
  },
  {
    icon: Zap,
    title: "Innovation",
    desc: "Constantly improving our platform with cutting-edge technology.",
  },
  {
    icon: Award,
    title: "Excellence",
    desc: "Striving for excellence in everything we do.",
  },
];

const milestones = [
  {
    year: "2023",
    title: "Founded",
    desc: "Nexo was founded with a mission to democratize lending.",
  },
  {
    year: "2023",
    title: "First Loan",
    desc: "Successfully funded our first loan of ₫50M.",
  },
  {
    year: "2024",
    title: "1000 Users",
    desc: "Reached 1000 active users on the platform.",
  },
  {
    year: "2024",
    title: "₫10B Volume",
    desc: "Crossed ₫10 billion in total loan volume.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold mb-4">About Nexo</h1>
          <p className="text-xl text-muted-foreground">
            We're on a mission to transform the way people borrow and invest
            money in Vietnam.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground">
                To provide accessible, transparent, and fair financial services
                that connect people who need funding with those who want to
                invest. We believe everyone deserves access to financial
                opportunities, regardless of their background.
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
              <p className="text-muted-foreground">
                To become Vietnam's leading peer-to-peer lending platform,
                fostering a community where financial goals are achieved through
                trust, technology, and mutual benefit. We envision a future
                where traditional banking barriers no longer limit financial
                growth.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center card-hover">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Our Story */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Journey</h2>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className="text-primary font-bold">
                      {milestone.year}
                    </span>
                  </div>
                  <div className="flex-shrink-0 relative">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    {index < milestones.length - 1 && (
                      <div className="absolute top-3 left-1/2 w-0.5 h-full -translate-x-1/2 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <h3 className="font-semibold">{milestone.title}</h3>
                    <p className="text-muted-foreground">{milestone.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Team</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <Card key={index} className="text-center card-hover">
                <CardContent className="pt-6">
                  <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">10,000+</div>
                <div className="text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">₫50B+</div>
                <div className="text-muted-foreground">Total Funded</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">98%</div>
                <div className="text-muted-foreground">Success Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-muted-foreground">Support</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
