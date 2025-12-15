import Link from 'next/link';
import { MessageSquare, Briefcase, DollarSign, GraduationCap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-4">
      <div className="max-w-4xl w-full space-y-8 text-center">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Job Search Assistant
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered assistant for California county job positions. 
            Get instant answers about salaries, duties, qualifications, and more.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-6 space-y-2">
            <DollarSign className="w-8 h-8 text-primary mx-auto" />
            <h3 className="font-semibold">Salary Information</h3>
            <p className="text-sm text-muted-foreground">
              Find detailed compensation and pay grades
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6 space-y-2">
            <Briefcase className="w-8 h-8 text-primary mx-auto" />
            <h3 className="font-semibold">Job Duties</h3>
            <p className="text-sm text-muted-foreground">
              Understand responsibilities and tasks
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6 space-y-2">
            <GraduationCap className="w-8 h-8 text-primary mx-auto" />
            <h3 className="font-semibold">Qualifications</h3>
            <p className="text-sm text-muted-foreground">
              Learn about education and experience needed
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          <Link
            href="/chat"
            className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg"
          >
            <MessageSquare className="w-6 h-6" />
            Start Chatting
          </Link>
        </div>

        {/* Footer Note */}
        <p className="text-sm text-muted-foreground pt-8">
          Covering 370+ positions across California counties
        </p>
      </div>
    </div>
  );
}
