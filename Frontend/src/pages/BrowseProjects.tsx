import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Code } from "lucide-react";
import ProjectCard from "../components/ProjectCard";

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
  links: {
    documentation?: string;
    demo?: string;
  };
  collaboratorEmails: string[];
  createdAt: string;
  updatedAt: string;
}

// Backend response item (loose but typed to avoid 'any')
type BackendProject = {
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
  metadata?: {
    title?: string;
    description?: string;
    category?: string;
    reasonHalted?: string;
  };
  description?: string;
  category?: string;
  languages?: string | string[];
  originalRepoUrl?: string;
  repoUrl?: string;
  s3ObjectUrl?: string;
  s3Url?: string;
  projectFile?: { s3Url?: string };
  reasonHalted?: string;
  reason?: string;
  aiSummary?: string;
  summary?: string;
  report?: { summary?: string };
  links?: { documentation?: string; demo?: string };
  documentation?: string;
  demo?: string;
  collaboratorEmails?: string[];
  createdAt?: string;
  updatedAt?: string;
  modifiedAt?: string;
};

const BrowseProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [serverSearching, setServerSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const categories = [
    "Web Development",
    "Mobile App",
    "Machine Learning",
    "IoT",
    "Game Development",
    "Blockchain",
    "DevOps",
    "Data Science",
    "Other",
  ];

  const reasons = [
    "Time Constraints",
    "Lack of Skills",
    "Lost Interest",
    "Technical Challenges",
    "Funding Issues",
    "Market Changes",
    "Other",
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("https://debrah-transpleural-bailey.ngrok-free.dev/api/projects", {
          method: "GET",
          headers: {
                "ngrok-skip-browser-warning": "true",
                Accept: "application/json",
          }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: unknown = await response.json();

        // Accept either an array or an object with a 'projects' array
        const rawList: BackendProject[] = Array.isArray(data)
          ? (data as BackendProject[])
          : Array.isArray((data as { projects?: unknown })?.projects)
          ? (data as { projects?: BackendProject[] }).projects ?? []
          : [];

        // Normalize to the UI's Project shape
        const normalized: Project[] = rawList.map((p: BackendProject) => {
          const id = p.id || p._id || "";
          const languagesStr = Array.isArray(p.languages)
            ? JSON.stringify(p.languages)
            : typeof p.languages === "string"
            ? p.languages
            : JSON.stringify([]);
          return {
            id,
            title: p.title || p.name || p.metadata?.title || "Untitled Project",
            description: p.description || p.metadata?.description || "",
            category: p.category || p.metadata?.category || "Other",
            languages: languagesStr,
            originalRepoUrl: p.originalRepoUrl || p.repoUrl || "",
            s3ObjectUrl: p.s3ObjectUrl || p.s3Url || p.projectFile?.s3Url || "",
            reasonHalted:
              p.reasonHalted || p.reason || p.metadata?.reasonHalted || "Other",
            aiSummary: p.aiSummary || p.summary || p.report?.summary,
            links:
              p.links ||
              ({
                documentation: p.documentation,
                demo: p.demo,
              } as Project["links"]),
            collaboratorEmails: Array.isArray(p.collaboratorEmails)
              ? p.collaboratorEmails
              : [],
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: p.updatedAt || p.modifiedAt || "",
          };
        });
        setProjects(normalized);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filterProjects = useCallback(() => {
    let filtered = Array.isArray(projects) ? [...projects] : [];

    // Client filtering only applies when server search empty
    if (searchTerm && !serverSearching) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((project) => {
        const inTitle = project.title.toLowerCase().includes(term);
        const inDesc = project.description.toLowerCase().includes(term);
        let inLang = false;
        try {
          const langs = JSON.parse(project.languages);
          if (Array.isArray(langs)) {
            inLang = langs.some((l) => String(l).toLowerCase().includes(term));
          }
        } catch {
          inLang = String(project.languages || '').toLowerCase().includes(term);
        }
        return inTitle || inDesc || inLang;
      });
    }

    if (categoryFilter) {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }
    if (reasonFilter) {
      filtered = filtered.filter((p) => p.reasonHalted === reasonFilter);
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, categoryFilter, reasonFilter]);

  useEffect(() => {
    filterProjects();
  }, [filterProjects]);

  // Debounced server-side search
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setServerSearching(false);
      return;
    }
    setServerSearching(true);
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://debrah-transpleural-bailey.ngrok-free.dev/api/projects/search?q=${encodeURIComponent(term)}`, {
          headers: { 'ngrok-skip-browser-warning': 'true', Accept: 'application/json' },
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.projects)) {
            // Map server search result shape to Project shape best-effort
            const mapped: Project[] = data.projects.map((p: any) => ({
              id: p.id,
              title: p.title || 'Untitled Project',
              description: p.description || '',
              category: 'Other',
              languages: JSON.stringify([]),
              originalRepoUrl: '',
              s3ObjectUrl: '',
              reasonHalted: 'Other',
              aiSummary: p.aiSummary,
              links: { },
              collaboratorEmails: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }));
            setFilteredProjects(mapped);
          }
        }
      } catch (e) {
        // ignore (user typing quickly / aborted)
      } finally {
        setServerSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setReasonFilter("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const list = Array.isArray(filteredProjects) ? filteredProjects : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Projects</h1>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by title, description, language"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-56 border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason Halted
              </label>
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="w-56 border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4 text-gray-600 flex items-center gap-3">
          <span>Found {list.length} project{list.length !== 1 ? 's' : ''}</span>
          {serverSearching && <span className="text-xs text-blue-600 animate-pulse">Searching...</span>}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {list.length === 0 && (
          <div className="text-center py-12">
            <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or browse all projects.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
