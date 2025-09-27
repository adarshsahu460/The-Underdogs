import { Link } from 'react-router-dom';
import { ArrowRight, Code, Users, Zap, Search, Upload, TrendingUp } from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: Code,
      title: 'Discover Projects',
      description: 'Browse through a curated collection of unfinished engineering projects waiting for the right hands.',
    },
    {
      icon: Users,
      title: 'Connect & Collaborate',
      description: 'Find like-minded developers and continue building amazing projects together.',
    },
    {
      icon: Zap,
      title: 'AI-Powered Insights',
      description: 'Get intelligent project health reports and roadmaps to accelerate development.',
    },
  ];

  const stats = [
    { number: '250+', label: 'Projects Available' },
    { number: '500+', label: 'Active Developers' },
    { number: '89%', label: 'Success Rate' },
    { number: '24h', label: 'Avg. Response Time' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Marketplace for{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Unfinished
              </span>{' '}
              Engineering Projects
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Give abandoned side projects a second chance. Connect with developers, 
              adopt fascinating projects, and turn great ideas into reality.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/browse"
                className="group bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 flex items-center justify-center"
              >
                <Search className="h-5 w-5 mr-2" />
                Browse Projects
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/upload"
                className="group bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-all transform hover:scale-105 flex items-center justify-center border-2 border-purple-500"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Project
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How EngiVerse Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transforming abandoned code into collaborative success stories
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Revive Amazing Projects?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of developers giving life to abandoned projects and building the next big thing together.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/browse"
              className="group bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 flex items-center justify-center"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Start Exploring
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/upload"
              className="group bg-transparent text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-all transform hover:scale-105 flex items-center justify-center border-2 border-white"
            >
              Share Your Project
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;