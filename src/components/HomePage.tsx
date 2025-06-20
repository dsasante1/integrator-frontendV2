import React from 'react';
import { ArrowRight, Shield, Zap, RefreshCw, GitBranch, Clock, Users } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">integrator*</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href="/app" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </a>
              <a 
                href="/app?mode=signup" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
              >
                Create Account
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              API Collection Management
              <span className="block text-blue-600">Made Simple</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Track, version, and compare your Postman collections with ease. 
              Never lose track of API changes again.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/app" 
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition duration-150 ease-in-out"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <a 
                href="#features" 
                className="inline-flex items-center bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-8 rounded-lg shadow-md border border-gray-300 transition duration-150 ease-in-out"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything you need for API collection management
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features to help you manage your API collections efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition duration-150 ease-in-out">
              <div className="bg-blue-100 rounded-lg p-3 inline-block mb-4">
                <GitBranch className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Version Control</h4>
              <p className="text-gray-600">
                Track changes to your API collections over time with automatic versioning and snapshots.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition duration-150 ease-in-out">
              <div className="bg-green-100 rounded-lg p-3 inline-block mb-4">
                <RefreshCw className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Smart Comparison</h4>
              <p className="text-gray-600">
                Compare different versions of your collections to see what changed between snapshots.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition duration-150 ease-in-out">
              <div className="bg-purple-100 rounded-lg p-3 inline-block mb-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Instant Import</h4>
              <p className="text-gray-600">
                Import collections directly from Postman using your API key or upload JSON files.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition duration-150 ease-in-out">
              <div className="bg-yellow-100 rounded-lg p-3 inline-block mb-4">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">History Tracking</h4>
              <p className="text-gray-600">
                View complete history of all changes with timestamps and detailed change logs.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition duration-150 ease-in-out">
              <div className="bg-red-100 rounded-lg p-3 inline-block mb-4">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Secure Storage</h4>
              <p className="text-gray-600">
                Your API collections and keys are stored securely with encryption and access controls.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition duration-150 ease-in-out">
              <div className="bg-indigo-100 rounded-lg p-3 inline-block mb-4">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Team Collaboration</h4>
              <p className="text-gray-600">
                Share collections with your team and collaborate on API development efficiently.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to streamline your API workflow?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Join developers who are already managing their API collections smarter.
          </p>
          <a 
            href="/app" 
            className="inline-flex items-center bg-white hover:bg-gray-100 text-blue-600 font-semibold py-3 px-8 rounded-lg shadow-lg transition duration-150 ease-in-out"
          >
            Start Free Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm">
              © 2025 integrator*. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;