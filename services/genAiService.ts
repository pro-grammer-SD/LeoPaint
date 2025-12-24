import { GoogleGenAI } from "@google/genai";
import { GenerationConfig } from "../types";

// Initialize the client with the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
