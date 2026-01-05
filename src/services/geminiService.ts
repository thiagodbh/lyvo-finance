import { GoogleGenerativeAI } from "@google/generative-ai";
import { getTransactions, saveTransaction } from "./mockStore"; 

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export async function processUserCommand(userMessage: string, imageBase64?: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Mantemos a proposta original de inteligência do LYVO™
    const systemPrompt = `
      Você é o LYVO™, assistente de produtividade.
      Sua inteligência deve identificar transações financeiras.
      
      Se o usuário informar um valor (ganhei, recebi, paguei, gastei), responda EXATAMENTE neste formato JSON:
      {
        "success": true,
        "message": "Sua confirmação amigável aqui",
        "data": {
          "action": "ADD_TRANSACTION",
          "transactionDetails": {
            "value": 0.0,
            "type": "INCOME" ou "EXPENSE",
            "category": "categoria",
            "description": "descrição"
          }
        }
      }
      
      Se for apenas conversa, responda:
      { "success": false, "message": "Sua resposta de conversa aqui", "data": { "action": "UNKNOWN" } }
    `;

    const result = await model.generateContent([systemPrompt, userMessage]);
    const aiResponse = result.response.text().trim();
    
    // Limpeza para garantir que o JSON seja lido corretamente
    const jsonClean = aiResponse.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonClean);

    // INTEGRAÇÃO: Se a inteligência identificou o comando, salvamos no Firebase
    if (parsed.success && parsed.data && parsed.data.action === "ADD_TRANSACTION") {
        await saveTransaction(parsed.data.transactionDetails);
    }

    // Retorna exatamente o que o ChatInterface.tsx (linha 80) espera
    return parsed;

  } catch (error) {
    console.error("Erro na integração da inteligência:", error);
    return {
      success: false,
      message: "Tive um erro ao processar. Pode repetir o valor?"
    };
  }
}

export const executeAction = (data: any) => ({ message: "Ação concluída com sucesso." });
export const analyzeReceiptImage = async (img: string) => "Análise indisponível no momento.";
