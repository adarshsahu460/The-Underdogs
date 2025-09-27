import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  ExternalLink,
  Clock,
  FileArchive,
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  languages: string; // JSON string
  originalRepoUrl: string;
  s3ObjectUrl: string;
  reasonHalted: string;
  aiSummary?: string;
  links?: {
    documentation?: string;
    demo?: string;
  };
  collaboratorEmails: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const getCategoryColor = (category: string) => {
    const colors = {
      "Web Development": "bg-blue-100 text-blue-800",
      "Mobile App": "bg-purple-100 text-purple-800",
      "Machine Learning": "bg-green-100 text-green-800",
      IoT: "bg-orange-100 text-orange-800",
      "Game Development": "bg-pink-100 text-pink-800",
      Blockchain: "bg-indigo-100 text-indigo-800",
      DevOps: "bg-red-100 text-red-800",
      "Data Science": "bg-teal-100 text-teal-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return colors[category as keyof typeof colors] || colors.Other;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
              project.category
            )}`}
          >
            {project.category}
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
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
          {(() => {
            try {
              const langs = JSON.parse(project.languages);
              return Array.isArray(langs) ? (
                langs.slice(0, 3).map((language: string, index: number) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {language}
                  </span>
                ))
              ) : (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {project.languages}
                </span>
              );
            } catch {
              return (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {project.languages}
                </span>
              );
            }
          })()}
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
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formatDate(project.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Links */}
      {(project.s3ObjectUrl ||
        project.links?.demo ||
        project.links?.documentation) && (
        <div className="px-6 pb-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            {project.s3ObjectUrl && (
              <a
                href={project.s3ObjectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <FileArchive size={16} />
                Download Project
              </a>
            )}

            <div className="flex items-center gap-2">
              {project.links?.demo && (
                <a
                  href={project.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-700 transition-colors"
                >
                  <ExternalLink size={14} />
                  Demo
                </a>
              )}
              {project.links?.documentation && (
                <a
                  href={project.links.documentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-700 transition-colors"
                >
                  <ExternalLink size={14} />
                  Docs
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Details Link */}
      <div className="px-6 pb-6">
        <Link
          to={`/project/${project.id}`}
          className="inline-block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ProjectCard;
