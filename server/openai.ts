import { apiRequest } from '../client/src/lib/queryClient';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

export async function generateCodeSuggestion(code: string, language: string, question?: string) {
  try {
    const prompt = `
You are an AI programming assistant specialized in ${language}. 
Analyze the following code and ${question ? `answer this question: ${question}` : 'provide helpful suggestions for improvement'}.

CODE:
\`\`\`${language}
${code}
\`\`\`

Respond with JSON in this format:
{
  "suggestion": "Brief code suggestion (if applicable)",
  "explanation": "Detailed explanation"
}
`;

    const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "You are an expert programming assistant that helps with code." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Error in OpenAI call:', error);
    return {
      suggestion: "Could not generate suggestion at this time.",
      explanation: "There was an error processing your request."
    };
  }
}

export async function analyzeCode(code: string, language: string) {
  try {
    const prompt = `
Analyze the following ${language} code and provide an in-depth code review. Include:
1. Potential bugs or issues
2. Performance concerns
3. Style and best practices
4. Suggested improvements

CODE:
\`\`\`${language}
${code}
\`\`\`

Respond with JSON in this format:
{
  "analysis": "Detailed code analysis and feedback"
}
`;

    const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "You are an expert code reviewer that provides constructive feedback." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Error in OpenAI code analysis:', error);
    return {
      analysis: "Could not analyze the code at this time due to an error."
    };
  }
}

export async function fixCodeError(code: string, error: string, language: string) {
  try {
    const prompt = `
Fix the following ${language} code that is generating this error:
ERROR: ${error}

CODE:
\`\`\`${language}
${code}
\`\`\`

Respond with JSON in this format:
{
  "fix": "The corrected code with explanation of the fix"
}
`;

    const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "You are an expert programmer that fixes code errors." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Error in OpenAI code fixing:', error);
    return {
      fix: "Could not generate a fix for this error at this time."
    };
  }
}

export async function explainCode(code: string, language: string) {
  try {
    const prompt = `
Explain what the following ${language} code does in simple terms:

\`\`\`${language}
${code}
\`\`\`

Respond with JSON in this format:
{
  "explanation": "Step-by-step explanation of what the code does in simple terms"
}
`;

    const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "You are a programming teacher that excels at explaining code clearly." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Error in OpenAI code explanation:', error);
    return {
      explanation: "Could not generate an explanation at this time."
    };
  }
}
