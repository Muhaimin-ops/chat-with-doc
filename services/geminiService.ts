
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { GoogleGenAI, GenerateContentResponse, Tool, HarmCategory, HarmBlockThreshold, Content } from "@google/genai";
import { UrlContextMetadataItem } from '../types';

// Default env key as fallback
const ENV_API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
let currentKey: string | null = null;

// Model supporting URL context
const MODEL_NAME = "gemini-2.5-flash"; 

const getAiInstance = (): GoogleGenAI => {
  // Check local storage for user-provided key
  const userKey = localStorage.getItem('DOCUMIND_API_KEY');
  const activeKey = userKey || ENV_API_KEY;

  if (!activeKey) {
    console.error("API_KEY is not set. User must provide one in settings.");
    throw new Error("API Key missing. Please add your API Key in Settings.");
  }

  // Re-instantiate if key changed or not initialized
  if (!ai || currentKey !== activeKey) {
    ai = new GoogleGenAI({ apiKey: activeKey });
    currentKey = activeKey;
  }
  return ai;
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const DOCUMIND_SYSTEM_INSTRUCTION = `Refined PRD for "Documind" an expert Technical Documentation Assistant. Your goal is to help developers implement SDKs and APIs by answering questions strictly based on the provided reference material.

CORE DIRECTIVES
1.  **Strict Grounding:** Answer **only** using the provided [CONTEXT]. Do not use outside knowledge.
2.  **No Hallucinations:** If the answer is not in the context, state: *"I cannot find this information in the documentation."* Do not invent parameters or endpoints.
3.  **Code First:** Prioritize code examples. Ensure all code is syntactically correct and uses appropriate Markdown tags (e.g., python, bash).
4.  **Version Awareness:** Pay attention to version numbers in the context. If the user does not specify a version, assume the latest available in the context and note this assumption.

RESPONSE RULES
*   **Citation:** End every response with a reference to the source file or section title found in the context.
    *   *Format:* > Source: [Section Title / File Name]
*   **Style:** Technical, direct, and concise. No conversational filler.
*   **Ambiguity:** If the user's question is vague, ask for clarification regarding the specific language or framework version.

OUTPUT FORMAT
*   **Text:** Clear explanations of logical steps.
*   **Code:** Copy-paste ready snippets with comments explaining complex lines.
*   **Links:** If a URL is present in the context, provide it as a reference.`;

interface GeminiResponse {
  text: string;
  urlContextMetadata?: UrlContextMetadataItem[];
}

interface StreamYield {
  textChunk: string;
  urlContextMetadata?: UrlContextMetadataItem[];
}

export const generateContentWithUrlContext = async (
  prompt: string,
  urls: string[]
): Promise<GeminiResponse> => {
  try {
    const currentAi = getAiInstance();
    
    let fullPrompt = prompt;
    if (urls.length > 0) {
      const urlList = urls.join('\n');
      fullPrompt = `${prompt}\n\n[CONTEXT] Relevant URLs:\n${urlList}`;
    }

    const tools: Tool[] = [{ urlContext: {} }];
    const contents: Content[] = [{ role: "user", parts: [{ text: fullPrompt }] }];

    const response: GenerateContentResponse = await currentAi.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: { 
        tools: tools,
        safetySettings: safetySettings,
        systemInstruction: DOCUMIND_SYSTEM_INSTRUCTION,
      },
    });

    const text = response.text || "";
    const candidate = response.candidates?.[0];
    let extractedUrlContextMetadata: UrlContextMetadataItem[] | undefined = undefined;

    if (candidate && candidate.urlContextMetadata && candidate.urlContextMetadata.urlMetadata) {
      extractedUrlContextMetadata = candidate.urlContextMetadata.urlMetadata as UrlContextMetadataItem[];
    }
    
    return { text, urlContextMetadata: extractedUrlContextMetadata };

  } catch (error) {
    handleGeminiError(error);
    return { text: "" };
  }
};

export async function* generateContentStreamWithUrlContext(
  prompt: string,
  urls: string[]
): AsyncGenerator<StreamYield, void, unknown> {
  try {
    const currentAi = getAiInstance();

    let fullPrompt = prompt;
    if (urls.length > 0) {
      const urlList = urls.join('\n');
      fullPrompt = `${prompt}\n\n[CONTEXT] Relevant URLs:\n${urlList}`;
    }

    const tools: Tool[] = [{ urlContext: {} }];
    const contents: Content[] = [{ role: "user", parts: [{ text: fullPrompt }] }];

    const responseStream = await currentAi.models.generateContentStream({
      model: MODEL_NAME,
      contents: contents,
      config: {
        tools: tools,
        safetySettings: safetySettings,
        systemInstruction: DOCUMIND_SYSTEM_INSTRUCTION,
      },
    });

    for await (const chunk of responseStream) {
       const textChunk = chunk.text || "";
       
       let urlContextMetadata: UrlContextMetadataItem[] | undefined = undefined;
       if (chunk.candidates?.[0]?.urlContextMetadata?.urlMetadata) {
          urlContextMetadata = chunk.candidates[0].urlContextMetadata.urlMetadata as UrlContextMetadataItem[];
       }

       yield { textChunk, urlContextMetadata };
    }

  } catch (error) {
    handleGeminiError(error);
  }
}

