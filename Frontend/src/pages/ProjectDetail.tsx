import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, Users, ExternalLink, GitBranch, Code, Clock, 
  MessageSquare, Plus, Send, TrendingUp, Target, FileText,
  CheckCircle, AlertCircle, Zap 
} from 'lucide-react';

interface Project {
  _id: string;
  title: string;
  description: string;
  category: string;
  languages: string[];
  reasonHalted: string;
  projectFile?: {
    filename: string;
    originalName: string;
    s3Key: string;
    s3Url: string;
    uploadedAt: string;
  };
  links: {
    documentation?: string;
    demo?: string;
  };
  contributors: any[];
  feedback: any[];
  timeline: any[];
  createdAt: string;
  status: string;
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [feedbackText, setFeedbackText] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [showAdoptModal, setShowAdoptModal] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      // Mock data for demonstration
      const mockProject: Project = {
        _id: id || '1',
        title: 'AI-Powered Task Manager',
        description: 'A comprehensive task management application that leverages artificial intelligence to automatically categorize, prioritize, and suggest optimal scheduling for user tasks. The system uses natural language processing to understand task descriptions and machine learning algorithms to learn from user behavior patterns.\n\nKey features include:\n- Smart task categorization using NLP\n- Automatic priority assignment based on deadlines and importance\n- Intelligent scheduling suggestions\n- Integration with popular calendar applications\n- Real-time collaboration features\n- Advanced analytics and productivity insights\n\nThe project is built using modern web technologies with a React frontend, Node.js backend, and MongoDB database. The AI components are integrated through the OpenAI API and custom machine learning models.',
        category: 'Web Development',
        languages: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'OpenAI API', 'TensorFlow.js'],
        reasonHalted: 'Time Constraints',
        projectFile: {
          filename: 'ai-task-manager-1642234567890.zip',
          originalName: 'ai-task-manager.zip',
          s3Key: 'projects/ai-task-manager-1642234567890.zip',
          s3Url: 'https://bucket.s3.amazonaws.com/projects/ai-task-manager-1642234567890.zip',
          uploadedAt: '2024-01-15T10:00:00Z'
        },
        links: {
          documentation: 'https://docs.example.com',
          demo: 'https://demo.example.com'
        },
        contributors: [
          { name: 'John Doe', role: 'Original Developer', joinedAt: '2024-01-15T10:00:00Z' },
          { name: 'Alice Smith', role: 'Contributor', joinedAt: '2024-01-20T14:30:00Z' }
        ],
        feedback: [
          {
            text: 'This looks like an amazing project! The AI integration approach is really innovative. I\'d love to help with the frontend components.',
            user: 'Bob Wilson',
            createdAt: '2024-01-18T16:20:00Z'
          },
          {
            text: 'Great work on the backend architecture. The API design is clean and well-documented. Have you considered adding real-time notifications?',
            user: 'Carol Brown',
            createdAt: '2024-01-22T11:45:00Z'
          }
        ],
        timeline: [
          {
            milestone: 'Project created and initial setup completed',
            date: '2024-01-15T10:00:00Z',
            contributor: 'John Doe'
          },
          {
            milestone: 'Basic CRUD operations for tasks implemented',
            date: '2024-01-16T14:30:00Z',
            contributor: 'John Doe'
          },
          {
            milestone: 'OpenAI API integration for task categorization',
            date: '2024-01-18T09:15:00Z',
            contributor: 'John Doe'
          },
          {
            milestone: 'Alice Smith joined the project',
            date: '2024-01-20T14:30:00Z',
            contributor: 'Alice Smith'
          },
          {
            milestone: 'Frontend UI components design completed',
            date: '2024-01-21T16:45:00Z',
            contributor: 'Alice Smith'
          }
        ],
        createdAt: '2024-01-15T10:00:00Z',
        status: 'Available'
      };
      
      setProject(mockProject);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching project:', error);
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    // In a real app, this would make an API call
    console.log('Submitting feedback:', feedbackText);
    setFeedbackText('');
  };

  const handleAdoptProject = () => {
    if (!contributorName.trim()) return;

    // In a real app, this would make an API call
    console.log('Adopting project with contributor:', contributorName);
    setContributorName('');
    setShowAdoptModal(false);
  };

  const handleDownloadProject = async () => {
    try {
      // In a real app, this would call your API to get a signed download URL
      // const response = await fetch(`/api/projects/${project._id}/download`);
      // const { downloadUrl } = await response.json();
      // window.open(downloadUrl, '_blank');
      
      console.log('Downloading project files for:', project?.title);
      alert('Download would start here in a real implementation');
    } catch (error) {
      console.error('Error downloading project:', error);
      alert('Error downloading project files');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Web Development': 'bg-blue-100 text-blue-800',
      'Mobile App': 'bg-purple-100 text-purple-800',
      'Machine Learning': 'bg-green-100 text-green-800',
      'IoT': 'bg-orange-100 text-orange-800',
      'Game Development': 'bg-pink-100 text-pink-800',
      'Blockchain': 'bg-indigo-100 text-indigo-800',
      'DevOps': 'bg-red-100 text-red-800',
      'Data Science': 'bg-teal-100 text-teal-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || colors.Other;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600">The project you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(project.category)}`}>
                  {project.category}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {project.status}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{project.title}</h1>
              
              <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Created {formatDate(project.createdAt)}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {project.contributors.length} contributor{project.contributors.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Halted: {project.reasonHalted}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {project.languages.map((language, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {language}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Project Links */}
              <div className="flex gap-3">
                {project.projectFile && (
                  <button
                    onClick={handleDownloadProject}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Code
                  </button>
                )}
                {project.links.demo && (
                  <a
                    href={project.links.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Demo
                  </a>
                )}
                {project.links.documentation && (
                  <a
                    href={project.links.documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Code className="h-4 w-4" />
                    Docs
                  </a>
                )}
              </div>

              {/* Adopt Project Button */}
              <button
                onClick={() => setShowAdoptModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Plus className="h-5 w-5" />
                Adopt Project
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {[
                { id: 'overview', label: 'Overview', icon: FileText },
                { id: 'ai-insights', label: 'AI Insights', icon: Zap },
                { id: 'timeline', label: 'Timeline', icon: TrendingUp },
                { id: 'feedback', label: 'Feedback', icon: MessageSquare }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Project Description</h3>
                  <div className="prose prose-gray max-w-none">
                    {project.description.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Contributors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.contributors.map((contributor, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{contributor.name}</div>
                          <div className="text-sm text-gray-600">{contributor.role}</div>
                          <div className="text-xs text-gray-500">
                            Joined {formatDate(contributor.joinedAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI Insights Tab */}
            {activeTab === 'ai-insights' && (
              <div className="space-y-8">
                {/* AI Project Health Report */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">AI Project Health Report</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">87%</div>
                      <div className="text-sm text-gray-600">Code Quality</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">72%</div>
                      <div className="text-sm text-gray-600">Completion</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">94%</div>
                      <div className="text-sm text-gray-600">Market Viability</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Key Insights</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm text-gray-700">Strong architectural foundation with modern tech stack</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm text-gray-700">Well-documented API endpoints and database schema</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <span className="text-sm text-gray-700">Frontend components need completion and testing</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Next Steps Roadmap */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Next Steps Roadmap</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { priority: 'High', task: 'Complete user authentication system', estimate: '2-3 weeks' },
                      { priority: 'High', task: 'Implement task categorization AI model', estimate: '3-4 weeks' },
                      { priority: 'Medium', task: 'Build responsive frontend components', estimate: '2-3 weeks' },
                      { priority: 'Medium', task: 'Add real-time notifications', estimate: '1-2 weeks' },
                      { priority: 'Low', task: 'Implement advanced analytics dashboard', estimate: '3-4 weeks' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg">
                        <div className="flex items-center gap-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.priority === 'High' ? 'bg-red-100 text-red-800' :
                            item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.priority}
                          </span>
                          <span className="text-gray-900">{item.task}</span>
                        </div>
                        <span className="text-sm text-gray-500">{item.estimate}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pitch Deck Generator */}
                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">AI-Generated Pitch Deck</h3>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Executive Summary</h4>
                    <p className="text-gray-700 mb-4">
                      This AI-powered task management solution addresses the growing need for intelligent productivity tools 
                      in the modern workplace. By leveraging natural language processing and machine learning, it offers 
                      unprecedented automation in task organization and scheduling.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Market Opportunity</h5>
                        <p className="text-sm text-gray-600">$4.3B productivity software market with 15% annual growth</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Competitive Advantage</h5>
                        <p className="text-sm text-gray-600">AI-first approach with intelligent automation features</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Project Timeline</h3>
                <div className="space-y-6">
                  {project.timeline.map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{item.milestone}</h4>
                          <span className="text-sm text-gray-500">{formatDate(item.date)}</span>
                        </div>
                        <p className="text-sm text-gray-600">by {item.contributor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <div className="space-y-8">
                {/* Feedback Form */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Feedback</h3>
                  <form onSubmit={handleFeedbackSubmit}>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Share your thoughts, suggestions, or questions about this project..."
                      className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <div className="flex justify-end mt-4">
                      <button
                        type="submit"
                        disabled={!feedbackText.trim()}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="h-4 w-4" />
                        Submit Feedback
                      </button>
                    </div>
                  </form>
                </div>

                {/* Existing Feedback */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Community Feedback</h3>
                  <div className="space-y-6">
                    {project.feedback.map((feedback, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-900">{feedback.user}</span>
                          </div>
                          <span className="text-sm text-gray-500">{formatDate(feedback.createdAt)}</span>
                        </div>
                        <p className="text-gray-700">{feedback.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Adopt Project Modal */}
        {showAdoptModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Adopt This Project</h2>
              <p className="text-gray-600 mb-6">
                By adopting this project, you're committing to contribute to its development. 
                Your name will be added to the contributors list and timeline.
              </p>
              <input
                type="text"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6"
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAdoptModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdoptProject}
                  disabled={!contributorName.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Adopt Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;