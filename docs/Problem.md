# Problem Statement: AI Interview Coach

## 1. Problem Statement
Securing a position in the highly competitive software engineering and technology sector requires candidates to excel in both technical domains (e.g., Python programming, Data Structures & Algorithms) and behavioral evaluations (HR interviews). Job seekers face significant stress and difficulty during preparation because reading study materials and practicing coding on competitive platforms does not simulate the actual conversational, high-pressure environment of a live interview. 

Currently, candidates lack a realistic, interactive, and immediate feedback loop. Mock interviews with human coaches are expensive, difficult to schedule, and often fail to cover all necessary technical subdomains. Consequently, many qualified candidates perform poorly simply due to a lack of structured practice and unfamiliarity with explaining their thought process in real-time.

## 2. Existing Challenges
* **High Financial Barriers**: Professional mock interview services or 1-on-1 coaching platforms cost between $50 to $300 per session, making them inaccessible to students and junior engineers.
* **Static and Passive Materials**: Reading books, blogs, or watching tutorials is passive. Candidates struggle to transition from passive comprehension to active, coherent verbal or written responses.
* **Lack of Direct and Detailed Feedback**: Standard coding platforms (e.g., LeetCode) only verify if code passes test cases. They do not evaluate code quality, conceptual explanation, reasoning depth, or overall communication style.
* **Inefficient Progress Tracking**: Candidates practicing across multiple platforms have no centralized dashboard to visualize their preparation journey, identify recurring weaknesses, or measure topic-specific readiness.

## 3. Proposed Solution
The proposed solution is the AI Interview Coach, a lightweight web application that simulates technical and behavioral interviews using the Gemini API. The application provides users with interview questions, evaluates their responses, stores interview history, and displays previous sessions through a simple dashboard.

By leveraging the **Gemini API** for question generation and evaluation, the coach functions as a clean, prompt-driven mock interview simulator. There is no complex retrieval database or advanced AI agent orchestration. 

Upon receiving the user's answer, the system executes an automated evaluation using Gemini, returning an immediate score, targeted feedback, and specific suggestions for improvement. The session history and question logs are saved in a local **SQLite** database and displayed on a simple **React** dashboard.

## 4. Objectives
* Provide Accessible Interview Prep: Give job seekers a free and easy-to-use mock interview application that runs locally during development.
* Generate interview questions for Python, DSA, and HR using Gemini prompts: Generate targeted questions using Gemini prompts for Python, DSA, and HR interview topics.
* Deliver Actionable Feedback: Produce comprehensive, structured evaluations that split performance into scores, feedback, and clear conceptual improvements.
* Track Historical Progress: Enable candidates to review previous sessions and observe improvements over time via a historical performance dashboard.
* Ensure Timeline Feasibility: Keep the design clean, modular, and achievable within a 2–3 day sprint by using lightweight, modern technologies (FastAPI, SQLite, React, Gemini API).

## 5. Scope
To guarantee high code quality and completion within the 2–3 day timeline, the application restricts itself to a minimal, high-impact feature set.

### In-Scope Topics
The MVP will support only three specific interview topics:
1. **Python Programming**
2. **Data Structures & Algorithms (DSA)**
3. **HR Interview**

### Core Design Rules (Simplified for MVP)
1. **Simplified Database**: Uses only two tables (`InterviewSession` and `InterviewQuestion`) in SQLite.
2. **Single-Question Loop**: The interview session is cut to exactly **one question**. The workflow is: Select Topic -> Generate Question -> Submit Answer -> Get Feedback & Score -> Save & Complete -> Dashboard.
3. **Simplified UI**: Consists of four basic pages (Home Page, Topic Selection, Interview Page, Dashboard) with clean layout components (no complex chat layouts, typing animations, split panes, or code highlights).
4. **Prompt-Based Interview Generation**: No vector database, embeddings, similarity search, chunking, or retrieval pipeline (RAG) is utilized. Question generation and evaluation are performed directly via the Gemini API.

### Explicit Out-of-Scope Features
To prevent scope creep and overengineering, the following features are **explicitly excluded**:
* **Retrieval-Augmented Generation (RAG)**: No local vector search database.
* **User Authentication & Authorization**: The application runs locally for a single user.
* **Resume Parsing & Analysis**: No PDF parsing or custom resume uploads.
* **Voice Interviews / Audio Processing**: All communication is text-based (type to respond).
* **ATS Resume Scoring**: No keyword matching or job description compliance analysis.
* **Company-Specific Interview Modes**: No targeted tracks for specific companies.
* **Multi-Agent Systems**: Prompting is handled via a single orchestration layer rather than complex agent-to-agent negotiations.
* **Admin Panel / User Management**: No multi-tenant admin dashboards or question upload panels.

## 6. Future Scope
Once the MVP is successfully deployed, the architecture allows for future extensions:
* **Retrieval-Augmented Generation (RAG)**: Integrating a vector store containing curriculum files to provide custom syllabus questions.
* **Multi-Question Interviews**: Scaling the system to support 3, 5, or 10 question interview tracks.
* **Speech-to-Text & Text-to-Speech (STT/TTS)**: Integrating audio transcription to allow voice-based mock interviews.
* **ATS Compatibility & Resume Upload**: Parsing user resumes using PDF extractors and tailoring interview questions to their specific work history.
