import { GoogleGenerativeAI } from "@google/generative-ai";
import { getTransactions, saveTransaction } from "./mockStore"; 

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Mudamos o nome para 'sendMessage' para garantir que o ChatInterface te ouça
export async function sendMessage(userMessage: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
      Você é o LYVO™, assistente financeiro. 
      Se o usuário disser valores e ações (ganhei, recebi, paguei, gastei), você DEVE responder apenas um JSON:
      {
        "isTransaction": true,
        "value": 0.0,
        "type": "INCOME" ou "EXPENSE",
        "description": "descrição",
        "category": "categoria"
      }
      Se for apenas conversa, responda normalmente em Português.
    `;

    const result = await model.generateContent([systemPrompt, userMessage]);
    const aiText = result.response.text().trim();

    // Lógica para salvar se a IA detectar uma transação
    if (aiText.includes("isTransaction")) {
        const jsonString = aiText.replace(/```json|```/g, "").trim();
        const data = JSON.parse(jsonString);

        if (data.isTransaction) {
            await saveTransaction({
                value: data.value,
                type: data.type,
                description: data.description,
                category: data.category
            });
            return `✅ Registrado: ${data.description} (R$ ${data.value})`;
        }
    }

    return aiText; 
  } catch (error) {
    console.error("Erro no Gemini:", error);
    return "Não consegui processar seu pedido. Verifique sua conexão ou a chave da API.";
  }
}

// Exportamos também com o nome antigo caso algum outro arquivo use
export const processUserCommand = sendMessage;
export const executeAction = async () => {};
export const analyzeReceiptImage = async () => ({ text: "Indisponível" });
