# System Requirements: AI Interview Coach

This document details the functional, non-functional, hardware, software, and dependency requirements for the AI Interview Coach MVP.

---

## 1. Functional Requirements

### FR-1: Topic Selection
* **FR-1.1**: The user must be presented with exactly three interview topics on the Home Page:
  * **Python Programming**
  * **Data Structures & Algorithms (DSA)**
  * **HR Interview**
* **FR-1.2**: Choosing a topic must initialize a new interview session and transition the user to the Interview Page by saving the returned session_id in the frontend application state.
* **FR-1.3**: The topic selection must trigger the backend to prepare a session matching the selected topic enum.

### FR-2: Question Generation
* **FR-2.1**: The system must construct a prompt using simple, hardcoded constant strings defined in the backend code for the selected topic (Python, DSA, or HR).
* **FR-2.2**: The prompt must be sent directly to the Gemini API to generate exactly one interview question.
* **FR-2.3**: **One-Question Length**: The system must enforce an exact length of **one question** per interview session. Multi-turn conversational questions or multiple question loops are not supported.

### FR-3: Answer Submission
* **FR-3.1**: The user must be provided with a multi-line answer textbox to submit their response on the Interview Page.
* **FR-3.2**: The system must validate that the submission is not empty before sending it to the backend.
* **FR-3.3**: The system must display a simple `"Processing..."` text message in the UI while the user's answer is being processed and evaluated.

### FR-4: AI Evaluation
* **FR-4.1**: The backend must send the user's answer and the question to the Gemini API for evaluation.
* **FR-4.2**:The backend evaluates the user's answer using the Gemini API and returns a structured response to the frontend containing:
  * **score**: An integer between 0 and 100 representing the response quality.
  * **feedback**: A string containing qualitative assessment.
  * **improvement_suggestions**: A string listing actionable points.
* **FR-4.3**: The backend parses this evaluation and returns it directly to the frontend.

### FR-5: Interview History
* **FR-5.1**: Each interview session must be stored in the local SQLite database. The schema is restricted to exactly two tables: `InterviewSession` and `InterviewQuestion`. No extra tables are permitted.
* **FR-5.2**: The generated question, along with the user's response, score, feedback, and suggestions, must be stored in relation to the interview session.
* **FR-5.3**: Session details must be persistent and read-only once the session is marked as completed.

### FR-6: Dashboard
* **FR-6.1**: The Dashboard page must display a list of all previous interview sessions.
* **FR-6.2**: The information displayed on the dashboard for each session is strictly limited to:
  * **Topic**
  * **Date**
  * **Average Score** (which equals the single question score)
  * **Session Summary**
* **FR-6.3**: Selecting a past session from the dashboard list must open a detailed history view showing the question, answer, score, feedback, and improvement suggestions from that session.
* **FR-6.4**: Advanced analytics, graphs, visual charts, and statistics are explicitly out of scope.

---

## 2. Non-Functional Requirements

### NFR-1: Performance
* **NFR-1.1**: Database operations should complete within approximately 200 milliseconds under normal local execution.
* **NFR-1.2**: The total turnaround time for Gemini question generation and answer evaluation must be under **5 seconds** under standard network conditions.
* **NFR-1.3**: The frontend must display a simple loading indicator while requests are being processed.

### NFR-2: Maintainability
* **NFR-2.1**: The codebase must be separated into decoupled frontend (`/frontend`) and backend (`/backend`) directories.
* **NFR-2.2**:Use Pydantic and SQLModel for data validation and database models.
* **NFR-2.3**: React components must be modular, separating logical state hooks from visual representation.

### NFR-3: Scalability
* **NFR-3.1**: The system must support modifying interview generation templates simply by editing backend prompt configuration strings, without altering the database schema or core engine.
* **NFR-3.2**: Database relations must remain simple (1 Session to 1 Question) to optimize indexing and querying.

### NFR-4: Usability (Simplified UI)
* **NFR-4.1**: The UI is simplified to contain exactly four pages:
  * **Home Page**
  * **Topic Selection**
  * **Interview Page** (includes: Current Question, Multi-line Answer Textbox, Submit Button, Score, Feedback, Complete Session Button)
  * **Dashboard** (list of previous sessions)
* **NFR-4.2**: The frontend will use standard responsive web design using Tailwind utility classes.
* **NFR-4.3**: Complex visual elements, including split panes, code syntax highlighting, markdown parsing, typing animations, chat layouts, and advanced UI effects, are **completely excluded** to keep the project clean and achievable.

### NFR-5: Reliability
* **NFR-5.1**: In case of a Gemini API outage, the backend must fail gracefully, returning a descriptive error to the client instead of crashing.
* **NFR-5.2**: The local database write operations must use transaction blocks to prevent partial or corrupted session logs.

---

## 3. Hardware Requirements

### Development & Host Environment
* **CPU**: Dual-core x86_64 or ARM64 processor (Intel i5/AMD Ryzen 5 or Apple M1/M2/M3).
* **Memory**: Minimum **4 GB RAM**.
* **Storage**: Minimum **500 MB** of free disk space.

---

## 4. Software Requirements

* **Operating System**: Windows 10/11, macOS (12+), or Ubuntu Linux (20.04 LTS+).
* **Runtime Environments**:
  * **Python**: Version **3.10.x** or **3.11.x**.
  * **Node.js**: Version **18.x** or **20.x** (LTS).
* **Database Engine**: **SQLite** (bundled with Python).
* **Web Browser**: Modern evergreen browser (Google Chrome 110+, Mozilla Firefox 110+, Microsoft Edge 110+, Safari 16+).

---

## 5. Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React.js | UI framework; component-driven SPA for seamless state transitions. |
| **Styling** | Tailwind CSS | Utility-first CSS framework for clean, responsive styling. |
| **API Client** | Axios | Promise-based HTTP client for API communication. |
| **Backend** | FastAPI |Modern Python web framework for building REST APIs. |
| **ORM / DB Layer** | SQLModel |Integrates SQLalchemy and Pydantic for clean, type-safe database queries. |
| **Database** | SQLite | Lightweight, file-based relational database; requires zero configuration. |
| **Data Validation** | Pydantic v2 | Python data validation and settings management using type hints. |
| **AI LLM** | Gemini API | Cost-efficient, high-context LLM; accessed via official Google Gen AI SDK. |

---

## 6. API Endpoints
The backend must expose **only** the following six endpoints. No other endpoints should be added.

* `POST /sessions`: Creates and starts a new interview session.
* `POST /sessions/{session_id}/questions`: Generates the single question using Gemini prompting.
* `POST /questions/{question_id}/answer`: Submits the user's answer for evaluation and returns the score, feedback, and improvement suggestions.
* `POST /sessions/{session_id}/complete`: Calculates the overall score, generates the session summary, and marks the session complete.
* `GET /sessions`: Lists previous interview sessions (for Dashboard display).
* `GET /sessions/{session_id}`: Retrieves details and question history for a specific session.
