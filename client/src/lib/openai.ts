import { apiRequest } from "./queryClient";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

interface CodeAssistantResponse {
  suggestion: string;
  explanation: string;
}

// Function to get programming hints from OpenAI
export async function getCodeSuggestion(
  code: string,
  language: string,
  question?: string
): Promise<CodeAssistantResponse> {
  try {
    const response = await apiRequest("POST", "/api/ai/suggest", {
      code,
      language,
      question,
      model: MODEL,
    });

    return await response.json();
  } catch (error) {
    console.error("OpenAI suggestion error:", error);
    return {
      suggestion: "Unable to generate suggestion at this time.",
      explanation: "There was an error communicating with the AI service.",
    };
  }
}

// Function to analyze code quality
export async function analyzeCode(
  code: string,
  language: string
): Promise<string> {
  try {
    const response = await apiRequest("POST", "/api/ai/analyze", {
      code,
      language,
      model: MODEL,
    });

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    return "Unable to analyze code at this time.";
  }
}

// Function to get quick fixes for common programming errors
export async function getQuickFix(
  code: string,
  error: string,
  language: string
): Promise<string> {
  try {
    const response = await apiRequest("POST", "/api/ai/fix", {
      code,
      error,
      language,
      model: MODEL,
    });

    const data = await response.json();
    return data.fix;
  } catch (error) {
    console.error("OpenAI fix error:", error);
    return "Unable to generate fix at this time.";
  }
}

// Function to explain code snippet
export async function explainCode(
  code: string,
  language: string
): Promise<string> {
  try {
    const response = await apiRequest("POST", "/api/ai/explain", {
      code,
      language,
      model: MODEL,
    });

    const data = await response.json();
    return data.explanation;
  } catch (error) {
    console.error("OpenAI explanation error:", error);
    return "Unable to explain code at this time.";
  }
}
