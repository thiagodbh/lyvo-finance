export async function processUserCommand(userMessage: string, imageBase64?: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
      Você é o LYVO™, assistente financeiro. 
      Sua missão é identificar transações financeiras.
      
      IMPORTANTE: Responda APENAS com o JSON abaixo, sem textos antes ou depois.
      {
        "success": true,
        "message": "Sua confirmação aqui",
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
    `;

    const result = await model.generateContent([systemPrompt, userMessage]);
    const aiResponse = result.response.text().trim();
    
    // TENTATIVA DE EXTRAÇÃO SEGURA DO JSON
    let parsed;
    try {
        // Busca o início { e o fim } para ignorar qualquer texto extra da IA
        const startJson = aiResponse.indexOf('{');
        const endJson = aiResponse.lastIndexOf('}') + 1;
        const jsonString = aiResponse.substring(startJson, endJson);
        parsed = JSON.parse(jsonString);
    } catch (e) {
        // Se a IA não gerou um JSON válido, tratamos como conversa normal
        return {
            success: false,
            message: aiResponse,
            data: { action: 'UNKNOWN' }
        };
    }

    // INTEGRAÇÃO: Se a inteligência identificou o comando, salvamos no Firebase
    if (parsed.success && parsed.data && parsed.data.action === "ADD_TRANSACTION") {
        await saveTransaction(parsed.data.transactionDetails);
    }

    return parsed;

  } catch (error) {
    console.error("Erro na integração:", error);
    return {
      success: false,
      message: "Tive um erro ao acessar o banco de dados. Pode repetir?"
    };
  }
}
