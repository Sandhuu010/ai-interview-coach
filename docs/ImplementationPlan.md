# Implementation Plan: AI Interview Coach

This implementation plan details the task breakdown, estimated timeline, and specific deliverables required to build the AI Interview Coach MVP.

---

## Phase 1: Project Setup
**Focus**: Establish repository structures, bootstrap backend and frontend applications, connect to a local SQLite database, configure the Gemini API client, and deploy initial endpoints.

### Tasks
* **Repository**: Set up project folder structures and initialize Git.
* **Backend**: Configure a Python virtual environment and set up FastAPI package folders.
* **Frontend**: React application skeleton bootstrap.
* **SQLite**: Configure local SQLite database schemas using SQLModel.
* **Gemini Configuration**: Set up environment files and key validation variables.
* **Basic APIs**:Implement REST API endpoints for sessions and questions.

### Deliverable
* Working FastAPI backend connected to Gemini.

### Estimated Timeline
* **Effort**: 6–8 hours.

---

## Phase 2: Interview Engine
**Focus**: Implement the core interview workflow using Gemini for question generation and answer evaluation while storing interview history in SQLite.

### Tasks
* **Generate Question**: Implement endpoint to construct prompt guidelines for Python, DSA, and HR and retrieve exactly one question from Gemini.
* **Submit Answer**: Configure endpoint to receive user responses.
* **Evaluate Answer**: Pass the answer to the Gemini API and extract response metrics.
* **Return Evaluation Results**: score, feedback, and improvement suggestions.
* **Save Interview History**: Write the session results to the SQLite tables.
* **Complete Session**:Mark the interview session as completed, generate a short summary, and save the final results.

### Deliverable
* Working interview chatbot using Gemini.

### Estimated Timeline
* **Effort**: 8–10 hours.

---

## Phase 3: Frontend & Integration
**Focus**: Build the user interface using React and Tailwind CSS, integrate page elements to Axios client endpoints, perform system testing, and fix bugs.

### Tasks
* **Home Page**: Build initial greeting screen.
* **Topic Selection**: Build view to select Python, DSA, or HR.
* **Interview Page**: Build UI displaying the question, a textbox, a Submit button, score and feedback cards, and a Complete Session button.
* **Dashboard**: Build tabular view listing previous sessions.
* **Axios Integration**: Bind Axios client routes to the six backend endpoints.
* **Testing**: Conduct end-to-end integration tests of a complete candidate session.
* **Bug Fixes**: Troubleshoot state alignment, style problems, or endpoint communication bugs.

### Deliverable
* Complete working AI Interview Coach.

### Estimated Timeline
* **Effort**: 6–8 hours.