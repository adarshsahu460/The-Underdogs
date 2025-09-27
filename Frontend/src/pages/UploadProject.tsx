import React, { useState } from "react";
import {
  Upload,
  Plus,
  X,
  FileArchive,
  AlertCircle,
  Sparkles,
} from "lucide-react";

const UploadProject = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    languages: [] as string[],
    reasonHalted: "",
    documentation: "",
    demo: "",
  });

  const [projectFile, setProjectFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"s3" | "blockchain">("s3");
  const [currentLanguage, setCurrentLanguage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".zip")) {
        alert("Please select a ZIP file");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        // 100MB limit
        alert("File size must be less than 100MB");
        return;
      }
      setProjectFile(file);
    }
  };

  const removeFile = () => {
    setProjectFile(null);
    const fileInput = document.getElementById(
      "projectFile"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addLanguage = () => {
    if (
      currentLanguage.trim() &&
      !formData.languages.includes(currentLanguage.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        languages: [...prev.languages, currentLanguage.trim()],
      }));
      setCurrentLanguage("");
    }
  };

  const removeLanguage = (language: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((lang) => lang !== language),
    }));
  };

  const uploadFileToS3 = async (
    file: File
  ): Promise<{ url: string; key: string }> => {
    const s3FormData = new FormData();
    s3FormData.append("projectFile", file);
    const s3Response = await fetch("/api/upload-s3", {
      method: "POST",
      body: s3FormData,
    });
    if (!s3Response.ok) throw new Error("Failed to upload file to S3");
    const s3Result = await s3Response.json();
    return { url: s3Result.file.preSignedUrl, key: s3Result.file.key };
  };

  const uploadFileToIPFS = async (file: File): Promise<{ cid: string }> => {
    const ipfsFormData = new FormData();
    ipfsFormData.append("projectFile", file);
    const ipfsResponse = await fetch("/api/upload-ipfs", {
      method: "POST",
      body: ipfsFormData,
    });
    if (!ipfsResponse.ok) throw new Error("Failed to upload file to IPFS");
    const ipfsResult = await ipfsResponse.json();
    return { cid: ipfsResult.cid };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress(0);

    if (!projectFile) {
      alert("Please select a project file to upload.");
      setIsSubmitting(false);
      return;
    }

    try {
      let uploadedFileReference: {
        projectFileUrl?: string;
        projectFileKey?: string;
        projectFileCid?: string;
      } = {};

      setUploadProgress(20);
      if (uploadMode === "s3") {
        console.log("Uploading file to S3...");
        const s3Data = await uploadFileToS3(projectFile);
        uploadedFileReference = {
          projectFileUrl: s3Data.url,
          projectFileKey: s3Data.key,
        };
        console.log("File uploaded to S3:", s3Data);
      } else {
        // blockchain
        console.log("Uploading file to IPFS...");
        const ipfsData = await uploadFileToIPFS(projectFile);
        uploadedFileReference = {
          projectFileUrl: `https://ipfs.io/ipfs/${ipfsData.cid}`,
          projectFileCid: ipfsData.cid,
        };
        console.log("File uploaded to IPFS:", ipfsData);
      }
      setUploadProgress(60);

      const projectData = {
        ...formData,
        ...uploadedFileReference,
        storagePreference: uploadMode,
        createdAt: new Date().toISOString(),
      };

      setUploadProgress(80);
      console.log("Sending project data to backend:", projectData);

      // Use the existing project creation endpoint
      const response = await fetch("https://debrah-transpleural-bailey.ngrok-free.dev/api/projects/upload/s3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) throw new Error("Failed to save project data");

      const result = await response.json();
      console.log("Project saved successfully:", result);

      setUploadProgress(100);
      setShowSuccess(true);

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        languages: [],
        reasonHalted: "",
        documentation: "",
        demo: "",
      });
      setProjectFile(null);
    } catch (error: unknown) {
      console.error("Error uploading project:", error);
      let message = "Failed to upload project. Please try again.";
      if (error && typeof error === "object" && "message" in error) {
        const msg = (error as { message?: string }).message;
        if (msg) message = `${message} Error: ${msg}`;
      }
      alert(message);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const isFormValid = () => {
    return (
      formData.title.trim() &&
      formData.description.trim() &&
      formData.category &&
      formData.reasonHalted &&
      formData.languages.length > 0 &&
      projectFile !== null
    );
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Project Uploaded!
          </h2>
          <p className="text-gray-600 mb-6">
            Your project is now live for the community to discover.
          </p>
          <button
            onClick={() => setShowSuccess(false)}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Another Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Upload Your Project
            </h1>
            <p className="text-gray-600">
              Share your unfinished project and find collaborators to bring it
              to life.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Details */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Project Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter your project title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                placeholder="Describe your project, its goals, current state..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Languages & Technologies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technologies & Languages *
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={currentLanguage}
                  onChange={(e) => setCurrentLanguage(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addLanguage())
                  }
                  placeholder="e.g. React, Node.js"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addLanguage}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.languages.map((lang) => (
                  <span
                    key={lang}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeLanguage(lang)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Project File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Files (ZIP) *
              </label>
              <div className="mb-3">
                <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setUploadMode("s3")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      uploadMode === "s3"
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="mr-2">☁️</span>Normal Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode("blockchain")}
                    className={`px-4 py-2 text-sm font-medium transition-colors flex items-center ${
                      uploadMode === "blockchain"
                        ? "bg-gradient-to-r from-purple-600 to-amber-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    On-Chain (IPFS)
                  </button>
                </div>
              </div>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  uploadMode === "blockchain"
                    ? "border-amber-400"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                {!projectFile ? (
                  <div>
                    <label
                      htmlFor="projectFile"
                      className={`cursor-pointer font-semibold ${
                        uploadMode === "blockchain"
                          ? "text-purple-600"
                          : "text-blue-600"
                      }`}
                    >
                      Choose a ZIP file
                    </label>
                    <input
                      type="file"
                      id="projectFile"
                      accept=".zip"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-600 mt-2">Max 100MB</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileArchive className="h-8 w-8 text-gray-600" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">
                          {projectFile.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(projectFile.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Halted Reason & Links */}
            <div>
              <label
                htmlFor="reasonHalted"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Why was the project halted? *
              </label>
              <select
                id="reasonHalted"
                name="reasonHalted"
                value={formData.reasonHalted}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a reason</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="documentation"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Documentation URL
                </label>
                <input
                  type="url"
                  id="documentation"
                  name="documentation"
                  value={formData.documentation}
                  onChange={handleInputChange}
                  placeholder="https://your-docs.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="demo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Live Demo / Video URL
                </label>
                <input
                  type="url"
                  id="demo"
                  name="demo"
                  value={formData.demo}
                  onChange={handleInputChange}
                  placeholder="https://your-demo.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6">
              {isSubmitting && uploadProgress > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-medium"
              >
                {isSubmitting ? "Uploading..." : "Upload Project"}
              </button>
              {!isFormValid() && (
                <div className="mt-3 text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Please fill all required fields (*)
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadProject;
