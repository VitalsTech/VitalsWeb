export type ChatMessage = {
  id: string;
  from: 'ai' | 'user' | 'doctor';
  text: string;
};
