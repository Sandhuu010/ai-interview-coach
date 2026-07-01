import os
import json
import re
from google import genai
from google.genai import errors

# Hardcoded prompt constants to keep the service lightweight
PYTHON_PROMPT = (
    "You are a professional technical interviewer conducting a Python programming interview. "
    "Generate exactly one clear, conceptual, or practical Python interview question. "
    "Focus on core concepts like decorator mechanics, generators, memory management, or object-oriented programming. "
    "Output ONLY the question text. Do not include any introductory remarks, headings, or markdown code blocks."
)

DSA_PROMPT = (
    "You are a professional technical interviewer conducting a Data Structures and Algorithms (DSA) interview. "
    "Generate exactly one interview question testing algorithm selection, data structures (like trees, graphs, heaps, or hash maps), or complexity analysis. "
    "Do NOT ask the candidate to write full code; instead, ask them to explain their conceptual solution or algorithmic logic. "
    "Output ONLY the question text. Do not include any introductory remarks, headings, or markdown code blocks."
)

HR_PROMPT = (
    "You are a professional HR interviewer conducting a behavioral interview. "
    "Generate exactly one behavioral question (e.g., assessing teamwork, dealing with conflict, solving a complex problem) designed to be answered using the STAR method. "
    "Output ONLY the question text. Do not include any introductory remarks, headings, or markdown code blocks."
)

EVALUATION_SYSTEM_INSTRUCTION = (
    "You are an expert interviewer evaluating a candidate's response. "
    "You must return your evaluation as a valid JSON object matching this structure exactly:\n"
    "{\n"
    '  "score": 85,\n'
    '  "feedback": "Write a qualitative assessment explaining what the user did well...",\n'
    '  "improvement_suggestions": "Write actionable suggestions indicating missing details or optimization options..."\n'
    "}\n"
    "Ensure the JSON syntax is perfectly valid. Do not write any explanatory text outside of the JSON object."
)

class GeminiService:
    def __init__(self):
        # Initialize GenAI Client using env key
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not configured.")
        self.client = genai.Client(api_key=api_key)

    def generate_question(self, topic: str) -> str:
        """Generates a single question based on the selected topic."""
        topic_lower = topic.lower()
        if "python" in topic_lower:
            prompt = PYTHON_PROMPT
        elif "dsa" in topic_lower or "data structures" in topic_lower or "algorithm" in topic_lower:
            prompt = DSA_PROMPT
        elif "hr" in topic_lower:
            prompt = HR_PROMPT
        else:
            prompt = f"Generate exactly one professional interview question about {topic}. Output ONLY the question text."

        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            question_text = response.text.strip() if response.text else ""
            if not question_text:
                raise ValueError("Gemini returned an empty response text.")
            return question_text
        except Exception as e:
            # Return fallback question on failure
            if "python" in topic_lower:
                return "Explain the difference between a list and a tuple in Python, and when you would use each."
            elif "dsa" in topic_lower:
                return "How does a hash map resolve collisions under the hood? Explain chaining and open addressing."
            else:
                return "Describe a time you had a technical disagreement with a team member. How did you resolve it?"

    def evaluate_answer(self, question: str, answer: str) -> dict:
        """Evaluates the candidate's answer and returns score, feedback, and improvement suggestions."""
        prompt = (
            f"Question Asked: {question}\n"
            f"Candidate Answer: {answer}\n\n"
            "Evaluate this response and return score, feedback, and improvement_suggestions using the JSON structure specified."
        )

        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={"system_instruction": EVALUATION_SYSTEM_INSTRUCTION}
            )
            response_text = response.text.strip() if response.text else ""
            
            # Clean JSON out of Markdown code blocks if present
            clean_json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
            if not clean_json_match:
                raise ValueError(f"Could not extract valid JSON from response: {response_text}")
            
            parsed_data = json.loads(clean_json_match.group(0))
            
            # Validate types and values
            score = parsed_data.get("score")
            feedback = parsed_data.get("feedback")
            improvement_suggestions = parsed_data.get("improvement_suggestions")

            # Check that score is an integer between 0 and 100
            if score is None:
                raise ValueError("Gemini evaluation response is missing the 'score' field.")
            try:
                score = int(score)
            except (TypeError, ValueError):
                raise ValueError("Evaluation field 'score' must be a valid integer.")
            
            if not (0 <= score <= 100):
                raise ValueError(f"Evaluation field 'score' ({score}) must be an integer between 0 and 100.")

            # Check feedback and suggestions are non-empty strings
            if not feedback or not isinstance(feedback, str) or not feedback.strip():
                raise ValueError("Evaluation field 'feedback' must be a non-empty string.")
            
            if not improvement_suggestions or not isinstance(improvement_suggestions, str) or not improvement_suggestions.strip():
                raise ValueError("Evaluation field 'improvement_suggestions' must be a non-empty string.")

            return {
                "score": score,
                "feedback": feedback.strip(),
                "improvement_suggestions": improvement_suggestions.strip()
            }
        except Exception as e:
            # Check if this was a validation failure of Gemini's returned data
            error_str = str(e)
            if "validation" in error_str or "must be" in error_str or "missing" in error_str or "json" in error_str.lower():
                raise ValueError(f"AI evaluation validation failed: {error_str}")
            
            # If the API key is invalid/offline, run a local heuristic fallback evaluation
            word_count = len(answer.split())
            fallback_score = min(40 + word_count // 2, 90)
            
            return {
                "score": fallback_score,
                "feedback": (
                    f"Note: Live AI evaluation is unavailable (invalid API key or connection offline). "
                    f"Local heuristic evaluation: Your answer has {word_count} words and has been logged. "
                    "Ensure you explain core principles, handle potential boundary errors, and reference execution time complexities."
                ),
                "improvement_suggestions": (
                    "Please configure a valid GEMINI_API_KEY in your .env file to enable Gemini-based scoring. "
                    "For locally-practiced answers, consider detailing the architectural trade-offs of this approach."
                )
            }

    def generate_summary(self, question: str, answer: str, score: int, feedback: str) -> str:
        """Generates a brief summary of the completed interview session."""
        prompt = (
            "Write a single concise paragraph (under 3 sentences) summarizing the candidate's interview session. "
            f"The question asked was: '{question}'. The candidate scored {score}/100. "
            f"The general evaluator feedback was: '{feedback}'."
        )
        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            summary_text = response.text.strip() if response.text else ""
            if not summary_text:
                return f"Interview completed. Candidate scored {score}/100 with general topic understanding."
            return summary_text
        except Exception:
            return f"Interview completed. Candidate scored {score}/100 with general topic understanding."
