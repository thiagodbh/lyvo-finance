import { GoogleGenerativeAI } from "@google/generative-ai";
import { getTransactions } from "./mockStore"; 

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Mudamos o nome aqui para o ChatInterface encontrar
export async function processUserCommand(userMessage: string) {
  try {
    const transactions = await getTransactions();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const context = `Você é o assistente do LYVO™. 
    Dados do usuário: ${JSON.stringify(transactions)}.`;

    const result = await model.generateContent([context, userMessage]);
    const response = await result.response;
    return { text: response.text() }; // Retornamos um objeto como o ChatInterface espera
  } catch (error) {
    return { text: "Erro ao processar sua resposta." };
  }
}

// Criamos essas funções vazias apenas para o build passar sem erros
export const executeAction = async () => {};
export const analyzeReceiptImage = async () => ({ text: "Análise de imagem indisponível." });
