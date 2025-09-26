import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, ExternalLink, Download, Code, Clock, FileArchive } from 'lucide-react';

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
  createdAt: string;
  status: string;
}

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(project.category)}`}>
            {project.category}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {project.title}
        </h3>
        
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
          {project.description}
        </p>

        {/* Languages */}
        <div className="flex flex-wrap gap-1 mb-4">
          {project.languages.slice(0, 3).map((language, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
            >
              {language}
            </span>
          ))}
          {project.languages.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
              +{project.languages.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="px-6 pb-4 space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          <span className="mr-4">Halted: {project.reasonHalted}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{project.contributors.length} contributor{project.contributors.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formatDate(project.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Links */}
      {(project.projectFile || project.links.demo || project.links.documentation) && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3">
            {project.projectFile && (
              <button
                onClick={() => {
                  // In a real app, this would call the download API
                  console.log('Download project:', project._id);
                }}
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                title="Download Project Files"
              >
                <FileArchive className="h-4 w-4" />
              </button>
            )}
            {project.links.demo && (
              <a
                href={project.links.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                title="Live Demo"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            {project.links.documentation && (
              <a
                href={project.links.documentation}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                title="Documentation"
              >
                <Code className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <Link
          to={`/project/${project._id}`}
          className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ProjectCard;