export const getInitialSuggestions = async (urls: string[]): Promise<GeminiResponse> => {
  if (urls.length === 0) {
    return { text: JSON.stringify({ suggestions: ["Add some URLs to get topic suggestions."] }) };
  }
  try {
    const currentAi = getAiInstance();
    const urlList = urls.join('\n');
    
    const promptText = `Based on the content of the following documentation URLs, provide 3-4 concise and actionable questions a developer might ask to explore these documents. These questions should be suitable as quick-start prompts. Return ONLY a JSON object with a key "suggestions" containing an array of these question strings. For example: {"suggestions": ["What are the rate limits?", "How do I get an API key?", "Explain model X."]}

Relevant URLs:
${urlList}`;

    const contents: Content[] = [{ role: "user", parts: [{ text: promptText }] }];

    const response: GenerateContentResponse = await currentAi.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        safetySettings: safetySettings,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    return { text }; 

  } catch (error) {
    console.error("Error calling Gemini API for initial suggestions:", error);
    // Don't throw for suggestions, just return empty
    return { text: JSON.stringify({ suggestions: [] }) };
  }
};

export const identifyRelevantUrls = async (query: string, urls: string[]): Promise<string[]> => {
  if (urls.length === 0) return [];
  if (urls.length <= 3) return urls;

  try {
    const currentAi = getAiInstance();
    const urlList = urls.join('\n');

    const prompt = `You are an expert research assistant.
User Query: "${query}"

Available Sources:
${urlList}

Task: Analyze the user query and identify which of the provided URLs are most likely to contain the answer. 
Return a JSON object with a key "relevant_urls" containing an array of the relevant URL strings.
Select all that apply. If the query is broad, you may select multiple top-level pages.

JSON Response:`;

    const response: GenerateContentResponse = await currentAi.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        safetySettings: safetySettings,
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (parsed.relevant_urls && Array.isArray(parsed.relevant_urls)) {
        return parsed.relevant_urls;
      }
    }
    return urls;
  } catch (error) {
    console.warn("Failed to identify relevant URLs, defaulting to all.", error);
    return urls;
  }
};

export const fetchRelevantUrlsFromSearch = async (topic: string): Promise<string[]> => {
  try {
    const currentAi = getAiInstance();
    
    const prompt = `Find 5 official documentation, authoritative guides, or high-quality source URLs for the following topic: "${topic}".
    
    Instructions:
    1. Use Google Search to find the most relevant and up-to-date sources.
    2. Prioritize official documentation (e.g., docs.python.org, react.dev, etc.).
    3. Return ONLY a JSON object with a single key "urls" containing an array of the 5 best URL strings found.
    4. Do not include any markdown formatting or explanation outside the JSON.
    
    JSON Response:`;

    const response: GenerateContentResponse = await currentAi.models.generateContent({
      model: MODEL_NAME, 
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        safetySettings: safetySettings,
      },
    });

    const text = response.text;
    
    if (text) {
      try {
        let cleanText = text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = cleanText.match(fenceRegex);
        if (match && match[2]) {
          cleanText = match[2].trim();
        }
        
        const parsed = JSON.parse(cleanText);
        if (parsed.urls && Array.isArray(parsed.urls)) {
          return parsed.urls;
        }
      } catch (e) {
        console.error("Failed to parse JSON from search result text", e);
      }
    }

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      const urlsFromChunks: string[] = [];
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) urlsFromChunks.push(chunk.web.uri);
      });
      const unique = Array.from(new Set(urlsFromChunks)).slice(0, 5);
      if (unique.length > 0) return unique;
    }

    return [];
  } catch (error) {
    console.error("Error fetching URLs from search:", error);
    handleGeminiError(error);
    return [];
  }
};

function handleGeminiError(error: unknown) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
      const googleError = error as any; 
      if (googleError.message && (googleError.message.includes("API key not valid") || googleError.message.includes("API Key missing"))) {
         throw new Error("Invalid or Missing API Key. Please check settings.");
      }
      if (googleError.message && googleError.message.includes("quota")) {
        throw new Error("API quota exceeded.");
      }
      throw new Error(`${error.message}`);
    }
    throw new Error("Unknown AI error.");
}
