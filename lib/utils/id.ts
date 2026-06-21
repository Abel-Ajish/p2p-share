const ROOM_WORDS = ["amber", "birch", "cobalt", "delta", "ember", "frost", "glade", "harbor", "ion", "jasper", "lol", "lumen", "mesa", "nova", "onyx", "pulse", "quartz", "ridge", "slate", "tundra", "umber", "vapor", "willow", "zephyr"];

export function generateRoomId(): string {
  const a = ROOM_WORDS[Math.floor(Math.random() * ROOM_WORDS.length)];
  const b = ROOM_WORDS[Math.floor(Math.random() * ROOM_WORDS.length)];
  const n = Math.floor(Math.random() * 90 + 10);
  return `${a}-${b}-${n}`;
}

export function generatePeerId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}
