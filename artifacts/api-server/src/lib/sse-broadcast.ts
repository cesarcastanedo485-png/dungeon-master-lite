import type { Response } from "express";

interface SSEClient {
  id: string;
  res: Response;
}

const clients: SSEClient[] = [];
let clientIdCounter = 0;

export function addClient(res: Response): string {
  const id = `sse-${++clientIdCounter}`;
  clients.push({ id, res });

  res.on("close", () => {
    removeClient(id);
  });

  return id;
}

function removeClient(id: string) {
  const idx = clients.findIndex((c) => c.id === id);
  if (idx !== -1) clients.splice(idx, 1);
}

export function broadcast(event: Record<string, unknown>) {
  const data = JSON.stringify(event);
  const deadIds: string[] = [];

  for (const client of clients) {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch {
      deadIds.push(client.id);
    }
  }

  for (const id of deadIds) {
    removeClient(id);
  }
}

export function getClientCount(): number {
  return clients.length;
}
