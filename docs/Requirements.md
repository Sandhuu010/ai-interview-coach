# System Requirements: AI Interview Coach

This document details the functional, non-functional, hardware, software, and dependency requirements for the AI Interview Coach MVP.

---

## 1. Functional Requirements

### FR-1: Topic Selection
* **FR-1.1**: The user must be presented with exactly three interview topics on the Home Page:
  * **Python Programming**
  * **Data Structures & Algorithms (DSA)**
  * **HR Interview**
* **FR-1.2**: Choosing a topic must initialize a new interview session and transition the user to the Interview Page.
* **FR-1.3**: The topic selection must trigger the backend to prepare the specific vector database collection for retrieval.

### FR-2: Question Generation
* **FR-2.1**: The system must query ChromaDB to retrieve relevant context (concepts, questions, rubrics) matching the selected topic.
* **FR-2.2**: The retrieved context must be injected into a prompt template sent to the Gemini API.
* **FR-2.3**: The Gemini API must generate exactly one interview question tailored to the topic and the retrieved guidelines.
* **FR-2.4**: The system must enforce an exact length of **three questions** per interview session. Multi-turn conversational questions or configurable session lengths are not supported.

### FR-3: Answer Submission
* **FR-3.1**: The user must be provided with a multi-line answer textbox to submit their response on the Interview Page.
* **FR-3.2**: The system must validate that the submission is not empty before sending it to the backend.
* **FR-3.3**: The system must display a loading indicator while the user's answer is being processed and evaluated.

### FR-4: AI Evaluation
* **FR-4.1**: The backend must send the user's answer, the question, and retrieval context to the Gemini API for evaluation.
* **FR-4.2**: The evaluation response from Gemini must follow a structured JSON response containing:
  * **Score**: An integer between 0 and 100 representing the accuracy and quality of the response.
  * **Feedback**: A qualitative assessment highlighting what the user answered correctly.
  * **Improvement Suggestions**: Actionable points detailing missing concepts or soft-skill corrections.

### FR-5: Interview History
* **FR-5.1**: Each interview session must be stored in the local SQLite database. The schema is restricted to exactly two tables: `InterviewSession` and `InterviewQuestion`. No extra tables are permitted.
* **FR-5.2**: Each question asked, along with the user's response, score, feedback, and suggestions, must be stored in relation to the interview session.
* **FR-5.3**: Session details must be persistent and read-only once the session is marked as completed.

### FR-6: Dashboard
* **FR-6.1**: The Dashboard page must display a list of all previous interview sessions.
* **FR-6.2**: The information displayed on the dashboard for each session is strictly limited to:
  * **Topic**
  * **Date**
  * **Average Score** (calculated from the three question scores)
  * **Session Summary**
* **FR-6.3**: Selecting a past session from the dashboard list must open a detailed history view showing every question, answer, score, and feedback item from that session.
* **FR-6.4**: Advanced analytics, graphs, visual charts, and statistics are explicitly out of scope.

---

## 2. Non-Functional Requirements

### NFR-1: Performance
* **NFR-1.1**: The RAG retrieval from ChromaDB must complete in under **500 milliseconds**.
* **NFR-1.2**: API response time for non-AI database calls (e.g., loading history, rendering dashboard) must be under **200 milliseconds**.
* **NFR-1.3**: The total turnaround time for Gemini question generation and answer evaluation must be under **5 seconds** under standard network conditions.
* **NFR-1.4**: The frontend must show responsive loading indicators (skeleton loaders or spinners) for any action taking longer than **300 milliseconds**.

### NFR-2: Maintainability
* **NFR-2.1**: The codebase must be separated into decoupled frontend (`/frontend`) and backend (`/backend`) directories.
* **NFR-2.2**: Backend Python code must strictly follow **PEP 8** style guidelines and pass type validations via Pydantic/SQLModel.
* **NFR-2.3**: React components must be modular, separating logical state hooks from visual representation.

### NFR-3: Scalability
* **NFR-3.1**: The schema must support adding new topics simply by adding a new Markdown source file to ChromaDB and a configuration enum, without altering the database schema or core engine.
* **NFR-3.2**: Vector database collections must be isolated per topic to ensure retrieval operations remain fast as context data grows.

### NFR-4: Usability (Simplified UI)
* **NFR-4.1**: The UI is simplified to contain exactly four pages:
  * **Home Page**
  * **Topic Selection**
  * **Interview Page** (includes: Current Question, Multi-line Answer Textbox, Submit Button, Score, Feedback, Next Question Button)
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
* **Memory**: Minimum **8 GB RAM** (16 GB recommended, due to local execution of Sentence Transformers embedding model).
* **Storage**: Minimum **2 GB** of free disk space.

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

| Layer | Technology | Version / Rationale |
| :--- | :--- | :--- |
| **Frontend** | React.js | UI framework; component-driven SPA for seamless state transitions. |
| **Styling** | Tailwind CSS | Utility-first CSS framework for clean, responsive styling. |
| **API Client** | Axios | Promise-based HTTP client for API communication. |
| **Backend** | FastAPI | High-performance, async-first Python web framework with auto-generated OpenAPI docs. |
| **ORM / DB Layer** | SQLModel | Integrates SQLalchemy and Pydantic for clean, type-safe database queries. |
| **Database** | SQLite | Lightweight, file-based relational database; requires zero configuration. |
| **Data Validation** | Pydantic v2 | Python data validation and settings management using type hints. |
| **AI LLM** | Gemini API | Cost-efficient, high-context LLM; accessed via official Google Gen AI SDK. |
| **Vector DB** | ChromaDB | Lightweight, open-source embedded vector database; runs in-process. |
| **Embeddings** | Sentence Transformers | Local embedding model (`all-MiniLM-L6-v2`) for generating vector representations. |

---

## 6. API Endpoints
The backend must expose **only** the following six endpoints. No other endpoints should be added.

* `POST /sessions`: Creates and starts a new interview session.
* `POST /sessions/{session_id}/questions`: Generates the next question using RAG and Gemini.
* `POST /questions/{question_id}/answer`: Submits the user's answer for evaluation and returns the score, feedback, and improvement suggestions.
* `POST /sessions/{session_id}/complete`: Calculates the overall score, generates the session summary, and marks the session complete.
* `GET /sessions`: Lists previous interview sessions (for Dashboard display).
* `GET /sessions/{session_id}`: Retrieves details and question history for a specific session.
