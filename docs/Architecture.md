# System Architecture: AI Interview Coach

This document details the system architecture, component design, data flow, API specifications, and database schema for the AI Interview Coach.

---

## 1. System Overview
The AI Interview Coach is a lightweight client-server web application consisting of a React frontend, a FastAPI backend, a local SQLite database, and the Gemini API. The frontend manages the user interface, the backend handles application logic, Gemini generates and evaluates interview content, and SQLite stores interview history.

### High-Level Architecture

```text
                +----------------+
                |      User      |
                +----------------+
                         |
                         v
                +----------------+
                | React Frontend |
                +----------------+
                         |
                    REST API
                         |
                         v
                +----------------+
                | FastAPI Backend|
                +----------------+
                  |            |
                  |            |
                  v            v
          +-------------+  +-----------+
          | Gemini API  |  |  SQLite   |
          +-------------+  +-----------+
```

### Interview Workflow

```text
Start
  |
  v
Select Topic
  |
  v
Create Interview Session
  |
  v
Generate Question
  |
  v
Display Question
  |
  v
Submit Answer
  |
  v
Evaluate Answer (Gemini)
  |
  v
Return Score & Feedback
  |
  v
Save Session
  |
  v
Complete Session
  |
  v
Dashboard
```

### Simple Workflow Text Explanation
This step-by-step description explains the actual flow of a candidate's session:
1. **Topic Selection**: The candidate visits the application, opens the Topic Selection screen, and selects a topic (Python, DSA, or HR). This calls `POST /sessions` to create a session record in SQLite.
2. **Question Generation**: The UI transitions to the Interview screen and calls `POST /sessions/{session_id}/questions`. The backend formats a system prompt for the selected topic (using hardcoded constant strings defined in the backend code) and requests a single question from the Gemini API. The question is saved in SQLite and returned to the UI.
3. **Answer Submission**: The candidate types their answer in a multi-line textbox and clicks "Submit". This triggers `POST /questions/{question_id}/answer`.
4. **Answer Evaluation**: The backend sends the question and the user's answer to the Gemini API. Gemini evaluates the response and returns a structured output containing a score (0-100), feedback, and improvement suggestions. This evaluation data is saved to SQLite and displayed to the user.
5. **Session Completion**: The candidate clicks "Complete Session", which calls `POST /sessions/{session_id}/complete`. The backend sets the question score as the overall score, requests a brief session summary from the Gemini API, marks the session as complete in the database, and returns the summary.
6. **Dashboard Log**: The candidate is returned to the Dashboard page, which queries `GET /sessions` to list the completed interview session showing the topic, date, score, and summary.

---

## 3. Component Responsibilities

### Frontend Responsibilities
* **Routing & Navigation**: Render exactly four pages:
  * **Home Page**: Welcome screen.
  * **Topic Selection**: Choose Python, DSA, or HR.
  * **Interview Page**: View containing the Current Question, a Multi-line Answer Textbox, a Submit Button, Score, Feedback, and a Complete Session Button.
  * **Dashboard**: List of previous sessions showing Topic, Date, Average Score, and Session Summary.
* **State Management & Session Handling**: Track parent page states. The active `session_id` is managed directly in the React `App` parent component state to map the selected topic view directly to the active Interview question.
* **UI Polish**: Standard clean layout using Tailwind CSS. Displays a simple `"Processing..."` text message while API calls are executing.
* **Out-of-Scope (Excluded)**: No split panes, code syntax highlighting, markdown parsing, typing animations, complex chat structures, or advanced UI effects.

### Backend Responsibilities

• Generate interview questions using Gemini.

• Evaluate user answers.

• Store interview sessions and interview history in SQLite.

• Return evaluation results to the frontend.

---

## 4. Technology Selection Rationale

* **FastAPI**: High-performance, async-first Python web framework with auto-generated OpenAPI docs. Incorporates `CORSMiddleware` configured to safely accept requests originating from the local React development server (`http://localhost:5173`).
* **SQLModel**: Provides type-safe ORM models built on SQLAlchemy and Pydantic.
* **SQLite**: Lightweight, file-based relational database; requires zero configuration.
* **Gemini API (`gemini-2.5-flash`)**: High-performance, cost-effective multimodal LLM with extremely low latency.
* **React**: Component-driven model allows for the creation of an interactive, real-time chat interface that updates fluidly.

---

## 5. Database Design (SQLite)
The application utilizes SQLModel to construct **exactly** two relational tables in SQLite. No other tables may be added.

### Database Schema

