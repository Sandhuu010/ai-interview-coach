# Problem Statement: AI Interview Coach

## 1. Problem Statement
Securing a position in the highly competitive software engineering and technology sector requires candidates to excel in both technical domains (e.g., Python programming, Data Structures & Algorithms) and behavioral evaluations (HR interviews). Job seekers face significant stress and difficulty during preparation because reading study materials and practicing coding on competitive platforms does not simulate the actual conversational, high-pressure environment of a live interview. 

Currently, candidates lack a realistic, interactive, and immediate feedback loop. Mock interviews with human coaches are expensive, difficult to schedule, and often fail to cover all necessary technical subdomains. Consequently, many qualified candidates perform poorly simply due to a lack of structured practice and unfamiliarity with explaining their thought process in real-time.

## 2. Existing Challenges
* **High Financial Barriers**: Professional mock interview services or 1-on-1 coaching platforms cost between $50 to $300 per session, making them inaccessible to students and junior engineers.
* **Static and Passive Materials**: Reading books, blogs, or watching tutorials is passive. Candidates struggle to transition from passive comprehension to active, coherent verbal/written responses.
* **Lack of Direct and Detailed Feedback**: Standard coding platforms (e.g., LeetCode) only verify if code passes test cases. They do not evaluate code quality, time/space complexity explanations, edge-case reasoning, or overall communication style.
* **Generative AI Hallucinations & Context Drift**: Although general-purpose AI chat tools (e.g., vanilla ChatGPT/Gemini UI) can simulate interviews, they lack structured evaluation frameworks, fail to retrieve specific curriculum guidelines (RAG), and quickly lose the context of the interview session (e.g., jumping between unrelated topics or giving away answers too easily).
* **Inefficient Progress Tracking**: Candidates practicing across multiple platforms have no centralized dashboard to visualize their preparation journey, identify recurring weaknesses, or measure topic-specific readiness.

## 3. Proposed Solution
The proposed solution is the **AI Interview Coach**, a localized, lightweight, and high-performance desktop-web application designed to simulate live technical and behavioral interviews. 

By leveraging the **Gemini API** for prompt execution and **Retrieval-Augmented Generation (RAG)** via a local vector store (**ChromaDB** with **Sentence Transformers**), the coach retrieves actual interview rubrics and study notes to generate highly relevant, curriculum-aligned questions. 

Upon receiving the user's answer, the system executes an automated qualitative and quantitative evaluation, returning an immediate score, targeted feedback, and specific suggestions for improvement. The session history and question logs are saved in a local **SQLite** database and displayed on a sleek, modern **React** dashboard.

## 4. Objectives
* **Provide Accessible Interview Prep**: Give job seekers a free, locally runnable, and realistic mock interview environment.
* **Establish Relevant Context (RAG)**: Retrieve authentic question-answer patterns and concept frameworks for Python, DSA, and HR interviews to ensure high question quality and strict evaluation.
* **Deliver Actionable Feedback**: Produce comprehensive, structured evaluations that split performance into scores, feedback, and clear conceptual improvements.
* **Track Historical Progress**: Enable candidates to review previous sessions and observe improvements over time via a historical performance dashboard.
* **Ensure Timeline Feasibility**: Keep the design clean, modular, and achievable within a 2–3 day sprint by using lightweight, modern technologies (FastAPI, SQLite, React, ChromaDB).

## 5. Project Scope (MVP)
To guarantee high code quality and completion within the 2–3 day timeline, the application restricts itself to a minimal, high-impact feature set.

### In-Scope Topics
The MVP will support only three specific interview topics:
1. **Python Programming**
2. **Data Structures & Algorithms (DSA)**
3. **HR Interview**

### Core Design Rules (Simplified for MVP)
1. **Simplified Database**: Uses only two tables (`InterviewSession` and `InterviewQuestion`) in SQLite.
2. **Fixed Interview Flow**: The interview always consists of exactly three questions. The flow is: Topic Selection -> Question 1 -> Answer -> Feedback -> Question 2 -> Answer -> Feedback -> Question 3 -> Answer -> Final Score -> Summary -> Dashboard.
3. **Simplified UI**: Consists of four basic pages (Home Page, Topic Selection, Interview Page, Dashboard) with clean layout components and forms (no complex chat layers, typing animations, split panes, or code highlights).
4. **Lightweight RAG**: Ingests exactly three files under `backend/data/knowledge/` (`python.md`, `dsa.md`, `hr.md`).

### Explicit Out-of-Scope Features
To prevent scope creep and overengineering, the following features are **explicitly excluded**:
* **User Authentication & Authorization**: The application runs locally for a single user.
* **Resume Parsing & Analysis**: No PDF parsing or custom resume uploads.
* **Voice Interviews / Audio Processing**: All communication is text-based (type to respond).
* **ATS Resume Scoring**: No keyword matching or job description compliance analysis.
* **Company-Specific Interview Modes**: No targeted tracks for specific companies (e.g., "Google Mode").
* **Multi-Agent Systems**: Prompting is handled via a single orchestration layer rather than complex agent-to-agent negotiations.
* **Admin Panel / User Management**: No multi-tenant admin dashboards or question upload panels.

## 6. Future Scope
Once the MVP is successfully deployed, the architecture allows for future extensions:
* **Speech-to-Text & Text-to-Speech (STT/TTS)**: Integrating audio transcription to allow voice-based mock interviews.
* **ATS Compatibility & Resume Upload**: Parsing user resumes using PDF extractors and tailoring interview questions to their specific work history.
* **Multi-Agent Mock Panel**: Implementing a multi-agent system where different AI personas (e.g., standard engineer, hiring manager, tech lead) evaluate the user.
* **Company & Job Role Profiles**: Curating custom vector indexes loaded with real-world interview leaks and style guides for specific top-tier companies.

## 7. Expected Outcomes
* **Increased Readiness & Confidence**: Users will practice answering unstructured questions under mock conditions, reducing interview anxiety.
* **Constructive Performance Metrics**: Candidates receive immediate, objective scoring, helping them pinpoint exactly where they fall short.
* **Sleek and Frictionless Experience**: A fast, locally hosted application with low response times and a clean visual representation of their preparation progress.
