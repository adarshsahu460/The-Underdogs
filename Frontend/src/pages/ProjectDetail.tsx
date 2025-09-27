import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Calendar,
  Users,
  ExternalLink,
  Code,
  Clock,
  MessageSquare,
  Plus,
  Send,
  TrendingUp,
  Target,
  FileText,
  CheckCircle,
  AlertCircle,
  Zap,
  FileArchive,
  Upload,
} from "lucide-react";

// Types for AI insights and health report data coming from backend
interface AIInsights {
  pitch?: string;
  problem_solved?: string;
  tech_stack?: string[];
  current_status?: string;
  contribution_friendliness?: number;
  suggested_roadmap?: string[];
}

interface HealthReport {
  readme_is_present?: boolean;
  build_successful?: boolean;
  tests_found_and_passed?: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  languages: string | string[];
  reasonHalted: string;
  originalRepoUrl?: string;
  s3ObjectUrl?: string;
  links?: {
    documentation?: string;
    demo?: string;
  };
  collaboratorEmails?: string[];
  contributors?: Array<{ name: string; role: string; joinedAt?: string }>;
  feedback?: Array<{ text: string; user: string; createdAt: string }>;
  timeline?: Array<{ milestone: string; date: string; contributor: string }>;
  createdAt: string;
  updatedAt?: string;
  status?: string;
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [feedbackText, setFeedbackText] = useState("");
  const [contributorName, setContributorName] = useState("");
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [analysedDiff, setAnalysedDiff] = useState<unknown>(null);
  const [analysedDiffLoading, setAnalysedDiffLoading] = useState(false);
  const [analysedDiffError, setAnalysedDiffError] = useState<string | null>(
    null
  );
  type FeedbackItem = { text: string; user: string; createdAt: string };
  const [localFeedback, setLocalFeedback] = useState<FeedbackItem[]>([]);
  // Streaming helpers state
  const [streamingSummary, setStreamingSummary] = useState('');
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  (window as any).startStreamingReanalysis = () => {
    if (!id || streaming) return;
    setStreaming(true);
    setStreamingSummary('');
    setStreamStatus('Starting');
    const es = new EventSource(`https://debrah-transpleural-bailey.ngrok-free.dev/api/projects/${id}/stream/reanalyze`);
    es.addEventListener('status', (e: MessageEvent) => { try { const d = JSON.parse(e.data); setStreamStatus(d.phase || 'Working'); } catch {} });
    es.addEventListener('summary-chunk', (e: MessageEvent) => { try { const d = JSON.parse(e.data); if (d.text) setStreamingSummary((prev:string) => prev + d.text); } catch {} });
    es.addEventListener('complete', () => { setStreamStatus('Complete'); setStreaming(false); es.close(); });
    es.addEventListener('error', () => { setStreamStatus('Error'); setStreaming(false); es.close(); });
  };

  // Helper: extract a YouTube embed URL from common YouTube link formats
  const getYouTubeEmbedUrl = (rawUrl?: string | null): string | null => {
    if (!rawUrl) return null;
    try {
      const url = new URL(rawUrl);
      let id: string | null = null;
      const host = url.hostname.toLowerCase();
      if (host.includes("youtu.be")) {
        // https://youtu.be/<id>
        id = url.pathname.replace("/", "").split("/")[0] || null;
      } else if (host.includes("youtube.com")) {
        // https://www.youtube.com/watch?v=<id>
        if (url.pathname === "/watch") {
          id = url.searchParams.get("v");
        }
        // https://www.youtube.com/embed/<id>
        if (!id && url.pathname.startsWith("/embed/")) {
          id = url.pathname.split("/embed/")[1]?.split("/")[0] || null;
        }
        // https://www.youtube.com/shorts/<id>
        if (!id && url.pathname.startsWith("/shorts/")) {
          id = url.pathname.split("/shorts/")[1]?.split("/")[0] || null;
        }
      }
      return id ? `https://www.youtube.com/embed/${id}` : null;
    } catch {
      return null;
    }
  };

