import { GoogleGenerativeAI } from "@google/generative-ai";
// Importamos a função de buscar dados reais que você me mostrou
import { getTransactions } from "./mockStore"; 

// Configuramos a chave que você colocou no Netlify
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Esta função agora salva de verdade no seu banco Standard do Firebase
export const saveTransaction = async (transaction: any) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não logado");
  
  return await addDoc(collection(db, 'transactions'), {
    ...transaction,
    userId: user.uid,
    date: new Date().toISOString()
  });
};

// Esta função busca seus dados reais sempre que você abre o app
export const getTransactions = async () => {
  const user = auth.currentUser;
  if (!user) return [];
  
  const q = query(collection(db, 'transactions'), where('userId', '==', user.uid));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
