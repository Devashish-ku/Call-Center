'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Users, BarChart3, Shield, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/employee/dashboard');
      }
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <Phone className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">CallCenter Pro</span>
          </div>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Streamline Your Call Center Operations
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            A comprehensive management system for tracking employee performance, managing call logs, and sharing critical data in real-time.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8">
                Get Started
                <Phone className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Employee Management</CardTitle>
              <CardDescription>
                Manage up to 20 employees with role-based access control and activity tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Call Analytics</CardTitle>
              <CardDescription>
                Comprehensive call logs with status tracking, duration analysis, and performance metrics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Secure Access</CardTitle>
              <CardDescription>
                JWT-based authentication with encrypted passwords and role-based permissions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Data Sharing</CardTitle>
              <CardDescription>
                Share reports, call logs, and announcements directly with employees
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Real-Time Updates</CardTitle>
              <CardDescription>
                Automatic synchronization of call records and notifications
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Phone className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Call History</CardTitle>
              <CardDescription>
                Complete call history with filters for date, status, and employee performance
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Roles Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Built for Your Team</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              <CardDescription className="text-base">
                Full control over your call center operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Add, edit, and deactivate employee accounts
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  View all call logs across the organization
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Share data and reports with specific employees
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Advanced filtering and analytics
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Employee Dashboard</CardTitle>
              <CardDescription className="text-base">
                Access personal performance data and assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  View personal call history and metrics
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Access shared data from admin
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Real-time notification system
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Performance tracking dashboard
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 CallCenter Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}