  const parseAIInsights = (value: unknown): AIInsights | null => {
    if (!value) return null;
    if (typeof value === "object") return value as AIInsights;
    if (typeof value === "string") {
      const clean = value
        .replace(/^```(json)?/i, "")
        .replace(/```$/i, "")
        .trim();
      try {
        return JSON.parse(clean) as AIInsights;
      } catch {
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      try {
        const res = await fetch(
          `https://debrah-transpleural-bailey.ngrok-free.dev/api/projects/${id}`,
          {
            headers: {
              "ngrok-skip-browser-warning": "true",
              Accept: "application/json",
            },
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const normalized: Project = {
          id: data.id || data._id || id,
          title:
            data.title ||
            data.name ||
            data.metadata?.title ||
            "Untitled Project",
          description: data.description || data.metadata?.description || "",
          category: data.category || data.metadata?.category || "Other",
          languages:
            data.languages ?? data.language ?? data.metadata?.languages ?? "[]",
          reasonHalted:
            data.reasonHalted ||
            data.reason ||
            data.metadata?.reasonHalted ||
            "Other",
          originalRepoUrl: data.originalRepoUrl || data.repoUrl,
          s3ObjectUrl:
            data.s3ObjectUrl || data.s3Url || data.metadata?.projectFileUrl,
          links: data.links || {
            documentation:
              data.documentationUrl || data.metadata?.documentation,
            demo: data.demoUrl || data.metadata?.demo,
          },
          collaboratorEmails: data.collaboratorEmails,
          contributors: data.contributors,
          feedback: data.feedback,
          timeline: data.timeline,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt,
          status: data.status || "Active",
        };

        const health: HealthReport | null =
          data.report?.health_report ||
          data.health_report ||
          data.healthReport ||
          null;
        const aiCandidateList = [
          data.report?.summary,
          data.summary,
          data.ai_summary,
          data.aiSummary,
          data.ai_insights,
          data.aiInsights,
        ];
        const ai = aiCandidateList.map(parseAIInsights).find(Boolean) || null;
        if (health) setHealthReport(health);
        if (ai) setAiInsights(ai);
        setAiError(!ai ? "Failed to parse AI summary." : null);

        setProject(normalized);
      } catch (err) {
        console.error("Error fetching project:", err);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  // Fetch Analysed Diff when the tab is activated
  useEffect(() => {
    const fetchAnalysedDiff = async () => {
      if (!id) return;
      if (analysedDiff || analysedDiffLoading) return; // cache and prevent double fetch
      setAnalysedDiffLoading(true);
      setAnalysedDiffError(null);
      try {
        // Try several likely endpoints, use the first that succeeds
        // const candidates = [
        //   `/api/projects/${id}/analysed-diff`,
        //   `/api/projects/${id}/analysis/diff`,
        //   `/api/projects/${id}/contributions/diff`,
        // ];
        let success = false;
        // for (const url of candidates) {
        try {
          const res = await fetch(
            `https://debrah-transpleural-bailey.ngrok-free.dev/api/projects/${id}/contributions/analyze-diff`,
            {
              headers: {
                "ngrok-skip-browser-warning": "true",
                Accept: "application/json",
              },
            }
          );
          // if (!res.ok) continue;
          const ct = res.headers.get("content-type") || "";
          const data = ct.includes("application/json")
            ? await res.json()
            : await res.text();
          setAnalysedDiff(data);
          success = true;
          // break;
        } catch {
          // try next
        }
        // }
        if (!success) {
          throw new Error("No analysed diff endpoint responded successfully");
        }
      } catch (err: unknown) {
        console.error("Failed to fetch analysed diff:", err);
        const message =
          err instanceof Error ? err.message : "Failed to load analysed diff";
        setAnalysedDiffError(message);
      } finally {
        setAnalysedDiffLoading(false);
      }
    };

    if (activeTab === "analysed-diff") {
      fetchAnalysedDiff();
    }
  }, [activeTab, id, analysedDiff, analysedDiffLoading]);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    // Optimistically add to local feedback so it reflects immediately
    const item: FeedbackItem = {
      text: feedbackText.trim(),
      user: "You",
      createdAt: new Date().toISOString(),
    };
    setLocalFeedback((prev) => [item, ...prev]);
    setFeedbackText("");
    // Optionally, send to backend here if an endpoint exists
  };

  const handleAdoptProject = () => {
    if (!contributorName.trim()) return;
    console.log("Adopting project with contributor:", contributorName);
    setContributorName("");
    setShowAdoptModal(false);
  };

  const getLanguagesArray = (langs: string | string[] | undefined) => {
    if (!langs) return [] as string[];
    if (Array.isArray(langs)) return langs as string[];
    try {
      const parsed = JSON.parse(langs);
      return Array.isArray(parsed) ? parsed : [String(langs)];
    } catch {
      return [String(langs)];
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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
    } as const;
    return colors[category as keyof typeof colors] || colors.Other;
  };

  // Downloads via proxied endpoint to handle redirects/file response
  const handleSecureDownload = () => {
    if (!id) return;
    const endpoint = `https://debrah-transpleural-bailey.ngrok-free.dev/api/projects/${id}/contributions/download`;
    const a = document.createElement("a");
    a.href = endpoint;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Upload (ZIP) — Drag and Drop + Button
  const validateZip = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      alert("Please select a ZIP file");
      return false;
    }
    if (file.size > 100 * 1024 * 1024) {
      alert("File size must be less than 100MB");
      return false;
    }
    return true;
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateZip(file)) {
      setSelectedFile(file);
      setUploadMessage(null);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && validateZip(file)) {
      setSelectedFile(file);
      setUploadMessage(null);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const uploadZipToS3 = async (
    file: File
  ): Promise<{ url: string; key: string } | null> => {
    try {
      setIsUploading(true);
      setUploadMessage(null);
      const form = new FormData();
      form.append("projectFile", file);
      const res = await fetch(
        `https://debrah-transpleural-bailey.ngrok-free.dev/api/projects/${id}/contributions/upload`,
        {
          method: "POST",
          body: form,
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const url: string | undefined = data?.file?.preSignedUrl;
      const key: string | undefined = data?.file?.key;
      if (url && key) {
        setUploadMessage(
          "Upload successful. A secure download link was generated."
        );
        return { url, key };
      }
      setUploadMessage("Upload finished but no download URL returned.");
      return null;
    } catch (err) {
      console.error("Upload failed", err);
      setUploadMessage("Upload failed. Please try again.");
      return null;
    } finally {
      setIsUploading(false);
    }
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Project not found
          </h2>
          <p className="text-gray-600">
            The project you're looking for doesn't exist.
          </p>
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
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(
                    project.category
                  )}`}
                >
                  {project.category}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {project.status || "Active"}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {project.title}
              </h1>

              <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Created {formatDate(project.createdAt)}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {project.collaboratorEmails?.length ??
                    project.contributors?.length ??
                    0}{" "}
                  contributor
                  {(project.collaboratorEmails?.length ??
                    project.contributors?.length ??
                    0) !== 1
                    ? "s"
                    : ""}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Halted: {project.reasonHalted}
                </div>
              </div>

              {/* YouTube Demo Embed (if a YouTube link was provided as demo) */}
              {(() => {
                const demoUrl = project.links?.demo;
                const yt = getYouTubeEmbedUrl(demoUrl || null);
                // Optional: simple fallback for direct video links
                const isDirectVideo =
                  !!demoUrl && /\.(mp4|webm|ogg)(\?.*)?$/i.test(demoUrl);
                if (yt) {
                  return (
                    <div className="mb-6">
                      <div className="relative w-full max-w-3xl px-10 mx-auto pb-[56.25%] overflow-hidden border border-gray-300 shadow rounded-sm" >
                        <iframe
                          title="Project demo video"
                          src={yt}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  );
                }
                if (isDirectVideo) {
                  return (
                    <div className="mb-6">
                      <div className="w-full max-w-xl mx-auto border border-gray-200 shadow">
                        <video className="w-full" src={demoUrl!} controls />
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex flex-wrap gap-2 mb-6">
                {getLanguagesArray(project.languages).map((language, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Project Links (removed direct download as requested) */}
              <div className="flex gap-3">
                {project.links?.demo && (
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
                {project.links?.documentation && (
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
                { id: "overview", label: "Overview", icon: FileText },
                { id: "ai-insights", label: "AI Insights", icon: Zap },
                { id: "analysed-diff", label: "Analysed Diff", icon: Target },
                { id: "timeline", label: "Timeline", icon: TrendingUp },
                { id: "health-history", label: "Health History", icon: TrendingUp },
                { id: "feedback", label: "Feedback", icon: MessageSquare },
                { id: "contributors", label: "Contributors", icon: Users },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Project Description
                  </h3>
                  <div className="prose prose-gray max-w-none">
                    {project.description.split("\n").map((paragraph, index) => (
                      <p
                        key={index}
                        className="mb-4 text-gray-700 leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                {(project.contributors?.length ||
                  project.collaboratorEmails?.length) && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Contributors
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.contributors?.map((contributor, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {contributor.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {contributor.role}
                            </div>
                            {contributor.joinedAt && (
                              <div className="text-xs text-gray-500">
                                Joined {formatDate(contributor.joinedAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {!project.contributors?.length &&
                        project.collaboratorEmails?.map((email, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {email}
                              </div>
                              <div className="text-sm text-gray-600">
                                Collaborator
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Insights Tab */}
            {activeTab === "ai-insights" && (
              <div className="space-y-8">
                {/* AI Project Health Report */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      AI Project Health Report
                    </h3>
                  </div>
                  <div className="flex gap-4 mb-4 items-center">
                    <button
                      onClick={() => (window as any).startStreamingReanalysis?.()}
                      className="px-4 py-2 text-sm rounded bg-blue-600 text-white"
                    >Re-Analyze (Stream)</button>
                    {streamStatus && <span className="text-xs text-gray-600">{streamStatus}</span>}
                  </div>
                  {streamingSummary && (
                    <div className="mb-4 p-3 bg-white border rounded text-xs font-mono whitespace-pre-wrap max-h-48 overflow-auto">
                      {streamingSummary}
                    </div>
                  )}
                  {healthReport ? (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Repository Health
                      </h4>
                      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <li className="flex items-center gap-2 p-3 rounded-lg border border-gray-100">
                          {healthReport.readme_is_present ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm text-gray-700">
                            README present
                          </span>
                        </li>
                        <li className="flex items-center gap-2 p-3 rounded-lg border border-gray-100">
                          {healthReport.build_successful ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm text-gray-700">
                            Build successful
                          </span>
                        </li>
                        <li className="flex items-center gap-2 p-3 rounded-lg border border-gray-100">
                          {healthReport.tests_found_and_passed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm text-gray-700">
                            Tests passed
                          </span>
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 italic">
                      No health report data available.
                    </div>
                  )}

                  {aiError && (
                    <div className="mt-4 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3">
                      {aiError}
                    </div>
                  )}
                </div>

                {/* Next Steps Roadmap */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Next Steps Roadmap
                    </h3>
                  </div>

                  {aiInsights?.suggested_roadmap?.length ? (
                    <div className="space-y-4">
                      {aiInsights.suggested_roadmap.map((task, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-white rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Step {index + 1}
                            </span>
                            <span className="text-gray-900">{task}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 italic">
                      No AI roadmap suggestions available.
                    </div>
                  )}
                </div>

                {/* Pitch Deck Generator */}
                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      AI-Generated Pitch Deck
                    </h3>
                  </div>

                  <div className="bg-white rounded-lg p-4 space-y-4">
                    {aiInsights?.pitch && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Pitch
                        </h4>
                        <p className="text-gray-700">{aiInsights.pitch}</p>
                      </div>
                    )}
                    {aiInsights?.problem_solved && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Problem Solved
                        </h4>
                        <p className="text-gray-700">
                          {aiInsights.problem_solved}
                        </p>
                      </div>
                    )}
                    {(aiInsights?.tech_stack?.length ?? 0) > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Tech Stack
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {aiInsights!.tech_stack!.map((t, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiInsights?.current_status && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Current Status
                        </h4>
                        <p className="text-gray-700">
                          {aiInsights.current_status}
                        </p>
                      </div>
                    )}
                    {typeof aiInsights?.contribution_friendliness ===
                      "number" && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Contribution Friendliness
                        </h4>
                        <div className="text-sm text-gray-700">
                          Score: {aiInsights.contribution_friendliness}/10
                        </div>
                      </div>
                    )}
                    {!aiInsights && (
                      <div className="text-sm text-gray-600 italic">
                        No AI summary available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Analysed Diff Tab */}
            {activeTab === "analysed-diff" && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Analysed Diff
                </h3>
                {analysedDiffLoading && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                    Loading analysed diff...
                  </div>
                )}
                {analysedDiffError && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                    {analysedDiffError}
                  </div>
                )}
                {!analysedDiffLoading &&
                  !analysedDiffError &&
                  analysedDiff != null &&
                  (typeof analysedDiff === "string" ? (
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto whitespace-pre-wrap text-sm">
                      {analysedDiff}
                    </pre>
                  ) : (
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto text-sm">
                      {JSON.stringify(analysedDiff, null, 2)}
                    </pre>
                  ))}
                {!analysedDiffLoading &&
                  !analysedDiffError &&
                  analysedDiff == null && (
                    <div className="text-sm text-gray-600">
                      No analysed diff available.
                    </div>
                  )}
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === "timeline" && project.timeline?.length ? (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Project Timeline
                </h3>
                <div className="space-y-6">
                  {project.timeline.map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            {item.milestone}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {formatDate(item.date)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          by {item.contributor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === "timeline" ? (
              <div className="text-gray-600">No timeline available.</div>
            ) : null}

            {/* Contributors Tab */}
            {activeTab === "contributors" && (
              <div className="space-y-8">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleSecureDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
                  >
                    <FileArchive className="h-4 w-4" />
                    Download Code
                  </button>
                </div>

                {/* Drag & Drop ZIP Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Upload New File (ZIP)
                  </h3>
                  <div
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDragging
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="mb-4 flex flex-col items-center">
                      <Upload className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-gray-700 font-medium">
                        Drag and drop your ZIP here
                      </p>
                      <p className="text-sm text-gray-500">or</p>
                      <label className="mt-2 cursor-pointer bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors inline-block">
                        Choose ZIP File
                        <input
                          type="file"
                          accept=".zip"
                          onChange={onFileInputChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        Max size 100MB
                      </p>
                    </div>

                    {selectedFile && (
                      <div className="flex items-center justify-between bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileArchive className="h-6 w-6 text-purple-600" />
                          <div className="text-left">
                            <div className="font-medium text-gray-900">
                              {selectedFile.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)}{" "}
                              MB
                            </div>
                          </div>
                        </div>
                        <button
                          disabled={isUploading}
                          onClick={async () => {
                            if (selectedFile) {
                              await uploadZipToS3(selectedFile);
                            }
                          }}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                        >
                          {isUploading ? "Uploading..." : "Upload"}
                        </button>
                      </div>
                    )}

                    {uploadMessage && (
                      <div className="mt-3 text-sm text-gray-700">
                        {uploadMessage}
                      </div>
                    )}
                  </div>
                </div>

                {project.contributors?.length ||
                project.collaboratorEmails?.length ? (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Contributors
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.contributors?.map((contributor, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {contributor.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {contributor.role}
                            </div>
                            {contributor.joinedAt && (
                              <div className="text-xs text-gray-500">
                                Joined {formatDate(contributor.joinedAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {!project.contributors?.length &&
                        project.collaboratorEmails?.map((email, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {email}
                              </div>
                              <div className="text-sm text-gray-600">
                                Collaborator
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-600">No contributors yet.</div>
                )}
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === "feedback" && (
              <div className="space-y-8">
                {/* Feedback Form */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Leave Feedback
                  </h3>
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

                {/* Existing + Local Feedback (dynamic) */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Community Feedback
                  </h3>
                  <div className="space-y-6">
                    {(() => {
                      const combined = [
                        ...localFeedback,
                        ...(project.feedback ?? []),
                      ];
                      return combined.length ? (
                        combined.map((feedback, index) => (
                          <div
                            key={index}
                            className="bg-white border border-gray-200 rounded-lg p-6"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Users className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="font-medium text-gray-900">
                                  {feedback.user}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {formatDate(feedback.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-700">{feedback.text}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-600">No feedback yet.</div>
                      );
                    })()}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Adopt This Project
              </h2>
              <p className="text-gray-600 mb-6">
                By adopting this project, you're committing to contribute to its
                development. Your name will be added to the contributors list
                and timeline.
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
