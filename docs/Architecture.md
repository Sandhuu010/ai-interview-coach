# System Architecture: AI Interview Coach

This document details the system architecture, component design, data flow, API specifications, and database schema for the AI Interview Coach.

---

## 1. System Overview
The AI Interview Coach is designed as a lightweight, single-user client-server application. It decouples the presentation layer (**React Single Page Application**) from the core business logic layer (**FastAPI**), utilizing a local relational database (**SQLite**) and an in-process vector store (**ChromaDB**). 

The external **Gemini API** handles natural language generation and response evaluation, while a local embedding model (**Sentence Transformers**) runs within the FastAPI process to convert study resources into vector embeddings.

---

## 2. High-Level Architecture Diagram
The diagram below illustrates the physical and logical boundaries of the application.

```mermaid
graph TD
    subgraph Client ["Client (Frontend Browser)"]
        ReactApp["React SPA (4 Simple Pages)"]
        AxiosClient["Axios HTTP Client"]
        ReactApp --> AxiosClient
    end

    subgraph Server ["Server (FastAPI Process)"]
        FastAPI_Router["FastAPI Router (6 Endpoints)"]
        SQLModel_ORM["SQLModel (ORM / Data Validation)"]
        EmbeddingEngine["Sentence Transformers Engine"]
        RAG_Orchestrator["RAG & Prompt Orchestrator"]
        
        AxiosClient -- "REST API (HTTP/JSON)" --> FastAPI_Router
        FastAPI_Router --> SQLModel_ORM
        FastAPI_Router --> RAG_Orchestrator
        RAG_Orchestrator --> EmbeddingEngine
    end

    subgraph Storage ["Local Storage"]
        SQLite_DB[("SQLite Database<br>(sessions.db: 2 Tables)")]
        Chroma_DB[("ChromaDB Vector Store<br>(vector_store/)")]
        Markdown_Files["Markdown Raw Data<br>(3 Knowledge Files)"]
        
        SQLModel_ORM --> SQLite_DB
        EmbeddingEngine -- "Read / Write Vectors" --> Chroma_DB
        EmbeddingEngine -- "Ingest" --> Markdown_Files
    end

    subgraph External_AI ["External Services"]
        GeminiAPI["Gemini API (gemini-2.5-flash)"]
        RAG_Orchestrator -- "Google Gen AI SDK" --> GeminiAPI
    end
    
    style Client fill:#f9f9f9,stroke:#333,stroke-width:2px
    style Server fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px
    style Storage fill:#efebe9,stroke:#795548,stroke-width:2px
    style External_AI fill:#ede7f6,stroke:#673ab7,stroke-width:2px
```

---

## 3. Interview Flow Diagram
The sequential workflow below represents the fixed lifecycle of a three-question interview:

```mermaid
sequenceDiagram
    autonumber
    actor User as Candidate
    participant UI as React UI
    participant API as FastAPI Backend
    participant VDB as ChromaDB (Vector DB)
    participant LLM as Gemini API
    participant DB as SQLite DB

    User->>UI: Select Interview Topic (e.g., Python)
    UI->>API: POST /sessions (topic: "Python")
    API->>DB: Create Session Record (overall_score=None, is_completed=false)
    DB-->>API: Return session_id
    API-->>UI: Return session_id

    Note over User, DB: Loop: Question 1, 2, and 3
    
    UI->>API: POST /sessions/{session_id}/questions
    API->>VDB: Query context for topic/keywords from RAG files
    VDB-->>API: Return relevant text chunks
    API->>LLM: Generate question (inject context + previous answers in session)
    LLM-->>API: Return single question text
    API->>DB: Save question record (session_id, question_text)
    API-->>UI: Return question (question_id, question_text)

    User->>UI: Type answer & click "Submit"
    UI->>API: POST /questions/{question_id}/answer (user_answer)
    API->>DB: Update question record with user_answer
    API->>VDB: Query evaluation rubrics for the question
    VDB-->>API: Return evaluation context
    API->>LLM: Evaluate response (question + answer + rubric context)
    LLM-->>API: Return JSON (score, feedback, improvement_suggestions)
    API->>DB: Save evaluation results (score, feedback, suggestions)
    API-->>UI: Return evaluation details
    UI->>User: Display Score, Feedback, and "Next Question" Button
    
    Note over User, DB: End of Loop after 3 Questions

    User->>UI: Click "Complete Session" / Trigger auto-completion
    UI->>API: POST /sessions/{session_id}/complete
    API->>DB: Fetch all 3 questions scores & calculate average
    API->>LLM: Generate final session summary based on history
    LLM-->>API: Return brief session summary text
    API->>DB: Update Session record (overall_score, summary, is_completed=true)
    API-->>UI: Return completion status (overall_score, summary)
    UI->>User: Navigate to Dashboard and display session summary
```