```text
InterviewSession
----------------------------
id (PK)
topic
created_at
overall_score
summary
is_completed
        |
        | 1
        |
        | *
InterviewQuestion
----------------------------
id (PK)
session_id (FK)
question_text
user_answer
score
feedback
improvement_suggestions
timestamp
```

### Table Schema Definitions

#### `InterviewSession`
* `id` (`int`, Primary Key): Unique identifier of the session.
* `topic` (`str`): The category selected (`python`, `dsa`, or `hr`).
* `created_at` (`datetime`): Timestamp of initialization.
* `overall_score` (`float`, Nullable): Calculated score based on the single question score.
* `summary` (`str`, Nullable): Brief summary of performance.
* `is_completed` (`bool`): Flag to mark the session as concluded.

#### `InterviewQuestion`
* `id` (`int`, Primary Key): Unique identifier of the question.
* `session_id` (`int`, Foreign Key): Relates to `InterviewSession.id`.
* `question_text` (`str`): The question generated by Gemini.
* `user_answer` (`str`, Nullable): The response typed by the user.
* `score` (`int`, Nullable): Score given (0-100).
* `feedback` (`str`, Nullable): Qualitative critique.
* `improvement_suggestions` (`str`, Nullable): Corrective suggestions.
* `timestamp` (`datetime`): Time of creation.

---

## 6. API Design

### Endpoints (Strictly Exposes Only 6 Endpoints)

#### 1. Create Session
* **HTTP Method**: `POST`
* **Path**: `/sessions`
* **Request Payload**:
  ```json
  {
    "topic": "Python"
  }
  ```
* **Response Payload (201 Created)**:
  ```json
  {
    "id": 1,
    "topic": "Python",
    "created_at": "2026-06-26T20:50:00Z",
    "is_completed": false
  }
  ```

#### 2. Generate Question
* **HTTP Method**: `POST`
* **Path**: `/sessions/{session_id}/questions`
* **Response Payload (200 OK)**:
  ```json
  {
    "id": 12,
    "session_id": 1,
    "question_text": "Explain the difference between a list and a tuple in Python, and when you would use each."
  }
  ```

#### 3. Submit Answer & Evaluate
* **HTTP Method**: `POST`
* **Path**: `/questions/{question_id}/answer`
* **Request Payload**:
  ```json
  {
    "user_answer": "Lists are mutable. Tuples are immutable."
  }
  ```
* **Response Payload (200 OK)**:
  ```json
  {
    "id": 12,
    "session_id": 1,
    "question_text": "Explain the difference between a list and a tuple...",
    "user_answer": "Lists are mutable...",
    "score": 90,
    "feedback": "The explanation is correct. The mutable vs. immutable distinction is clearly defined.",
    "improvement_suggestions": "Mention memory utilization. Tuples have smaller memory footprints."
  }
  ```

#### 4. Complete Session
* **HTTP Method**: `POST`
* **Path**: `/sessions/{session_id}/complete`
* **Response Payload (200 OK)**:
  ```json
  {
    "id": 1,
    "overall_score": 90.0,
    "summary": "Completed successfully. Solid understanding of Python structures.",
    "is_completed": true
  }
  ```

