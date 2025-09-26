const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  user: {
    type: String,
    default: 'Anonymous'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const timelineSchema = new mongoose.Schema({
  milestone: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  contributor: {
    type: String,
    default: 'Anonymous'
  }
});

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Web Development', 'Mobile App', 'Machine Learning', 'IoT', 'Game Development', 'Blockchain', 'DevOps', 'Data Science', 'Other']
  },
  languages: [{
    type: String
  }],
  reasonHalted: {
    type: String,
    required: true,
    enum: ['Time Constraints', 'Lack of Skills', 'Lost Interest', 'Technical Challenges', 'Funding Issues', 'Market Changes', 'Other']
  },
  projectFile: {
    filename: String,
    originalName: String,
    s3Key: String,
    s3Url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  links: {
    documentation: String,
    demo: String
  },
  feedback: [feedbackSchema],
  timeline: [timelineSchema],
  contributors: [{
    name: String,
    role: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['Available', 'In Progress', 'Completed'],
    default: 'Available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', projectSchema);