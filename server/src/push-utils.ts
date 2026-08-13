type ExpoPushMessage = { to: string; title: string; body: string; sound: 'default' };

export function chunkTokens(tokens: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += size) chunks.push(tokens.slice(i, i + size));
  return chunks;
}

export function buildMessages(tokens: string[], title: string, body: string): ExpoPushMessage[] {
  return tokens.map((to) => ({ to, title, body, sound: 'default' as const }));
}
