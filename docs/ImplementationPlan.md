# Implementation Plan: AI Interview Coach

This implementation plan details the task breakdown, estimated timeline, and specific deliverables required to build the AI Interview Coach MVP.

---

## Phase 1: Project Foundation
**Focus**: Establish project directories, configure core dependencies, design the SQLite database schema using SQLModel, set up the Gemini API client configuration, and implement basic endpoints. (ChromaDB and local embeddings setup are deferred to Phase 2).

### Tasks
1. **Repository & Directory Structure Initialization**:
   * Set up `/backend` and `/frontend` directories.
   * Initialize a Python virtual environment and set up `requirements.txt`.
2. **SQLite Database Configuration via SQLModel**:
   * Implement `app/database.py` with SQLite connection settings.
   * Write database models (`InterviewSession` and `InterviewQuestion` only) in `app/models.py`.
   * Create database tables on startup.
3. **Gemini Configuration**:
   * Configure `pydantic-settings` to load the Gemini API key from `.env` files.
   * Initialize the official `google-genai` SDK client wrapper in `app/services/gemini.py`.
4. **Basic API Construction**:
   * Setup FastAPI entry point (`app/main.py`) with CORS middleware.
   * Implement mock controllers for the base routing endpoints: `/sessions`, `/sessions/{id}/questions`, `/questions/{id}/answer`, `/sessions/{id}/complete`, `/sessions`, `/sessions/{id}`.

### Deliverables
* **Backend Setup**: FastAPI app skeleton running locally.
* **SQLite Setup & SQLModel Models**: Initialized SQLite database file containing only two tables (`InterviewSession` and `InterviewQuestion`).
* **Gemini Configuration**: Environment-based API key validation.
* **Basic APIs**: Exposed skeleton endpoints.
* **Project Structure**: Clean folder structure for backend and frontend.

### Estimated Timeline
* **Duration**: 1 Day.

---

## Phase 2: Interview Engine (Prompt-First Development)
**Focus**: Develop a fully functioning mock interview using Gemini prompt instructions first, and then integrate the local RAG engine using a single markdown file as a secondary integration step.

### Sub-Phase 2A: Plain Prompt-Only Engine
1. **Gemini Question Generation**:
   * Write custom system prompts for Python, DSA, and HR interview topics in `app/services/gemini.py`.
   * Implement generation route `/sessions/{session_id}/questions` to retrieve a single question using only the LLM prompt.
2. **Answer Evaluation & Score/Feedback Generation**:
   * Setup Gemini Structured Outputs to return a JSON containing score, feedback, and improvement suggestions.
   * Implement route `/questions/{question_id}/answer` to score the response and save it.
3. **Session Persistence & History**:
   * Implement `/sessions/{session_id}/complete` to calculate the final score and save the overall summary.
4. **Validation**:
   * Run and test the complete mock flow (Question -> Answer -> Grade -> Complete) using standard LLM prompting.

### Sub-Phase 2B: Simple RAG Integration
1. **Knowledge Resource Setup**:
   * Create a single local Markdown file `backend/data/knowledge.md` containing core interview concepts, sample questions, and evaluation rubrics.
2. **ChromaDB and Local Embeddings Setup**:
   * Configure persistent local directory storage for ChromaDB.
   * Configure the local `all-MiniLM-L6-v2` Sentence Transformers model.
   * Implement startup ingestion to read `backend/data/knowledge.md`, apply fixed chunking, generate embeddings, and load into topic collections.
3. **RAG Retrieval & Prompt Injection**:
   * Write `app/services/rag.py` to perform top-k lookup matching the selected topic.
   * Inject the retrieved context into the Gemini prompt template.
4. **Prompt Fallback Implementation**:
   * Implement exception handlers so that if ChromaDB or the retrieval module encounters an error, the system falls back to the prompt-only generation developed in Sub-Phase 2A.

### Deliverables
* **Topic Selection & Question Generation**: Prompt-only base workflow, followed by context-aware generation.
* **Answer Evaluation, Score, & Feedback Generation**: Reliable grading via Gemini Structured JSON output.
* **Save Interview History**: SQLite CRUD operations.
* **Final Interview Summary**: Complete endpoint calculating session results.
* **RAG Retrieval**: local document ingestion, embedding indexing, top-k retrieval, and fallback logic using standard LLM prompting.

### Estimated Timeline
* **Duration**: 1 Day (0.5 Day for Prompt-Only, 0.5 Day for RAG Integration).

---

## Phase 3: Frontend & Final Integration
**Focus**: Build the user interface using React, implement design styling via Tailwind CSS, connect to the backend APIs using Axios, and conduct integration testing.

### Tasks
1. **React Application Scaffolding**:
   * Bootstrap frontend using a Vite template.
   * Set up Tailwind utility styling.
2. **UI Page Layouts**:
   * Build **Home Page**: Welcome screen.
   * Build **Topic Selection Page**: Select Python, DSA, or HR.
   * Build **Interview Page**: UI containing the Current Question, a Multi-line Answer Textbox, a Submit Button, Score, Feedback, and a Complete Session Button.
   * Build **Dashboard Page**: Plain tabular overview displaying Previous Sessions, Topic, Date, Average Score, and Session Summary.
3. **API Integration via Axios**:
   * Build Axios client mapping the exact six backend endpoints.
4. **E2E Testing & Bug Fixes**:
   * Verify the 1-question workflow: Select topic -> Answer 1 question -> See feedback -> Complete session -> View dashboard.
   * Ensure that backend RAG retrieval failures are caught and handled gracefully by the UI.

### Deliverables
* **React Frontend**: Clean, responsive SPA.
* **Home Page, Topic Selection, Interview Page, & Dashboard**: Fully implemented views matching simplified UI specifications.
* **API Integration**: Axios clients successfully communicating with backend routes.
* **Testing & Bug Fixes**: Validated end-to-end user interview workflow.

### Estimated Timeline
* **Duration**: 1 Day.