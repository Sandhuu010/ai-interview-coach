import axios from 'axios';

// Base URL points to the local FastAPI backend
const API_BASE_URL = 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  /**
   * Initializes a new interview session.
   * POST /sessions
   */
  createSession: async (topic) => {
    const response = await client.post('/sessions', { topic });
    return response.data;
  },

  /**
   * Generates a single question for the given session.
   * POST /sessions/{session_id}/questions
   */
  generateQuestion: async (sessionId) => {
    const response = await client.post(`/sessions/${sessionId}/questions`);
    return response.data;
  },

  /**
   * Submits a candidate's answer for evaluation.
   * POST /questions/{question_id}/answer
   */
  submitAnswer: async (questionId, userAnswer) => {
    const response = await client.post(`/questions/${questionId}/answer`, { user_answer: userAnswer });
    return response.data;
  },

  /**
   * Concludes the session, averages the score, and generates the AI summary.
   * POST /sessions/{session_id}/complete
   */
  completeSession: async (sessionId) => {
    const response = await client.post(`/sessions/${sessionId}/complete`);
    return response.data;
  },

  /**
   * Lists all historic sessions.
   * GET /sessions
   */
  listSessions: async () => {
    const response = await client.get('/sessions');
    return response.data;
  },

  /**
   * Retrieves a specific session's history and questions.
   * GET /sessions/{session_id}
   */
  getSessionDetails: async (sessionId) => {
    const response = await client.get(`/sessions/${sessionId}`);
    return response.data;
  },
};
