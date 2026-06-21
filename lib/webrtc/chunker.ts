const FILE_ID_BYTES = 16;
const SEQ_BYTES = 4;
const HEADER_BYTES = FILE_ID_BYTES + SEQ_BYTES;

export function encodeChunk(fileId: string, seq: number, payload: ArrayBuffer): ArrayBuffer {
  const header = new ArrayBuffer(HEADER_BYTES);
  const view = new DataView(header);
  const idBytes = new TextEncoder().encode(fileId.slice(0, FILE_ID_BYTES).padEnd(FILE_ID_BYTES, "\0"));
  const headerBytes = new Uint8Array(header);
  headerBytes.set(idBytes, 0);
  view.setUint32(FILE_ID_BYTES, seq, false);
  const combined = new Uint8Array(HEADER_BYTES + payload.byteLength);
  combined.set(headerBytes, 0);
  combined.set(new Uint8Array(payload), HEADER_BYTES);
  return combined.buffer;
}

export function decodeChunk(buffer: ArrayBuffer): { fileId: string; seq: number; payload: ArrayBuffer } {
  const view = new DataView(buffer);
  const idBytes = new Uint8Array(buffer, 0, FILE_ID_BYTES);
  const fileId = new TextDecoder().decode(idBytes).replace(/\0+$/, "");
  const seq = view.getUint32(FILE_ID_BYTES, false);
  const payload = buffer.slice(HEADER_BYTES);
  return { fileId, seq, payload };
}
