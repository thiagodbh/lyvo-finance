import { db, auth } from './firebase';
import { collection, addDoc, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';

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