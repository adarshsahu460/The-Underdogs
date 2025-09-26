import React, { useState } from "react";
import { Upload, Plus, X, FileArchive, AlertCircle } from "lucide-react";
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
      // Validate file type
      if (!file.name.toLowerCase().endsWith(".zip")) {
        alert("Please select a ZIP file");
        return;
      }

      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        alert("File size must be less than 100MB");
        return;
      }

      setProjectFile(file);
    }
  };

  const removeFile = () => {
    setProjectFile(null);
    // Reset file input
    const fileInput = document.getElementById(
      "projectFile"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  // Function to upload file to S3 first
  const uploadFileToS3 = async (
    file: File
  ): Promise<{ url: string; key: string }> => {
    const s3FormData = new FormData();
    s3FormData.append("projectFile", file);

    const s3Response = await fetch("http://localhost:5001/api/upload-file", {
      method: "POST",
      body: s3FormData,
    });

    if (!s3Response.ok) {
      throw new Error("Failed to upload file to S3");
    }

    const s3Result = await s3Response.json();
    return {
      url: s3Result.file.preSignedUrl, // Return pre-signed URL
      key: s3Result.file.key, // Also return the S3 key for reference
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let s3FileData = { url: "", key: "" };

      // Step 1: Upload file to S3 if present
      if (projectFile) {
        setUploadProgress(20);
        console.log("Uploading file to S3...");
        s3FileData = await uploadFileToS3(projectFile);
        console.log("File uploaded to S3:", s3FileData);
        setUploadProgress(60);
      }

      // Step 2: Send project data as JSON to backend
      const projectData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        languages: formData.languages,
        reasonHalted: formData.reasonHalted,
        documentation: formData.documentation,
        demo: formData.demo,
        projectFileUrl: s3FileData.url, // Include pre-signed URL
        projectFileKey: s3FileData.key, // Include S3 key for reference
        createdAt: new Date().toISOString(),
      };

      setUploadProgress(80);
      console.log("Sending project data to backend:", projectData);

      const response = await fetch("https://debrah-transpleural-bailey.ngrok-free.dev/api/projects/upload/s3", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error("Failed to save project data");
      }

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
    } catch (error) {
      console.error("Error uploading project:", error);
      alert("Failed to upload project. Please try again.");
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Project Uploaded Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Your project has been added to the EngiVerse marketplace. Other
              developers can now discover and collaborate on it.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload Another Project
            </button>
          </div>
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
              Share your unfinished project with the community and find
              collaborators to help bring it to life.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
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
                placeholder="Describe your project, its goals, current state, and what has been accomplished so far..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Category */}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technologies & Languages Used *
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={currentLanguage}
                  onChange={(e) => setCurrentLanguage(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addLanguage())
                  }
                  placeholder="e.g. React, Node.js, Python"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addLanguage}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.languages.map((language, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {language}
                    <button
                      type="button"
                      onClick={() => removeLanguage(language)}
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                {!projectFile ? (
                  <div>
                    <FileArchive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="mb-4">
                      <label
                        htmlFor="projectFile"
                        className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                      >
                        Choose ZIP File
                      </label>
                      <input
                        type="file"
                        id="projectFile"
                        accept=".zip"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Upload your project as a ZIP file (max 100MB)
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileArchive className="h-8 w-8 text-blue-600" />
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
              <div className="mt-2 flex items-start gap-2 text-sm text-gray-600">
                <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500" />
                <div>
                  <p>Please ensure your ZIP file contains:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Source code files</li>
                    <li>README.md with setup instructions</li>
                    <li>Any configuration files needed to run the project</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Reason Halted */}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a reason</option>
                {reasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Project Links
              </h3>

              <div>
                <label
                  htmlFor="documentation"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Documentation
                </label>
                <input
                  type="url"
                  id="documentation"
                  name="documentation"
                  value={formData.documentation}
                  onChange={handleInputChange}
                  placeholder="https://your-project-docs.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="demo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Live Demo / Video
                </label>
                <input
                  type="url"
                  id="demo"
                  name="demo"
                  value={formData.demo}
                  onChange={handleInputChange}
                  placeholder="https://your-demo.com or https://youtube.com/watch?v=..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              {/* Upload Progress */}
              {isSubmitting && uploadProgress > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Uploading project...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {uploadProgress < 100
                      ? `Uploading... ${uploadProgress}%`
                      : "Processing..."}
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Project
                  </>
                )}
              </button>

              {!isFormValid() && (
                <div className="mt-3 text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Please fill in all required fields and upload a ZIP file
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
