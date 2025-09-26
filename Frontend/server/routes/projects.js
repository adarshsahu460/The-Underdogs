const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const upload = require("../middleware/upload");
const { s3 } = require("../config/aws");

// GET all projects
router.get("/", async (req, res) => {
  try {
    const { category, languages, reasonHalted } = req.query;
    let query = {};

    if (category) query.category = category;
    if (languages) query.languages = { $in: languages.split(",") };
    if (reasonHalted) query.reasonHalted = reasonHalted;

    const projects = await Project.find(query).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single project
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new project with file upload
router.post("/", async (req, res) => {
  console.log("=== Project Data Route Hit ===");
  console.log("Project data received:", {
    title: req.body.title,
    category: req.body.category,
    hasFileUrl: !!req.body.projectFileUrl,
    fileUrl: req.body.projectFileUrl,
  });

  try {
    // Here you would normally save to database
    // For now, we'll just return success with the data
    const projectData = {
      _id: Date.now().toString(), // Generate a simple ID
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      languages: req.body.languages,
      reasonHalted: req.body.reasonHalted,
      projectFile: req.body.projectFileUrl
        ? {
            filename: `project-${Date.now()}.zip`,
            originalName: "project.zip",
            s3Key:
              req.body.projectFileKey ||
              req.body.projectFileUrl.split("/").pop(),
            s3Url: req.body.projectFileUrl, // This is now a pre-signed URL
            uploadedAt: new Date().toISOString(),
          }
        : null,
      links: {
        documentation: req.body.documentation,
        demo: req.body.demo,
      },
      contributors: [],
      feedback: [],
      timeline: [
        {
          milestone: "Project created and uploaded to EngiVerse",
          date: req.body.createdAt || new Date().toISOString(),
          contributor: "Anonymous",
        },
      ],
      createdAt: req.body.createdAt || new Date().toISOString(),
      status: "Available",
    };

    console.log("✅ Project data processed successfully");
    res.status(201).json({
      success: true,
      message: "Project created successfully!",
      project: projectData,
    });
  } catch (error) {
    console.error("❌ Error processing project data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create project",
      error: error.message,
    });
  }
});

// GET download project file
router.get("/:id/download", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || !project.projectFile) {
      return res.status(404).json({ message: "Project file not found" });
    }

    // Generate a signed URL for secure download
    const signedUrl = s3.getSignedUrl("getObject", {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: project.projectFile.s3Key,
      Expires: 3600, // URL expires in 1 hour
      ResponseContentDisposition: `attachment; filename="${project.projectFile.originalName}"`,
    });

    res.json({ downloadUrl: signedUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST feedback to project
router.post("/:id/feedback", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.feedback.push(req.body);
    const savedProject = await project.save();
    res.json(savedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST timeline update
router.post("/:id/timeline", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.timeline.push(req.body);
    const savedProject = await project.save();
    res.json(savedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST adopt project
router.post("/:id/adopt", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { contributorName } = req.body;
    project.contributors.push({
      name: contributorName || "Anonymous",
      role: "Contributor",
    });

    project.timeline.push({
      milestone: `${contributorName || "Anonymous"} joined the project`,
      contributor: contributorName || "Anonymous",
    });

    const savedProject = await project.save();
    res.json(savedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
