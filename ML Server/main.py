import os
import shutil
import tempfile
import json
import stat
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from runner import run_command, detect_project_type, check_for_test_files
# Updated import to fix the deprecation warning
from langchain_ollama import OllamaLLM as Ollama
from git import Repo, GitCommandError

app = FastAPI(title="EngiVerse AI Analyzer API")

# Initialize the LLM - CodeLlama 7B provides high-quality, detailed summaries
llm = Ollama(model="codellama:7b")

# --- Helper Functions ---
def remove_readonly(func, path, _):
    """Clear the readonly bit and reattempt the removal on Windows."""
    os.chmod(path, stat.S_IWRITE)
    func(path)

def read_project_files(path: str, max_chars: int = 15000) -> str:
    """
    Reads the content of all relevant source code files in a project directory
    and concatenates them into a single string.
    """
    all_code_content = ""
    file_extensions = ('.js', '.py', '.html', '.css', '.jsx', '.ts', '.tsx', '.java', '.go', '.rs')
    ignore_dirs = ('.git', 'node_modules', 'venv', '__pycache__')

    for root, dirs, files in os.walk(path):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for file in files:
            if file.endswith(file_extensions):
                try:
                    with open(os.path.join(root, file), "r", encoding="utf-8", errors="ignore") as f:
                        all_code_content += f"--- File: {file} ---\n{f.read()}\n\n"
                        if len(all_code_content) > max_chars:
                            return all_code_content[:max_chars]
                except Exception:
                    continue
    return all_code_content

# --- API Models and Endpoints ---
class AnalyzeRequest(BaseModel):
    repo_url: str

class AnalyzeDiffRequest(BaseModel):
    diff: str
    previous_summary: str = ""
    project_title: str = "Project"

@app.get("/")
def read_root():
    return {"message": "Welcome to the EngiVerse AI Analyzer API!"}

@app.post("/analyze-repository")
def analyze_repository(request: AnalyzeRequest):
    temp_dir = tempfile.mkdtemp()
    
    try:
        # 1. Clone Repo
        clean_url = request.repo_url.split('?')[0]
        Repo.clone_from(clean_url, temp_dir)
        
        # --- 2. Health Report Generation ---
        health_report = {}
        project_type = detect_project_type(temp_dir)
        
        readme_path = os.path.join(temp_dir, "README.md")
        readme_content = ""
        if os.path.exists(readme_path):
            health_report["readme_is_present"] = True
            with open(readme_path, "r", encoding="utf-8", errors='ignore') as f:
                readme_content = f.read()
        else:
            health_report["readme_is_present"] = False

        build_command = "npm install" if project_type == "nodejs" else "pip install -r requirements.txt"
        health_report["build_successful"] = run_command(build_command, temp_dir)["success"]
        
        test_command = "npm test" if project_type == "nodejs" else "pytest"
        health_report["tests_found_and_passed"] = check_for_test_files(temp_dir) and run_command(test_command, temp_dir)["success"]
        
        # --- 3. Summary Generation ---
        code_content = read_project_files(temp_dir)
        
        summary_prompt = f"""
        You are an expert developer and project manager, tasked with analyzing an unfinished project to attract new contributors on the 'EngiVerse' platform. 
        Your goal is to generate a structured JSON object that provides a comprehensive overview.

        <CONTEXT>
        <README>
        {readme_content if readme_content else "No README provided."}
        </README>
        <SOURCE_CODE>
        {code_content}
        </SOURCE_CODE>
        </CONTEXT>

        <INSTRUCTIONS>
        Based on the provided context, generate a JSON object with the following keys:
        - "pitch": A compelling one-sentence elevator pitch for the project.
        - "problem_solved": A brief paragraph explaining the problem this project aims to solve.
        - "tech_stack": An array of strings listing the key technologies, languages, and frameworks used.
        - "current_status": A short description of the project's current state (e.g., "Early prototype with basic UI", "Functional backend with API endpoints", etc.).
        - "contribution_friendliness": A score from 1 (very difficult) to 10 (very easy) indicating how easy it would be for a new developer to start contributing, along with a brief justification for the score.
        - "suggested_roadmap": An array of 3-5 strings, each being a specific, actionable next step or feature that a new contributor could build.

        Do not include any text, markdown formatting like ```json, or explanations outside of the main JSON object.
        </INSTRUCTIONS>
        """
        
        summary_text = llm.invoke(summary_prompt)

        try:
            # Find the start and end of the JSON object in the response
            start_index = summary_text.find('{')
            end_index = summary_text.rfind('}') + 1
            
            if start_index != -1 and end_index != 0:
                json_string = summary_text[start_index:end_index]
                summary_json = json.loads(json_string)
            else:
                # Raise an error if no JSON object is found
                raise json.JSONDecodeError("No JSON object found in the response.", summary_text, 0)

        except json.JSONDecodeError:
            summary_json = {"error": "Failed to parse AI summary.", "raw_response": summary_text}

        # 5. Combine and Return Results
        # Provide backward-compatible alias 'health'
        return {
            "health_report": health_report,
            "health": health_report,
            "summary": summary_json
        }

    except GitCommandError as e:
        raise HTTPException(status_code=400, detail=f"Failed to clone repository. Is the URL correct and public? Error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")
    finally:
        # 6. Cleanup
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, onerror=remove_readonly)

