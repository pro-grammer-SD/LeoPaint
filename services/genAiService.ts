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
  // Fallback to process.env if available (e.g. set via build tools)
  return process.env.API_KEY || null;
};

export const setStoredApiKey = (key: string) => {
  const d = new Date();
  d.setTime(d.getTime() + (365*24*60*60*1000)); // 1 year persistence
  const expires = "expires="+ d.toUTCString();
  document.cookie = "leopaint_api_key=" + key + ";" + expires + ";path=/;SameSite=Strict";
  // Reset instance to ensure new key is used
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
    throw new Error("API Key is missing. Please enter your Google GenAI API Key.");
  }
  
  aiInstance = new GoogleGenAI({ apiKey: key });
  return aiInstance;
};

export const resetAiClient = () => {
  aiInstance = null;
};

const findImagePart = (response: any): string | null => {
   if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64String = part.inlineData.data;
          // Construct the data URL
          return `data:${part.inlineData.mimeType};base64,${base64String}`;
        }
      }
    }
    return null;
}

export const generateImage = async (
  config: GenerationConfig,
  onStatus?: (status: string) => void
): Promise<string> => {
  try {
    if (onStatus) onStatus("Initializing neural pathways...");

    const ai = getAiClient();

    // Use the Nano Banana model (gemini-2.5-flash-image)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: config.prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: config.aspectRatio,
        },
      },
    });

    if (onStatus) onStatus("Decoding visual data...");

    const imageUrl = findImagePart(response);
    if (imageUrl) return imageUrl;

    throw new Error("No visual data received from the model.");
  } catch (error: any) {
    console.error("GenAI Error:", error);
    if (error.message.includes("API Key")) {
         throw new Error("Invalid or missing API Key. Please reset it.");
    }
    throw new Error(error.message || "Failed to synthesize image.");
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

    // Strip the data:image/png;base64, prefix if present for the API call
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    const mimeType = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,/)?.[1] || "image/png";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
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
       config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        },
      },
    });

    if (onStatus) onStatus("Refining details...");

    const imageUrl = findImagePart(response);
    if (imageUrl) return imageUrl;

    throw new Error("Failed to edit image.");
  } catch (error: any) {
    console.error("Edit Error:", error);
    throw new Error(error.message || "Failed to edit image.");
  }
};

export const enhancePrompt = async (currentPrompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Use a text model for prompt enhancement
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert art director. Rewrite the following image prompt to be more descriptive, artistic, and detailed, suitable for a high-quality AI image generator. Keep it under 50 words. Return ONLY the prompt text. 
      
      Original: "${currentPrompt}"`,
    });
    
    return response.text || currentPrompt;
  } catch (error) {
    console.error("Enhance Error:", error);
    return currentPrompt; // Fallback to original if fails
  }
};