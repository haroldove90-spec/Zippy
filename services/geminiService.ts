
import { GoogleGenAI, Type } from "@google/genai";

// Initialize client with API key from environment, ensuring fresh instance per call
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

/**
 * Gets smart price advice for a ride request using Gemini.
 */
export const getSmartPriceAdvice = async (pickup: string, destination: string, userOffer: number): Promise<{ advice: string, successProbability: number }> => {
  const ai = getClient();
  if (!ai) return { advice: "Sigue con tu oferta.", successProbability: 50 };

  try {
    const prompt = `
      Eres el algoritmo de precios de "Zippy". 
      Origen: ${pickup}. Destino: ${destination}. Oferta del usuario: $${userOffer}.
      Calcula:
      1. Un consejo breve (10 palabras) en español.
      2. Una probabilidad de aceptación (0-100) basada en que $${userOffer} sea bajo o alto.
    `;
    // Configured responseSchema for more reliable JSON extraction as per guidelines
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: {
              type: Type.STRING,
              description: 'Breve consejo sobre el precio.',
            },
            prob: {
              type: Type.NUMBER,
              description: 'Probabilidad de aceptación del 0 al 100.',
            },
          },
          required: ["advice", "prob"],
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    const data = JSON.parse(text);
    return { advice: data.advice, successProbability: data.prob };
  } catch (error) {
    console.error("AI Price Advice Error:", error);
    return { advice: "Los conductores están activos, intenta esta oferta.", successProbability: 75 };
  }
};

/**
 * Handles chat interactions with the Zippy AI assistant.
 */
export const chatWithZippy = async (message: string, history: any[]): Promise<string> => {
   const ai = getClient();
   if (!ai) return "Error de conexión.";
   try {
     // Fixed: Passing the history to chats.create to maintain conversational state
     const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        history: history,
        config: { systemInstruction: "Eres Zippy, el asistente inteligente de una app de taxis que supera a Uber. Eres amable, eficiente y experto en movilidad urbana. Responde en Español." }
     });
     // Using sendMessage for conversational turn
     const result = await chat.sendMessage({ message });
     // Use .text property directly
     return result.text;
   } catch (error) {
     console.error("AI Chat Error:", error);
     return "Lo siento, mi conexión con el satélite Zippy falló.";
   }
}

/**
 * Generates an executive summary report for the admin dashboard using Gemini.
 */
export const generateAdminReport = async (): Promise<string> => {
  const ai = getClient();
  if (!ai) return "No se pudo conectar con el motor de inteligencia de Zippy.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Genera un reporte ejecutivo breve (máximo 60 palabras) sobre el estado de las operaciones de hoy. Menciona seguridad, eficiencia y satisfacción del conductor. Responde en Español.",
    });
    // Use .text property directly as per guidelines
    return response.text || "Reporte inteligente no disponible actualmente.";
  } catch (error) {
    console.error("AI Report Error:", error);
    return "Ocurrió un error al procesar el reporte ejecutivo inteligente.";
  }
};
