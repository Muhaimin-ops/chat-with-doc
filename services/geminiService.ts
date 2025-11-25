
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { GoogleGenAI, GenerateContentResponse, Tool, HarmCategory, HarmBlockThreshold, Content } from "@google/genai";
import { UrlContextMetadataItem } from '../types';

// IMPORTANT: The API key MUST be set as an environment variable `process.env.API_KEY`
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI;

// Model supporting URL context
const MODEL_NAME = "gemini-2.5-flash"; 

const getAiInstance = (): GoogleGenAI => {
  if (!API_KEY) {
    console.error("API_KEY is not set in environment variables. Please set process.env.API_KEY.");
    throw new Error("Gemini API Key not configured. Set process.env.API_KEY.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

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
  const currentAi = getAiInstance();
  
  let fullPrompt = prompt;
  if (urls.length > 0) {
    const urlList = urls.join('\n');
    fullPrompt = `${prompt}\n\nRelevant URLs for context:\n${urlList}`;
  }

  const tools: Tool[] = [{ urlContext: {} }];
  const contents: Content[] = [{ role: "user", parts: [{ text: fullPrompt }] }];

  try {
    const response: GenerateContentResponse = await currentAi.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: { 
        tools: tools,
        safetySettings: safetySettings,
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
    return { text: "" }; // Unreachable due to throw, but satisfies TS
  }
};

export async function* generateContentStreamWithUrlContext(
  prompt: string,
  urls: string[]
): AsyncGenerator<StreamYield, void, unknown> {
  const currentAi = getAiInstance();

  let fullPrompt = prompt;
  if (urls.length > 0) {
    const urlList = urls.join('\n');
    fullPrompt = `${prompt}\n\nRelevant URLs for context:\n${urlList}`;
  }

  const tools: Tool[] = [{ urlContext: {} }];
  const contents: Content[] = [{ role: "user", parts: [{ text: fullPrompt }] }];

  try {
    const responseStream = await currentAi.models.generateContentStream({
      model: MODEL_NAME,
      contents: contents,
      config: {
        tools: tools,
        safetySettings: safetySettings,
      },
    });

    for await (const chunk of responseStream) {
       const textChunk = chunk.text || "";
       
       // Check for metadata in the chunk
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
  const currentAi = getAiInstance();
  const urlList = urls.join('\n');
  
  const promptText = `Based on the content of the following documentation URLs, provide 3-4 concise and actionable questions a developer might ask to explore these documents. These questions should be suitable as quick-start prompts. Return ONLY a JSON object with a key "suggestions" containing an array of these question strings. For example: {"suggestions": ["What are the rate limits?", "How do I get an API key?", "Explain model X."]}

Relevant URLs:
${urlList}`;

  const contents: Content[] = [{ role: "user", parts: [{ text: promptText }] }];

  try {
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
     if (error instanceof Error) {
       // Error handling...
       throw error;
    }
    throw new Error("Failed to get initial suggestions from AI.");
  }
};

export const identifyRelevantUrls = async (query: string, urls: string[]): Promise<string[]> => {
  if (urls.length === 0) return [];
  if (urls.length <= 3) return urls; // If few URLs, just return all of them

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

  try {
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
    // Fallback: return all if parsing fails or structure is wrong
    return urls;
  } catch (error) {
    console.warn("Failed to identify relevant URLs, defaulting to all.", error);
    return urls;
  }
};

export const fetchRelevantUrlsFromSearch = async (topic: string): Promise<string[]> => {
  const currentAi = getAiInstance();
  
  const prompt = `Find 5 official documentation, authoritative guides, or high-quality source URLs for the following topic: "${topic}".
  
  Instructions:
  1. Use Google Search to find the most relevant and up-to-date sources.
  2. Prioritize official documentation (e.g., docs.python.org, react.dev, etc.).
  3. Return ONLY a JSON object with a single key "urls" containing an array of the 5 best URL strings found.
  4. Do not include any markdown formatting or explanation outside the JSON.
  
  JSON Response:`;

  try {
    const response: GenerateContentResponse = await currentAi.models.generateContent({
      model: MODEL_NAME, // gemini-2.5-flash supports googleSearch
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        safetySettings: safetySettings,
      },
    });

    const text = response.text;
    
    // We also look at grounding chunks as a fallback or enhancement, but strict JSON instruction usually works well with 2.5 Flash
    // However, the tool instruction says "If Google Search is used, you MUST ALWAYS extract the URLs from groundingChunks".
    // In this specific helper function case where we want a refined list *generated* by the model based on search, 
    // relying on the model's JSON output is more appropriate for getting the "top 5" selection rather than raw search hits.
    
    if (text) {
      try {
        // Clean markdown fences if present
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
        console.error("Failed to parse JSON from search result", e);
      }
    }

    // Fallback: If JSON parsing fails, try to extract from grounding metadata if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      const urlsFromChunks: string[] = [];
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) urlsFromChunks.push(chunk.web.uri);
      });
      // De-duplicate and return top 5
      return Array.from(new Set(urlsFromChunks)).slice(0, 5);
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
      if (googleError.message && googleError.message.includes("API key not valid")) {
         throw new Error("Invalid API Key. Please check your GEMINI_API_KEY environment variable.");
      }
      if (googleError.message && googleError.message.includes("quota")) {
        throw new Error("API quota exceeded. Please check your Gemini API quota.");
      }
      throw new Error(`Failed to get response from AI: ${error.message}`);
    }
    throw new Error("Failed to get response from AI due to an unknown error.");
}
