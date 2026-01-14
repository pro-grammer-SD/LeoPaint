import { GoogleGenAI } from "@google/genai";
import { GenerationConfig } from "../types";

// --- Cookie Management ---
export const getStoredApiKey = (): string | null => {
  try {
    const name = "leopaint_api_key=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
  } catch (e) {
    console.warn("Cookie access failed", e);
  }
  return process.env.API_KEY || null;
};

export const setStoredApiKey = (key: string) => {
  const d = new Date();
  d.setTime(d.getTime() + (365*24*60*60*1000)); // 1 year persistence
  const expires = "expires="+ d.toUTCString();
  document.cookie = "leopaint_api_key=" + key + ";" + expires + ";path=/;SameSite=Strict";
  resetAiClient();
};

export const clearStoredApiKey = () => {
  document.cookie = "leopaint_api_key=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  resetAiClient();
};

// --- Client Singleton ---
let aiInstance: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (aiInstance) return aiInstance;
  
  const key = getStoredApiKey();
  if (!key) {
    throw new Error("API_KEY_MISSING");
  }
  
  aiInstance = new GoogleGenAI({ apiKey: key });
  return aiInstance;
};

export const resetAiClient = () => {
  aiInstance = null;
};

const handleApiError = (error: any) => {
  console.error("GenAI API Error:", error);
  
  if (error.message === "API_KEY_MISSING") {
    throw { code: "AUTH_REQUIRED", message: "API Key is missing. Please enter your Google GenAI API Key." };
  }

  // Handle Quota Exhaustion (429)
  if (error.status === 429 || (error.message && error.message.includes("429"))) {
    throw { 
      code: "QUOTA_EXCEEDED", 
      message: "You have exceeded your current API quota. Please wait a moment before trying again.",
      details: error.message || "Quota exhausted"
    };
  }

  // Handle Invalid Key (400/403 often)
  if (error.status === 400 && error.message.includes("API key")) {
    throw {
      code: "INVALID_KEY",
      message: "The provided API Key is invalid.",
      details: error.message
    };
  }

  // Generic Fallback
  throw {
    code: "GENERATION_FAILED",
    message: error.message || "Failed to generate content.",
    details: error
  };
}

export const generateImage = async (
  config: GenerationConfig,
  onStatus?: (status: string) => void
): Promise<string> => {
  try {
    if (onStatus) onStatus("Initializing neural pathways...");
    const ai = getAiClient();

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          role: 'user',
          parts: [{ text: config.prompt }],
        },
      ],
      config: {
        responseModalities: ['IMAGE', 'TEXT'] as any,
        imageConfig: {
          aspectRatio: config.aspectRatio,
        },
      },
    });

    if (onStatus) onStatus("Streaming visual data...");

    let finalImageUrl: string | null = null;
    let accumulatedText = "";

    for await (const chunk of responseStream) {
        // Check for binary image data in the chunk
        const part = chunk.candidates?.[0]?.content?.parts?.[0];
        
        if (part?.inlineData) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            const data = part.inlineData.data;
            finalImageUrl = `data:${mimeType};base64,${data}`;
        }
        
        // Accumulate text if present (e.g. for error messages or descriptions)
        if (chunk.text) {
            accumulatedText += chunk.text;
        }
    }

    if (finalImageUrl) return finalImageUrl;

    // If we received text but no image, treat it as a potential refusal or error message from the model
    if (accumulatedText) {
        console.warn("Model returned text instead of image:", accumulatedText);
        throw new Error(accumulatedText.slice(0, 200) + (accumulatedText.length > 200 ? "..." : ""));
    }

    throw new Error("Model generated no visual data. The prompt might have triggered safety filters.");
  } catch (error: any) {
    handleApiError(error);
    return ""; // Unreachable due to throw
  }
};

export const editImage = async (
  base64Image: string,
  editInstruction: string,
  aspectRatio: string = "1:1",
  onStatus?: (status: string) => void
): Promise<string> => {
  try {
    if (onStatus) onStatus("Analyzing source matrix...");
    const ai = getAiClient();

    // Efficiently strip header for API usage
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    const mimeType = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,/)?.[1] || "image/png";

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType,
              },
            },
            {
              text: editInstruction,
            },
          ],
        },
      ],
       config: {
        responseModalities: ['IMAGE', 'TEXT'] as any,
        imageConfig: {
          aspectRatio: aspectRatio as any,
        },
      },
    });

    if (onStatus) onStatus("Refining details...");

    let finalImageUrl: string | null = null;
    let accumulatedText = "";

    for await (const chunk of responseStream) {
        const part = chunk.candidates?.[0]?.content?.parts?.[0];
        
        if (part?.inlineData) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            const data = part.inlineData.data;
            finalImageUrl = `data:${mimeType};base64,${data}`;
        }
        
        if (chunk.text) {
            accumulatedText += chunk.text;
        }
    }

    if (finalImageUrl) return finalImageUrl;

    if (accumulatedText) {
        console.warn("Model returned text instead of image:", accumulatedText);
        throw new Error(accumulatedText.slice(0, 200));
    }

    throw new Error("Failed to edit image.");
  } catch (error: any) {
    handleApiError(error);
    return "";
  }
};

export const enhancePrompt = async (currentPrompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Using streaming for text response as requested for best practice
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert art director. Rewrite the following image prompt to be more descriptive, artistic, and detailed. Keep it under 50 words. Return ONLY the prompt text. 
      
      Original: "${currentPrompt}"`,
    });
    
    let text = "";
    for await (const chunk of responseStream) {
       text += chunk.text();
    }
    
    return text.trim() || currentPrompt;
  } catch (error) {
    // We swallow enhance errors mostly to not block the user, but logging them is good
    console.warn("Enhance prompt failed", error);
    return currentPrompt;
  }
};