---

## 4. Component Responsibilities

### Frontend Responsibilities
* **Routing & Navigation**: Render exactly four pages:
  * **Home Page**: Initial entry point.
  * **Topic Selection**: Choose Python, DSA, or HR.
  * **Interview Page**: Dynamic view containing the Current Question, a Multi-line Answer Textbox, a Submit Button, Score, Feedback, and a Next Question Button.
  * **Dashboard**: List of previous sessions showing Topic, Date, Average Score, and Session Summary.
* **State Management**: Track the active session ID, the current question count (1 to 3), and form validation states.
* **UI Polish**: Standard clean layout using Tailwind CSS. 
* **Out-of-Scope (Excluded)**: No split panes, code syntax highlighting, markdown parsing, typing animations, complex chat structures, or advanced UI effects.

### Backend Responsibilities
* **Routing & Controllers**: Expose exactly six RESTful endpoints for sessions, questions, evaluations, and history.
* **RAG Retrieval**: Embed queries locally and query ChromaDB for contextual guidelines.
* **LLM Prompts & Orchestrator**: Package context, session history, and prompt templates, communicating with Gemini API via the official Python SDK.
* **Data Persistence**: Map relational schemas to SQLite using SQLModel.
* **Data Validation**: Enforce typing constraints on incoming payloads and outgoing responses using Pydantic.

---

## 5. Technology Selection Rationale

* **FastAPI**: Exceptionally fast development speed, high performance due to asynchronous capabilities, and automatic OpenAPI documentation generation.
* **SQLModel**: Unifies SQLAlchemy (database) and Pydantic (data validation). This prevents code duplication, as a single class serves as both the database model and the API schema.
* **SQLite**: Embedded database that stores data in a local file. This removes the need for database installation, provisioning, or network configuration.
* **ChromaDB**: Runs as an in-memory or embedded database. Excellent choice for rapid prototyping because it requires zero server setup.
* **Sentence Transformers (`all-MiniLM-L6-v2`)**: A lightweight embedding model (under 120MB) that runs entirely on standard CPUs. It generates high-quality 384-dimensional embeddings locally, eliminating remote API costs for embedding generation.
* **Gemini API (`gemini-2.5-flash`)**: High-performance, cost-effective multimodal LLM with extremely low latency. Crucially, it supports native Structured JSON Outputs, guaranteeing that the AI evaluation parsing never breaks.
* **React**: Component-driven model allows for the creation of an interactive, real-time chat interface that updates fluidly.

---

## 6. RAG Architecture
To ensure questions and evaluations remain accurate, the application leverages Retrieval-Augmented Generation:

1. **Ingestion Phase**: 
   * Ingestion is restricted to exactly three files containing interview concepts, sample questions, and evaluation rubrics:
     * `backend/data/knowledge/python.md`
     * `backend/data/knowledge/dsa.md`
     * `backend/data/knowledge/hr.md`
   * On startup, the backend parses these files, splits them into logical chunks (e.g., by headers or 800-character windows), and generates vector embeddings using `SentenceTransformer('all-MiniLM-L6-v2')`.
   * Chunks and embeddings are stored in ChromaDB collections named after their topics: `collection_python`, `collection_dsa`, and `collection_hr`.
