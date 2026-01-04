import { GoogleGenerativeAI } from "@google/generative-ai";
import { getTransactions } from "./mockStore"; 

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export async function processUserCommand(userMessage: string) {
  try {
    const transactions = await getTransactions();
    // Usamos o modelo flash que é mais rápido e eficiente para assistentes
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
      Você é o LYVO™, um assistente financeiro de elite, prático e inteligente.
      CONTEXTO DO USUÁRIO:
      - Transações atuais no banco de dados: ${JSON.stringify(transactions)}
      
      SUA MISSÃO:
      1. Se o usuário informar um ganho (ex: "recebi", "ganhei", "entrou"), trate como INCOME.
      2. Se informar um gasto (ex: "gastei", "paguei", "comprei"), trate como EXPENSE.
      3. Se ele pedir resumo ou análise, use os dados do JSON acima para responder valores exatos.
      4. Responda sempre em Português (Brasil), de forma curta e executiva.
      5. Caso o usuário queira cadastrar algo, confirme que entendeu o valor e a categoria, mas avise que você está em modo de leitura por enquanto.
    `;

    // Enviamos o Prompt de Sistema + a mensagem do usuário
    const result = await model.generateContent([systemPrompt, userMessage]);
    const response = await result.response;
    
    // Retornamos exatamente o formato que o ChatInterface.tsx espera para exibir o balão
    return { text: response.text() }; 
  } catch (error) {
    console.error("Erro no Gemini Service:", error);
    return { text: "Tive um problema técnico para analisar seus dados agora. Pode repetir?" };
  }
}

// Mantemos estas para não quebrar o restante do sistema
export const executeAction = async () => {};
export const analyzeReceiptImage = async () => ({ text: "Análise de imagem indisponível no momento." });
