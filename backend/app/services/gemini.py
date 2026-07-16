import os
import json
import re
import sys
import traceback
import random
from google import genai
from google.genai import errors
from google.genai import types

EVALUATION_SYSTEM_INSTRUCTION = (
    "You are an expert interviewer evaluating a candidate's response. "
    "Your feedback and improvement suggestions must be written in a very friendly, supportive, "
    "encouraging, and easy-to-understand way. Avoid overly complex technical jargon, or if you "
    "must mention a term, explain it in simple, intuitive concepts so that even a beginner who "
    "knows nothing about the topic can easily understand it. "
    "You must return your evaluation as a valid JSON object matching this structure exactly:\n"
    "{\n"
    '  "score": 85,\n'
    '  "feedback": "Write a qualitative assessment explaining what the user did well...",\n'
    '  "improvement_suggestions": "Write friendly, easy-to-grasp suggestions explaining concepts simply..."\n'
    "}\n"
    "Ensure the JSON syntax is perfectly valid. Do not write any explanatory text outside of the JSON object."
)

class GeminiService:
    def __init__(self):
        # Verify that .env is actually being loaded before creating the Gemini client
        from pathlib import Path
        from dotenv import load_dotenv
        env_path = Path('.') / '.env'
        if not env_path.exists():
            env_path = Path('..') / '.env'
        load_dotenv(dotenv_path=env_path)

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not configured.")
        self.client = genai.Client(api_key=api_key)

    def _generate_content_with_fallback(self, contents: str, system_instruction: str = None, temperature: float = 1.0):
        """Attempts to generate content using a list of models, falling back if a model is unavailable."""
        models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        last_exception = None
        
        for model in models_to_try:
            try:
                config = types.GenerateContentConfig(
                    temperature=temperature,
                    system_instruction=system_instruction
                )
                response = self.client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config
                )
                return response
            except Exception as e:
                err_msg = str(e).lower()
                is_model_error = "not found" in err_msg or "not_found" in err_msg or "invalid model" in err_msg or "unsupported" in err_msg or "404" in err_msg
                if is_model_error:
                    print(f"[GEMINI] Fallback: Model {model} is unavailable. Trying next...", file=sys.stderr)
                    last_exception = e
                    continue
                else:
                    raise e
        if last_exception:
            raise last_exception
        raise ValueError("All models failed.")

    def _differentiate_gemini_error(self, e: Exception) -> str:
        """Categorizes Gemini exceptions to distinguish connection, key, and format problems."""
        err_msg = str(e).lower()
        if "gemini_api_key" in err_msg or "api_key" in err_msg and "not configured" in err_msg:
            return "Missing API key"
        
        # Quota/Rate Limit Exhausted (HTTP 429)
        if "429" in err_msg or "quota" in err_msg or "rate limit" in err_msg or "resource_exhausted" in err_msg:
            return "Quota exceeded"
            
        # Invalid API key
        if "api key not valid" in err_msg or "api_key_invalid" in err_msg or "invalid api key" in err_msg or "unauthorized" in err_msg or ("invalid_argument" in err_msg and "key" in err_msg):
            return "Invalid API key"
            
        # Model Unavailable / Not Found (HTTP 503 / 404)
        if "503" in err_msg or "unavailable" in err_msg or "not found" in err_msg or "404" in err_msg:
            return "Model unavailable"
            
        # Internet Connection / Socket Failures
        if "connection" in err_msg or "dns" in err_msg or "timeout" in err_msg or "network" in err_msg or ("http" not in err_msg and ("socket" in err_msg or "host" in err_msg or "getaddrinfo" in err_msg)):
            return "Internet/connection error"
            
        return "Unknown/other Gemini error"

    def _log_exception(self, context: str, e: Exception, category: str):
        """Prints exact exception, type, value, and stack trace to stderr."""
        try:
            print(f"\n--- [GEMINI API EXCEPTION IN {context.upper()}] ---", file=sys.stderr)
            print(f"Differentiated Category: {category}", file=sys.stderr)
            print(f"Exception Type         : {type(e).__name__}", file=sys.stderr)
            print(f"Exception Value        : {str(e)}", file=sys.stderr)
            print("Stack Trace            :", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            print("----------------------------------------------------\n", file=sys.stderr)
        except Exception as log_err:
            print(f"Error logging exception: {str(log_err)}", file=sys.stderr)

    def _extract_and_parse_json(self, response_text: str) -> dict:
        """Robustly extracts the first balanced JSON object from response_text and parses it."""
        cleaned = response_text.strip()
        
        # Clean markdown code blocks
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        cleaned = cleaned.strip()

        # Try direct JSON parsing
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # Balanced brace matching for extraction
        start_idx = cleaned.find('{')
        if start_idx == -1:
            raise ValueError("No '{' character found in response text.")
        
        brace_count = 0
        end_idx = -1
        for i in range(start_idx, len(cleaned)):
            char = cleaned[i]
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i
                    break
                    
        if end_idx == -1:
            raise ValueError("Could not find matching '}' for JSON object.")
            
        json_candidate = cleaned[start_idx:end_idx + 1]
        try:
            return json.loads(json_candidate)
        except json.JSONDecodeError as decode_err:
            raise ValueError(f"Extracted string could not be parsed as valid JSON: {str(decode_err)}. Candidate: {json_candidate}")

    def generate_question(self, topic: str, difficulty: str = "Medium") -> str:
        """Generates a single randomized interview question based on the selected topic and difficulty."""
        topic_lower = topic.lower()
        diff_lower = difficulty.lower()
        
        # Difficulty guidelines
        if diff_lower == "easy":
            diff_guide = (
                "The difficulty level is EASY. Ask a very simple, beginner-friendly question "
                "about fundamental concepts, simple syntax, or basic ideas. Do not ask for complex "
                "algorithms, mathematical proofs, or advanced language mechanics. Make sure it is "
                "extremely easy and accessible to someone who is just starting to learn."
            )
        elif diff_lower == "hard":
            diff_guide = (
                "The difficulty level is HARD. Focus on advanced conceptual complexities, micro-optimizations, "
                "low-level interpreter behavior, system architecture design, structural design patterns, and rare edge cases."
            )
        else:
            diff_guide = (
                "The difficulty level is MEDIUM. Focus on intermediate concepts, practical real-world scenario-based questions, "
                "typical developer debugging/refactoring challenges, and standard algorithmic problem-solving."
            )

        # Variety categories to ensure unique questions across sessions
        if diff_lower == "easy":
            python_subtopics = [
                "variables and basic data types (strings, integers, floats, booleans)",
                "conditional flow control using simple if, elif, and else statements",
                "simple for and while loops, including break and continue keywords",
                "defining simple functions with basic parameters and return values",
                "basic list operations like indexing, appending elements, and simple slicing",
                "basic dictionary usage (adding keys, retrieving values, and key-value mapping)",
                "simple string methods like upper(), lower(), split(), and find()",
                "handling simple input/output or basic file reading",
                "simple exception handling using try/except blocks"
            ]
            dsa_subtopics = [
                "what is an array or list and how to find the largest or smallest element in it",
                "simple string actions like reversing a word or checking if it is a palindrome",
                "linear search algorithm: checking elements one-by-one in a list",
                "the basic concept of a stack (LIFO) using a stack of plates analogy",
                "the basic concept of a queue (FIFO) using a line of people waiting analogy",
                "the concept of a linked list (nodes pointing to the next element)",
                "the concept of a binary tree (terminology of parent, child, and root nodes)",
                "simple bubble sort or selection sort concept (comparing and swapping items)",
                "concept of simple search and lookup in data structures"
            ]
            hr_subtopics = [
                "introducing yourself and sharing what motivated you to learn coding",
                "how you work with other peers or classmates on coding tasks",
                "describing a simple program or project you built and what you enjoyed about it",
                "what you do when you run into a bug or error in your code and feel stuck",
                "how you manage your homework or tasks when multiple things are due",
                "sharing how you responded when someone gave you feedback or suggestions on your code"
            ]
        else:
            python_subtopics = [
                "decorator mechanics, closures, and variable scope",
                "generators, iterators, iterables, and the yield keyword",
                "memory management, reference counting, and garbage collection behavior",
                "object-oriented programming, method resolution order (MRO), and dunder methods",
                "the global interpreter lock (GIL) and its impact on multi-threading vs multi-processing",
                "metaclasses, class creators, and creating types dynamically",
                "context managers, the with statement, and __enter__/__exit__ methods",
                "asyncio, coroutines, and event loop mechanics",
                "list comprehensions vs generator expressions memory profiles",
                "built-in data structure implementations (dictionaries, lists, sets) time complexities"
            ]
            
            dsa_subtopics = [
                "arrays, sliding window, and two-pointer strategies",
                "linked lists (singly, doubly, circular) and sentinel nodes",
                "stacks and queues (including priority queues and double-ended queues)",
                "binary trees, binary search trees (BST), and tree balance",
                "heaps (min-heap, max-heap) and heap-sort concepts",
                "graphs, graph representations, and traversals (DFS, BFS)",
                "hashing algorithms, load factors, and collision resolution techniques",
                "recursion, backtracking, and state space pruning",
                "dynamic programming, memoization vs tabulation, and grid/knapsack problems",
                "greedy algorithms, fractional knapsack, and activity selection",
                "sorting algorithms (quicksort, mergesort, heapsort) and stability",
                "binary search and divide-and-conquer strategies"
            ]
            
            hr_subtopics = [
                "handling conflict or disagreement with a peer, manager, or stakeholder",
                "managing a severe project failure, missed deadline, or mistake",
                "mentoring others, exhibiting leadership, or aligning team members",
                "prioritizing tasks under high pressure, tight deadlines, or resource constraints",
                "dealing with ambiguity in design specs or product requirements",
                "learning a complex new technology or domain quickly to solve a problem",
                "receiving and incorporating critical feedback",
                "collaborating with cross-functional teams to deliver a product"
            ]

        if "python" in topic_lower:
            selected_subtopic = random.choice(python_subtopics)
            prompt = (
                "You are a professional technical interviewer conducting a Python programming interview. "
                "Generate exactly ONE random Python interview question. "
                f"{diff_guide} "
                "Avoid repeating common questions. "
                f"For this question, focus specifically on the topic: {selected_subtopic}. "
                "Output ONLY the question text. Do not include any introductory remarks, headings, or markdown code blocks."
            )
        elif "dsa" in topic_lower or "data structures" in topic_lower or "algorithm" in topic_lower:
            selected_subtopic = random.choice(dsa_subtopics)
            prompt = (
                "You are a professional technical interviewer conducting a Data Structures and Algorithms (DSA) interview. "
                "Generate exactly ONE random interview question testing algorithm selection, data structures, or complexity analysis. "
                f"{diff_guide} "
                "Avoid repeating common interview questions. "
                f"For this question, focus specifically on the topic: {selected_subtopic}. "
                "Do NOT ask the candidate to write full code; instead, ask them to explain their conceptual solution or algorithmic logic. "
                "Output ONLY the question text. Do not include any introductory remarks, headings, or markdown code blocks."
            )
        elif "hr" in topic_lower:
            selected_subtopic = random.choice(hr_subtopics)
            prompt = (
                "You are a professional HR interviewer conducting a behavioral interview. "
                "Generate exactly ONE random behavioral interview question. "
                f"{diff_guide} "
                "Avoid repeating the same STAR questions. "
                f"For this question, focus specifically on the topic: {selected_subtopic}. "
                "Ensure the question is designed to be answered using the STAR method. "
                "Output ONLY the question text. Do not include any introductory remarks, headings, or markdown code blocks."
            )
        else:
            prompt = (
                f"Generate exactly one professional interview question about {topic}. "
                f"{diff_guide} "
                f"Select a random focus subtopic (random seed: {random.randint(1, 1000000)}). "
                "Output ONLY the question text."
            )

        try:
            response = self._generate_content_with_fallback(
                contents=prompt,
                temperature=1.0
            )
            question_text = response.text.strip() if response.text else ""
            if not question_text:
                raise ValueError("Gemini returned empty response text.")
            return question_text
        except Exception as e:
            category = self._differentiate_gemini_error(e)
            self._log_exception("generate_question", e, category)
            
            # Return static fallback questions ONLY if API is genuinely down/offline
            if category == "Internet/connection error":
                if "python" in topic_lower:
                    return "Explain the difference between a list and a tuple in Python, and when you would use each."
                elif "dsa" in topic_lower:
                    return "How does a hash map resolve collisions under the hood? Explain chaining and open addressing."
                else:
                    return "Describe a time you had a technical disagreement with a team member. How did you resolve it?"
            else:
                raise e

    def evaluate_answer(self, question: str, answer: str) -> dict:
        """Evaluates the candidate's answer and returns score, feedback, and improvement suggestions."""
        prompt = (
            f"Question Asked: {question}\n"
            f"Candidate Answer: {answer}\n\n"
            "Evaluate this response and return score, feedback, and improvement_suggestions using the JSON structure specified."
        )

        gemini_success = False
        try:
            response = self._generate_content_with_fallback(
                contents=prompt,
                system_instruction=EVALUATION_SYSTEM_INSTRUCTION,
                temperature=0.2 # Lower temperature for structured evaluation accuracy
            )
            response_text = response.text.strip() if response.text else ""
            gemini_success = True
            
            # Extract and parse response JSON
            parsed_data = self._extract_and_parse_json(response_text)
            
            # Validate types and values
            score = parsed_data.get("score")
            feedback = parsed_data.get("feedback")
            improvement_suggestions = parsed_data.get("improvement_suggestions")

            # Validate score field
            if score is None:
                raise ValueError("Gemini evaluation response is missing the 'score' field.")
            try:
                score = int(score)
            except (TypeError, ValueError):
                raise ValueError("Evaluation field 'score' must be a valid integer.")
            
            if not (0 <= score <= 100):
                raise ValueError(f"Evaluation field 'score' ({score}) must be an integer between 0 and 100.")

            # Validate feedback and suggestions fields
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
            category = self._differentiate_gemini_error(e)
            
            # If Gemini call succeeded, any format or validation check error is an invalid format error.
            if gemini_success:
                raise ValueError(f"AI evaluation validation failed: {str(e)}")
            
            self._log_exception("evaluate_answer", e, category)
            
            # Return heuristic fallback ONLY if API is genuinely down/offline
            if category == "Internet/connection error":
                word_count = len(answer.split())
                fallback_score = min(40 + word_count // 2, 90)
                
                return {
                    "score": fallback_score,
                    "feedback": (
                        f"Note: Live AI evaluation is unavailable ({category}). "
                        f"Local heuristic evaluation: Your answer has {word_count} words and has been logged. "
                        "Ensure you explain core principles, handle potential boundary errors, and reference execution time complexities."
                    ),
                    "improvement_suggestions": (
                        "Please configure a valid GEMINI_API_KEY in your .env file to enable Gemini-based scoring. "
                        "For locally-practiced answers, consider detailing the architectural trade-offs of this approach."
                    )
                }
            else:
                raise e

    def generate_summary(self, question: str, answer: str, score: int, feedback: str) -> str:
        """Generates a brief summary of the completed interview session."""
        prompt = (
            "Write a single concise paragraph (under 3 sentences) summarizing the candidate's interview session. "
            f"The question asked was: '{question}'. The candidate scored {score}/100. "
            f"The general evaluator feedback was: '{feedback}'."
        )
        try:
            response = self._generate_content_with_fallback(
                contents=prompt
            )
            summary_text = response.text.strip() if response.text else ""
            if not summary_text:
                return f"Interview completed. Candidate scored {score}/100 with general topic understanding."
            return summary_text
        except Exception as e:
            category = self._differentiate_gemini_error(e)
            self._log_exception("generate_summary", e, category)
            
            # Only return fallback summary on connection offline
            if category == "Internet/connection error":
                return f"Interview completed. Candidate scored {score}/100 with general topic understanding."
            else:
                raise e
