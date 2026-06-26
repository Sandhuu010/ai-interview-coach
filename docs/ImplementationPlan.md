# Implementation Plan: AI Interview Coach

This implementation plan details the task breakdown, estimated timeline, and specific deliverables required to build the AI Interview Coach MVP within a **2 to 3-day development window**.

---

## Phase 1: Project Foundation
**Focus**: Establish project directories, configure core dependencies, design and provision the database schema, and implement basic endpoints.

### Tasks
1. **Repository & Directory Structure Initialization**:
   * Set up `/backend` and `/frontend` directories.
   * Initialize a Python virtual environment and clean up `requirements.txt`.
2. **SQLite Database Configuration via SQLModel**:
   * Implement `app/database.py` with SQLAlchemy connection pools.
   * Write database models (`InterviewSession` and `InterviewQuestion`) in `app/models.py`.
   * Create script commands to automatically create tables.
3. **ChromaDB and Local Embeddings Setup**:
   * Configure persistent local directory storage for ChromaDB.
   * Download and cache the `all-MiniLM-L6-v2` Sentence Transformers model.
   * Set up collection ingestion scripts for loading markdown files from `/data/knowledge/` on server startup.
4. **Basic API Construction**:
   * Implement main FastAPI entry point (`app/main.py`) with CORS middleware configured for frontend communication.
   * Write health-check and basic routing templates (`/api/sessions`, `/api/sessions/{session_id}`).
5. **Configuration Management**:
   * Configure `pydantic-settings` to load the Gemini API key from `.env` files.

### Deliverables
* Fully functional SQLite database file with initialized schemas.
* Working vector store containing ingested topic collection folders.
* Functional health-check endpoint and FastAPI documentation page accessible at `http://127.0.0.1:8000/docs`.

### Estimated Timeline
* **Duration**: 0.5 to 1 Day.
* **Timeline Breakout**:
  * Environment & Database setup: 3 hours.
  * ChromaDB ingestion logic: 3 hours.
  * Basic APIs and Config: 2 hours.

---

## Phase 2: Interview Engine
**Focus**: Construct the RAG retrieval pipeline, implement the Gemini API client wrapper with structured JSON outputs, and engineer the interview orchestration loop.

### Tasks
1. **RAG Retrieval Engine**:
   * Write `app/services/rag.py` to embed incoming queries and query relevant collections.
   * Refine similarity threshold parameters to filter out irrelevant database matches.
2. **Gemini Client Service Integration**:
   * Implement `app/services/gemini.py` using the official `google-genai` SDK.
   * Write robust, custom system prompts for Python, DSA, and HR interview contexts.
   * Implement Gemini Structured Outputs by passing a Pydantic schema for evaluation responses to guarantee JSON validity.
3. **API Logic Orchestration**:
   * Define `/api/sessions/{session_id}/questions` endpoint logic: RAG query -> Gemini prompt -> SQL save -> response.
   * Define `/api/questions/{question_id}/answer` evaluation endpoint logic: Receive answer -> fetch context -> run Gemini evaluation -> save results -> return response.
   * Define `/api/sessions/{session_id}/complete` endpoint to average scores, summarize overall candidate performance, and close the session.
4. **Error Handling & Fallbacks**:
   * Add middleware exceptions to catch Gemini API rate-limiting or service-unavailable errors, falling back to cached default questions.

### Deliverables
* Robust vector-retrieval module.
* Clean Gemini API client utility with structured Pydantic return values.
* Orchestrated API routes capable of generating questions and scoring submissions.

### Estimated Timeline
* **Duration**: 1 Day.
* **Timeline Breakout**:
  * Vector store querying and embedding hooks: 2 hours.
  * Prompt engineering & structured Gemini integration: 4 hours.
  * API route business logic & relational database transactions: 3 hours.
  * Graceful fallback & error validation: 1 hour.

---

## Phase 3: Frontend & Final Integration
**Focus**: Build the user interface using React, implement design styling via Tailwind CSS, connect to the backend APIs using Axios, and conduct integration testing.

### Tasks
1. **React Application Scaffolding**:
   * Bootstrapping the frontend workspace (`npx -y create-vite-app`).
   * Design CSS foundation system in `src/index.css` defining color themes and standard typography.
2. **Dashboard UI Development**:
   * Build the Home page allowing topic selection (Python, DSA, HR).
   * Create the metrics grid (sessions completed, average scores).
   * Build the historic sessions list table with toggleable detail drawers.
3. **Interview Chat UI Componentry**:
   * Implement : Interview Page
      • Current Question
      • Multi-line Answer Box
      • Submit Button
      • Score
      • Feedback
      • Next Question Button
   * Create interactive message bubbles with markdown renderings for code snippet outputs.
   * Add typing-indicator skeletons and disabled states during API payload transitions.
4. **Axios Client Mapping**:
   * Define Axios configuration and create services mapping backend paths.
5. **E2E Testing & Bug Fixes**:
   * Test full candidate user flow: Select topic -> Answer 3 questions -> Complete session -> View on dashboard.
   * Resolve state bugs, connection issues, or CORS errors.

### Deliverables
* Fully integrated, responsive React single-page application.
* Fully styled chat interface, dashboard layout, and detailed history explorer.
* Validated E2E mock session execution.

### Estimated Timeline
* **Duration**: 1 Day.
* **Timeline Breakout**:
  * React app bootstrap, styling config, and UI layout: 3 hours.
  * Chat componentry and history logs: 3 hours.
  * API integration and Axios hooks: 2 hours.
  * Testing, styling adjustments, and bug fixes: 2 hours.

## Project Success Criteria

The project will be considered complete if:

- Backend APIs are functional.
- Gemini successfully generates interview questions.
- RAG retrieves topic-specific context.
- AI evaluates answers and returns score, feedback, and suggestions.
- Interview history is stored in SQLite.
- Dashboard displays previous interview sessions.
- Frontend and backend integrate successfully.
- The complete interview flow (3 questions) executes without errors.