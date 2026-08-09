import OpenAI from 'openai';

let openai;
export function initAI() {
  if (process.env.OPENAI_API_KEY) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
export async function askAI(prompt) {
  if (!openai) return 'AI is not configured. Add OPENAI_API_KEY to the environment.';
  const response = await openai.responses.create({ model: process.env.OPENAI_MODEL || 'gpt-5-mini', input: `You are Infinity Manager, a helpful Discord server assistant. Be concise and never claim to have performed an action you did not perform.\n\nUser request: ${prompt}` });
  return response.output_text || 'I could not generate a response.';
}
