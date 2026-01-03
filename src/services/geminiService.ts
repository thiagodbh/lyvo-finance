import { GoogleGenerativeAI } from "@google/generative-ai";
import { getTransactions } from "./mockStore"; 

// Aqui usamos a chave que você configurou no Netlify
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export async function chatWithGemini(userMessage: string) {
  try {
    const transactions = await getTransactions();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const context = `Você é o assistente do LYVO™, um app de finanças. 
    Dados atuais do usuário: ${JSON.stringify(transactions)}.
    Responda de forma curta e prestativa.`;

    const result = await model.generateContent([context, userMessage]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Erro no Gemini:", error);
    return "Desculpe, tive um problema ao processar sua resposta.";
  }
}
