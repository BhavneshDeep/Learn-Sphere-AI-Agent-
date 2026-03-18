// lib/chatStore.ts
export type ChatMode = "SHORT" | "DETAILED" | "HINT_ONLY"

export interface ChatMessage {
  id: string
  question: string
  answer: string
  mode: ChatMode
  timestamp: string
}

const store: ChatMessage[] = []

export function getAll() {
  return store
}

export function add(msg: ChatMessage) {
  store.push(msg)
  return msg
}

export function deleteAll() {
  store.length = 0
}

export function deleteMany(ids: string[]) {
  const set = new Set(ids)
  for (let i = store.length - 1; i >= 0; i--) {
    if (set.has(store[i].id)) store.splice(i, 1)
  }
}
