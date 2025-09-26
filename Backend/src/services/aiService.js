const config = require('../config');

async function requestAnalysis(repoFullName) {
  if (!config.ai.baseUrl) throw new Error('AI server base URL not configured');
  const url = `${config.ai.baseUrl.replace(/\/$/,'')}/analyze-repository`;
  // console.log("Sending request to AI server:", url, repoFullName);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.ai.apiKey || ''
    },
    body: JSON.stringify({ repo_url: `https://github.com/${repoFullName}.git` })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI server error ${res.status}: ${body}`);
  }
  return res.json();
}

// Analyze a contribution diff and produce structured output.
async function analyzeContributionDiff({ diff, previousSummary, projectTitle }) {
  if (!config.ai.baseUrl) throw new Error('AI server base URL not configured');
  const url = `${config.ai.baseUrl.replace(/\/$/,'')}/analyze-diff`;
  const payload = { diff, previous_summary: previousSummary, project_title: projectTitle };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.ai.apiKey || ''
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI diff server error ${res.status}: ${body}`);
  }
  const data = await res.json();
  return {
    contributionSummary: data.contribution_summary || data.contributionSummary || data.summary || '',
    updatedProjectSummary: data.updated_project_summary || data.updatedProjectSummary || previousSummary,
    nextSteps: data.next_steps || data.nextSteps || null,
    raw: data
  };
}

module.exports = { requestAnalysis, analyzeContributionDiff };