@app.post("/analyze-diff")
def analyze_diff(request: AnalyzeDiffRequest):
    """
    Analyzes a git diff and provides insights about the contribution.
    Expected to return JSON with contribution_summary, updated_project_summary, and next_steps.
    """
    try:
        # Prepare the prompt for analyzing the diff
        diff_prompt = f"""
        You are an expert developer analyzing a code contribution (git diff) for a project called "{request.project_title}".
        
        <CONTEXT>
        <PREVIOUS_PROJECT_SUMMARY>
        {request.previous_summary if request.previous_summary else "No previous project summary available."}
        </PREVIOUS_PROJECT_SUMMARY>
        
        <GIT_DIFF>
        {request.diff}
        </GIT_DIFF>
        </CONTEXT>
        
        <INSTRUCTIONS>
        Analyze this contribution and generate a JSON object with exactly these keys:
        - "contribution_summary": A concise 1-2 sentence summary of what this contribution does (e.g., "Added user authentication system with login/logout functionality").
        - "updated_project_summary": An updated version of the project summary that incorporates this contribution. If no previous summary exists, create a new one based on the diff.
        - "next_steps": An array of 2-3 specific, actionable next steps that would logically follow this contribution.
        
        Focus on:
        - What functionality was added/modified/removed
        - Technical significance of the changes
        - How this moves the project forward
        - Ignore trivial changes like formatting, comments, or config files unless they're substantial
        
        Return only the JSON object, no other text or markdown formatting.
        </INSTRUCTIONS>
        """
        
        # Get AI analysis
        ai_response = llm.invoke(diff_prompt)

        # Parse the AI's response as JSON
        try:
            # Find and extract JSON object from response
            start_index = ai_response.find('{')
            end_index = ai_response.rfind('}') + 1
            
            if start_index != -1 and end_index != 0:
                json_string = ai_response[start_index:end_index]
                result = json.loads(json_string)
            else:
                raise json.JSONDecodeError("No JSON object found", ai_response, 0)
            
            # Validate required fields exist
            if "contribution_summary" not in result:
                result["contribution_summary"] = "Code changes detected"
            if "updated_project_summary" not in result:
                result["updated_project_summary"] = request.previous_summary or "Project with recent contributions"
            if "next_steps" not in result:
                result["next_steps"] = ["Continue development", "Add tests", "Update documentation"]
                
            return result
            
        except json.JSONDecodeError:
            # Fallback response if JSON parsing fails
            return {
                "contribution_summary": "Unable to parse contribution details",
                "updated_project_summary": request.previous_summary or "Project with recent changes",
                "next_steps": ["Review code changes", "Add documentation", "Test functionality"],
                "raw_ai_response": ai_response
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing diff: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)