2. **Retrieval Phase**:
   * When generating a question, a random keyword or prior question topic is embedded, and a similarity search returns the top 2-3 most relevant curriculum chunks.
   * During evaluation, the prompt injects the specific question guidelines retrieved from ChromaDB, forcing Gemini to evaluate the user's code/text against standard solutions and grading expectations.

---

## 7. Database Design (SQLite)
The application utilizes SQLModel to construct **exactly** two relational tables in SQLite. No other tables may be added.

```mermaid
erDiagram
    InterviewSession ||--o{ InterviewQuestion : contains
    InterviewSession {
        int id PK
        string topic
        datetime created_at
        float overall_score
        string summary
        boolean is_completed
    }
    InterviewQuestion {
        int id PK
        int session_id FK
        string question_text
        string user_answer
        int score
        string feedback
        string improvement_suggestions
        datetime timestamp
    }
```

### Table Schema Definitions

#### `InterviewSession`
* `id` (`int`, Primary Key): Unique identifier of the session.
* `topic` (`str`): The category selected (`python`, `dsa`, or `hr`).
* `created_at` (`datetime`): Timestamp of initialization.
* `overall_score` (`float`, Nullable): Calculated average of the exactly 3 graded questions.
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

## 8. API Design

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

#### 2. Generate Next Question
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
    "question_text": "Explain the difference between a list and a tuple in Python...",
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
    "summary": "Completed successfully. Solid understanding of Python structures, but could improve on memory utilization concepts.",
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
      "summary": "Completed successfully. Solid understanding...",
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
## API Flow

React UI

↓

POST /sessions

↓

Session Created

↓

POST /sessions/{id}/questions

↓

RAG retrieves context

↓

Gemini generates question

↓

Question displayed

↓

POST /questions/{id}/answer

↓

Gemini evaluates answer

↓

Score + Feedback returned

↓

Repeat until 3 questions

↓

POST /sessions/{id}/complete

↓

Overall Score + Summary

↓

GET /sessions

↓

Dashboard

## 9. Project Directory Structure
The workspace will organize code into clear directories:

```text
ai-interview-coach/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI initialization & config
│   │   ├── database.py          # SQLite engine & database helper
│   │   ├── models.py            # SQLModel schema classes
│   │   ├── schemas.py           # Pydantic request/response structures
│   │   ├── routes/              # Modular API controllers
│   │   │   ├── __init__.py
│   │   │   ├── sessions.py
│   │   │   └── questions.py
│   │   └── services/            # Business logic layers
│   │       ├── __init__.py
│   │       ├── gemini.py        # Gemini API interface
│   │       └── rag.py           # ChromaDB & Embedding service
│   │
│   ├── data/
│   │   ├── knowledge/           # RAG document library
│   │   │   ├── python.md        # Python interview concepts & questions
│   │   │   ├── dsa.md           # DSA interview concepts & questions
│   │   │   └── hr.md            # HR interview concepts & questions
│   │   └── vector_store/        # ChromaDB SQLite/persist data
│   │
│   └── tests/                   # Backend tests
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/              # Styling resources
│       ├── components/          # Reusable UI components
│       ├── pages/               # Page components
│       │   ├── Home.jsx         # Home Page component
│       │   ├── TopicSelection.jsx # Topic Selection Page component
│       │   ├── Interview.jsx    # Interview Page component
│       │   └── Dashboard.jsx    # Dashboard Page component
│       ├── services/            # Axios API calls mapping
│       ├── App.jsx
│       ├── index.css            # Base Tailwind imports
│       └── index.jsx
│
├── docs/                        # Project documentation
│   ├── Problem.md
│   ├── Requirements.md
│   ├── Architecture.md
│   └── ImplementationPlan.md
│
├── .env.example                 # Environment template file
├── README.md                    # Setup and startup guide
└── requirements.txt             # Python dependencies
```
## Future Expansion

The current project follows a modular architecture so that additional features
can be added without changing the existing codebase.

Possible future modules include:

backend/
    services/
        resume_analysis.py
        speech.py
        analytics.py

frontend/
    pages/
        ResumeAnalysis.jsx
        Analytics.jsx
        Settings.jsx