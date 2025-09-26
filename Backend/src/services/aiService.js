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

module.exports = { requestAnalysis };
