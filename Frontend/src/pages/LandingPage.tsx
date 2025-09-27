import { Link } from 'react-router-dom';
import { ArrowRight, Code, Users, Zap, Search, Upload, TrendingUp, Star, CheckCircle, Clock, Github } from 'lucide-react';
import { useState, useEffect } from 'react';

const LandingPage = () => {
  const [animatedStats, setAnimatedStats] = useState([0, 0, 0, 0]);

  const features = [
    {
      icon: Code,
      title: 'Discover Projects',
      description: 'Browse through a curated collection of unfinished engineering projects waiting for the right hands.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users,
      title: 'Connect & Collaborate',
      description: 'Find like-minded developers and continue building amazing projects together.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Zap,
      title: 'AI-Powered Insights',
      description: 'Get intelligent project health reports and roadmaps to accelerate development.',
      color: 'from-amber-500 to-orange-500'
    },
  ];

  const stats = [
    { number: 25, label: 'Projects Available', suffix: '+' },
    { number: 500, label: 'Active Developers', suffix: '+' },
    { number: 89, label: 'Success Rate', suffix: '%' },
    { number: 24, label: 'Avg. Response Time', suffix: 'h' },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Full Stack Developer",
      company: "Tech Startup",
      quote: "Found an amazing ML project that became my first successful SaaS. The community support was incredible!",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Marcus Rodriguez",
      role: "Senior Engineer",
      company: "Fortune 500",
      quote: "Uploaded my abandoned React Native app and watched it flourish under new maintainers. Great platform!",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const recentProjects = [
    { name: "AI Chat Assistant", tech: "Python, OpenAI", status: "Just adopted!" },
    { name: "E-commerce Dashboard", tech: "React, Node.js", status: "2 interested" },
    { name: "Mobile Fitness Tracker", tech: "React Native", status: "New today" }
  ];

  // Animate stats on mount
  useEffect(() => {
    const animateStats = () => {
      stats.forEach((stat, index) => {
        let current = 0;
        const increment = stat.number / 50;
        const timer = setInterval(() => {
          current += increment;
          if (current >= stat.number) {
            current = stat.number;
            clearInterval(timer);
          }
          setAnimatedStats(prev => {
            const newStats = [...prev];
            newStats[index] = Math.floor(current);
            return newStats;
          });
        }, 40);
      });
    };

    const timer = setTimeout(animateStats, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Code className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Dev-Yard</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/browse" className="text-gray-600 hover:text-blue-600 transition-colors">Browse</Link>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">How it Works</a>
              <a href="#success-stories" className="text-gray-600 hover:text-blue-600 transition-colors">Stories</a>
              <Link to="/upload" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-indigo-900/50"></div>
        
        {/* Animated Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="absolute inset-0 animate-pulse" 
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 text-sm">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Trusted by 500+ developers worldwide
            </div>

            <h1 className="text-4xl lg:text-7xl font-bold mb-6 leading-tight">
              Marketplace for{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                Unfinished
              </span>{' '}
              <br className="hidden sm:block" />
              Engineering Projects
            </h1>
            
            <p className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
              Give abandoned side projects a second chance. Connect with developers, 
              adopt fascinating projects, and turn great ideas into reality.
            </p>

            {/* Quick Search Bar */}
            <div className="max-w-2xl mx-auto mb-10">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search projects by tech stack, domain, or keywords..."
                  className="w-full px-6 py-4 pl-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
                <Search className="absolute left-4 top-4 h-6 w-6 text-blue-300" />
                <Link
                  to="/browse"
                  className="absolute right-2 top-2 bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-xl text-white font-medium transition-all"
                >
                  Search
                </Link>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/browse"
                className="group bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center"
              >
                <Search className="h-5 w-5 mr-2" />
                Browse Projects
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/upload"
                className="group bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all transform hover:scale-105 flex items-center justify-center border border-white/20"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Project
              </Link>
            </div>

            {/* Recent Activity Ticker */}
            <div className="text-sm text-blue-200 flex items-center justify-center gap-4 animate-pulse">
              <Clock className="h-4 w-4" />
              Live: React Dashboard just got adopted • Python ML project trending • 3 new uploads today
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Animation */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform group-hover:scale-105">
                  <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {animatedStats[index]}{stat.suffix}
                  </div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Enhanced Cards */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-2 text-blue-600 font-medium mb-4">
              How Dev-Yard Works
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Transforming abandoned code into collaborative success stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform connects passionate developers with unfinished projects, creating opportunities for innovation and growth
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative">
                <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all transform group-hover:scale-105 group-hover:-translate-y-2 border border-gray-100">
                  <div className={`bg-gradient-to-r ${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-6 transition-transform`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <div className="flex items-center text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section id="success-stories" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600">
              Real developers, real transformations
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-start gap-4 mb-6">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role} at {testimonial.company}</p>
                  </div>
                  <div className="flex gap-1 ml-auto">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>

          {/* Recent Projects */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">🔥 Trending Projects</h3>
              <Link to="/browse" className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {recentProjects.map((project, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Github className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{project.name}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{project.tech}</p>
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Revive Amazing Projects?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
            Join thousands of developers giving life to abandoned projects and building the next big thing together.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/browse"
              className="group bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Start Exploring
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/upload"
              className="group bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all transform hover:scale-105 flex items-center justify-center border border-white/20"
            >
              Share Your Project
            </Link>
          </div>

          <p className="text-blue-200 text-sm">
            No credit card required • Free to browse • Instant access
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Code className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">Dev-Yard</span>
              </div>
              <p className="text-gray-400">
                Giving abandoned projects a second chance to become something amazing.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/browse" className="hover:text-white transition-colors">Browse Projects</Link></li>
                <li><Link to="/upload" className="hover:text-white transition-colors">Upload Project</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#success-stories" className="hover:text-white transition-colors">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Developer Forum</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
            <p>&copy; 2024 Dev-Yard. All rights reserved. Made with ❤️ for the developer community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;