import { GoogleGenAI, Type } from "@google/genai";

// Initialize client with API key from environment, ensuring fresh instance per call
const getClient = () => {
  if (!process.env.API_KEY) return null;
  // Use named parameter directly from process.env as per guidelines
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Gets smart price advice for a ride request using Gemini.
 */
export const getSmartPriceAdvice = async (pickup: string, destination: string, userTarifa: number): Promise<{ advice: string, successProbability: number }> => {
  const ai = getClient();
  if (!ai) return { advice: "Sigue con tu tarifa.", successProbability: 50 };

  try {
    const prompt = `
      Eres el algoritmo de precios de "Zippy". 
      Origen: ${pickup}. Destino: ${destination}. Tarifa propuesta por el usuario: $${userTarifa}.
      Calcula:
      1. Un consejo breve (10 palabras) en español sobre si la tarifa es justa.
      2. Una probabilidad de aceptación (0-100) basada en que $${userTarifa} sea bajo o alto para el mercado.
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
              description: 'Breve consejo sobre la tarifa.',
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
    
    // Direct access to .text property (not a method)
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    const data = JSON.parse(text);
    return { advice: data.advice, successProbability: data.prob };
  } catch (error) {
    console.error("AI Price Advice Error:", error);
    return { advice: "Los conductores están activos, intenta esta tarifa.", successProbability: 75 };
  }
};

/**
 * Handles chat interactions with the Zippy AI assistant.
 */
export const chatWithZippy = async (message: string, history: any[]): Promise<string> => {
   const ai = getClient();
   if (!ai) return "Error de conexión.";
   try {
     // Create a chat session with history and system instruction
     const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        history: history,
        config: { systemInstruction: "Eres Zippy, el asistente inteligente de una app de taxis que supera a Uber. Eres amable, eficiente y experto en movilidad urbana. Siempre utiliza el término 'Tarifa' en lugar de 'Oferta' al hablar de precios. Responde en Español." }
     });
     // Using sendMessage for conversational turn
     const result = await chat.sendMessage({ message });
     // Direct access to .text property
     return result.text || "Lo siento, no pude obtener una respuesta.";
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
    // Direct access to .text property
    return response.text || "Reporte inteligente no disponible actualmente.";
  } catch (error) {
    console.error("AI Report Error:", error);
    return "Ocurrió un error al procesar el reporte ejecutivo inteligente.";
  }
};