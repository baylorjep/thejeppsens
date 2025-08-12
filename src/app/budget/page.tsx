'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { DollarSign, Eye, EyeOff, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BudgetPage() {
  const [showSignIn, setShowSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClose = () => {
    router.push('/');
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Allow either Baylor or Isabel's email with password "jeppsen"
    const validEmails = ['baylorjeppsen@gmail.com', 'isabel.harker@yahoo.com'];
    const validPassword = 'jeppsen';
    
    if (validEmails.includes(email) && password === validPassword) {
      setIsLoading(true);
      
      // Simulate loading
      setTimeout(() => {
        setIsLoading(false);
        setShowSignIn(false);
      }, 2000);
    } else {
      // Show error for wrong credentials
      alert('Invalid email or password. Please try again.');
      setEmail('');
      setPassword('');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      {showSignIn ? (
        // Sign In Modal
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="text-center mb-8">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Budget Tracker</h2>
              <p className="text-gray-600">Sign in to access your financial dashboard</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isLoading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Budget Dashboard (Demo)
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                <DollarSign className="inline-block h-8 w-8 text-blue-600 mr-3" />
                Financial Dashboard
              </h1>
              <p className="text-xl text-gray-600">Track your spending and plan your future together</p>
            </div>

            {/* Embedded Google Sheets Budget */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Monthly Budget Tracker</h3>
                <p className="text-sm text-gray-600">Real-time updates from your Google Sheets</p>
              </div>
              <div className="w-full h-[800px]">
                <iframe 
                  src="https://docs.google.com/spreadsheets/d/e/2PACX-1vROYeBRucMwPaBApTXyxHdqk4mKe2IYEf23TYO_ZHJGdgx9KE73rMUxOBxUW7h5iXxSNk28q1BDb-bH/pubhtml?widget=true&amp;headers=false"
                  className="w-full h-full border-0"
                  title="Budget Tracker"
                />
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="text-center mt-8">
              <button 
                onClick={() => setShowSignIn(true)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 