#### 5. List Previous Sessions
* **HTTP Method**: `GET`
* **Path**: `/sessions`
* **Response Payload (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "topic": "Python",
      "created_at": "2026-06-26T20:50:00Z",
      "overall_score": 90.0,
      "summary": "Completed successfully...",
      "is_completed": true
    }
  ]
  ```

#### 6. Get Session Details (History)
* **HTTP Method**: `GET`
* **Path**: `/sessions/{session_id}`
* **Response Payload (200 OK)**:
  ```json
  {
    "id": 1,
    "topic": "Python",
    "created_at": "2026-06-26T20:50:00Z",
    "overall_score": 90.0,
    "summary": "Completed successfully...",
    "is_completed": true,
    "questions": [
      {
        "id": 12,
        "question_text": "Explain the difference between a list and a tuple...",
        "user_answer": "Lists are mutable...",
        "score": 90,
        "feedback": "Correct explanation...",
        "improvement_suggestions": "Mention memory footprint..."
      }
    ]
  }
  ```

---

## 7. Project Directory Structure
The workspace will organize code into clear directories:

```text
ai-interview-coach/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── sessions.py
│   │   │   └── questions.py
│   │   └── services/
│   │       ├── __init__.py
│   │       └── gemini.py
│   │
│   └── tests/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── TopicSelection.jsx
│       │   ├── Interview.jsx
│       │   └── Dashboard.jsx
│       ├── services/
│       │   └── api.js
│       ├── App.jsx
│       ├── index.css
│       └── index.jsx
│
├── docs/
│   ├── images/
│   │   ├── high-level-architecture.png
│   │   ├── interview-workflow.png
│   │   └── database-schema.png
│   ├── Problem.md
│   ├── Requirements.md
│   ├── Architecture.md
│   └── ImplementationPlan.md
│
├── .env.example
├── README.md
└── requirements.txt
```

---

## 8. Folder Structure Explanation
For every major folder and important file (including subfiles), its responsibility is described below:

### Root Project Directory
* `ai-interview-coach/`: Root folder of the project containing backend, frontend, documentation, and configuration files.
* `.env.example`: Template configuration file listing required environment variables (e.g., `GEMINI_API_KEY`) to be set locally.
* `README.md`: Entry-level guide detailing steps to build, configure, and launch the application.
* `requirements.txt`: Python package manifest containing the locked dependencies for the backend.

### Backend Application Code (`backend/`)
* `backend/`: Directory containing all Python backend source code, settings, databases, and tests.
* `backend/app/`: The FastAPI core package housing routing controllers, services, database engines, and model definitions.
* `backend/app/__init__.py`: Python package marker file initialization.
* `backend/app/main.py`: Main backend entry point initializing FastAPI, configuring CORS middlewares, and mounting routers.
* `backend/app/database.py`: Establishes the SQLite connection pool engine and database utility operations.
* `backend/app/models.py`: Defines SQLModel tables mapping to SQLite relational database schemas.
* `backend/app/schemas.py`: Contains auxiliary Pydantic schemas validating API request bodies and JSON responses.
* `backend/app/routes/`: Router controllers folder handling specific endpoint path groupings.
* `backend/app/routes/__init__.py`: Package initialization marker for routers.
* `backend/app/routes/sessions.py`: Endpoint paths handling session creation, completion, listing, and historic lookups.
* `backend/app/routes/questions.py`: Endpoint paths handling question generation prompts and answer submissions.
* `backend/app/services/`: Service logic directory handling third-party integrations and helper routines.
* `backend/app/services/__init__.py`: Package initialization marker for services.
* `backend/app/services/gemini.py`: Service class wrapping the official Google Gen AI SDK for text generation and structured evaluation.
* `backend/tests/`: Directory containing unit tests validating backend routes and logic operations.

### Frontend Application Code (`frontend/`)
* `frontend/`: React single-page application package directory.
* `frontend/public/`: Directory containing static public web resources (favicon, index.html asset, manifest).
* `frontend/src/`: React source code directory.
* `frontend/src/assets/`: Styling resources, fonts, and images.
* `frontend/src/components/`: Reusable, layout-agnostic React elements (e.g., standard layout headers, loading indicators, custom widgets).
* `frontend/src/pages/`: Main page components corresponding to the four primary views.
* `frontend/src/pages/Home.jsx`: The welcome screen page welcoming candidates and initiating the interview prep track.
* `frontend/src/pages/TopicSelection.jsx`: Screen page presenting Python, DSA, and HR options.
* `frontend/src/pages/Interview.jsx`: Dynamic session view page housing the current question, response textbox, submit trigger, and feedback.
* `frontend/src/pages/Dashboard.jsx`: Screen list page showing the tabular grid of previous sessions and summaries.
* `frontend/src/services/`: Modules handling API calls.
* `frontend/src/services/api.js`: Axios configuration setting base URLs and exporting functions for endpoint requests.
* `frontend/src/App.jsx`: Main React component defining view routings and context scopes.
* `frontend/src/index.css`: Base Tailwind directives and custom CSS rules.
* `frontend/src/index.jsx`: Application DOM mounting entry point.

### Project Documentation (`docs/`)
* `docs/`: Directory containing all system design documents.
* `docs/images/`: Folder housing high-level system diagrams, flow sequences, and relational schemas as PNG files.
* `docs/images/high-level-architecture.png`: Diagram showing client, server, SQLite, and Gemini connections.
* `docs/images/interview-workflow.png`: Diagram showing the exact sequential steps of an active interview session.
* `docs/images/database-schema.png`: Relational table layout mapping keys and fields.
* `docs/Problem.md`: Outlines project goals, objectives, existing prep challenges, and scope constraints.
* `docs/Requirements.md`: Outlines functional requirements, non-functional rules, and target environment specs.
* `docs/Architecture.md`: Details the software structures, API blueprints, database tables, and folder maps.
* `docs/ImplementationPlan.md`: Outlines the 3-phase chronological developer tasks and milestones.