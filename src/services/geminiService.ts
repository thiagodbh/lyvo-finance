import { GoogleGenerativeAI } from "@google/generative-ai";
import { getTransactions, saveTransaction } from "./mockStore"; 

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export async function processUserCommand(userMessage: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Instrução mestre para a IA sempre tentar salvar transações
    const systemPrompt = `
      Você é o LYVO™, um assistente financeiro.
      Sua principal função é identificar registros financeiros nas frases do usuário.
      
      Regras de Extração:
      - Se o usuário disser algo de valor positivo (ganhei, recebi, salário), use type: "INCOME".
      - Se for um gasto (paguei, comprei, gastei), use type: "EXPENSE".
      
      Sua resposta deve ser EXATAMENTE um JSON no formato abaixo, e NADA MAIS:
      {
        "isTransaction": true,
        "value": 0.0,
        "type": "INCOME" ou "EXPENSE",
        "description": "descrição curta",
        "category": "categoria sugerida"
      }
      
      Se a frase NÃO for um registro financeiro, responda apenas com texto normal de conversa.
    `;

    const result = await model.generateContent([systemPrompt, userMessage]);
    const aiText = result.response.text().trim();

    // Verificamos se a IA retornou um JSON para salvar
    if (aiText.includes("{") && aiText.includes("isTransaction")) {
        // Limpamos o texto caso a IA coloque blocos de código ```json
        const jsonString = aiText.replace(/```json|```/g, "").trim();
        const data = JSON.parse(jsonString);

        if (data.isTransaction) {
            // Chamamos sua função do mockStore que você enviou
            await saveTransaction({
                value: data.value,
                type: data.type,
                description: data.description,
                category: data.category
            });
            return { text: `✅ Entendido! Salvei seu registro de R$ ${data.value} em "${data.description}".` };
        }
    }

    return { text: aiText }; 
  } catch (error) {
    console.error("Erro no processamento:", error);
    return { text: "Consegui entender seu pedido, mas tive um erro ao salvar no banco de dados." };
  }
}

export const executeAction = async () => {};
export const analyzeReceiptImage = async () => ({ text: "Análise de imagem indisponível." });
