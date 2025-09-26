import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Code, Calendar, Users, ExternalLink, GitBranch } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';

interface Project {
  _id: string;
  title: string;
  description: string;
  category: string;
  languages: string[];
  reasonHalted: string;
  links: {
    repository?: string;
    documentation?: string;
    demo?: string;
  };
  contributors: any[];
  createdAt: string;
  status: string;
}

const BrowseProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    'Web Development', 'Mobile App', 'Machine Learning', 'IoT', 
    'Game Development', 'Blockchain', 'DevOps', 'Data Science', 'Other'
  ];

  const reasons = [
    'Time Constraints', 'Lack of Skills', 'Lost Interest', 
    'Technical Challenges', 'Funding Issues', 'Market Changes', 'Other'
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, categoryFilter, reasonFilter]);

  const fetchProjects = async () => {
    try {
      // Mock data for demonstration
      const mockProjects: Project[] = [
        {
          _id: '1',
          title: 'AI-Powered Task Manager',
          description: 'A smart task management app that uses natural language processing to categorize and prioritize tasks automatically. Built with React and Node.js, integrated with OpenAI API.',
          category: 'Web Development',
          languages: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
          reasonHalted: 'Time Constraints',
          projectFile: {
            filename: 'ai-task-manager-1642234567890.zip',
            originalName: 'ai-task-manager.zip',
            s3Key: 'projects/ai-task-manager-1642234567890.zip',
            s3Url: 'https://bucket.s3.amazonaws.com/projects/ai-task-manager-1642234567890.zip',
            uploadedAt: '2024-01-15T10:00:00Z'
          },
          links: {
            documentation: 'https://docs.example.com'
          },
          contributors: [],
          createdAt: '2024-01-15T10:00:00Z',
          status: 'Available'
        },
        {
          _id: '2',
          title: 'Blockchain Voting System',
          description: 'A decentralized voting platform ensuring transparency and immutability. Features smart contracts for vote recording and a React frontend for user interaction.',
          category: 'Blockchain',
          languages: ['Solidity', 'React', 'Web3.js', 'Truffle'],
          reasonHalted: 'Technical Challenges',
          projectFile: {
            filename: 'blockchain-voting-1642234567891.zip',
            originalName: 'blockchain-voting.zip',
            s3Key: 'projects/blockchain-voting-1642234567891.zip',
            s3Url: 'https://bucket.s3.amazonaws.com/projects/blockchain-voting-1642234567891.zip',
            uploadedAt: '2024-01-10T14:30:00Z'
          },
          links: {
            demo: 'https://demo.example.com'
          },
          contributors: [{ name: 'Alice' }],
          createdAt: '2024-01-10T14:30:00Z',
          status: 'In Progress'
        },
        {
          _id: '3',
          title: 'IoT Home Automation Hub',
          description: 'Central control system for smart home devices with voice commands and mobile app integration. Supports various IoT protocols and custom device addition.',
          category: 'IoT',
          languages: ['Python', 'React Native', 'MQTT', 'Docker'],
          reasonHalted: 'Funding Issues',
          projectFile: {
            filename: 'iot-hub-1642234567892.zip',
            originalName: 'iot-home-automation.zip',
            s3Key: 'projects/iot-hub-1642234567892.zip',
            s3Url: 'https://bucket.s3.amazonaws.com/projects/iot-hub-1642234567892.zip',
            uploadedAt: '2024-01-05T09:15:00Z'
          },
          links: {
            documentation: 'https://docs.example.com',
            demo: 'https://demo.example.com'
          },
          contributors: [],
          createdAt: '2024-01-05T09:15:00Z',
          status: 'Available'
        }
      ];
      
      setProjects(mockProjects);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.languages.some(lang => lang.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(project => project.category === categoryFilter);
    }

    if (reasonFilter) {
      filtered = filtered.filter(project => project.reasonHalted === reasonFilter);
    }

    setFilteredProjects(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setReasonFilter('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Projects</h1>
          <p className="text-gray-600">Discover amazing unfinished projects waiting for collaborators</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects, languages, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-5 w-5" />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason Halted</label>
                  <select
                    value={reasonFilter}
                    onChange={(e) => setReasonFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Reasons</option>
                    {reasons.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            Found {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria or browse all projects.</p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseProjects;