"use client";

import { useCallback, useRef } from "react";
import { useTransferStore } from "@/store/useTransferStore";
import { CHUNK_SIZE, BUFFER_THRESHOLD, BUFFER_LOW_THRESHOLD } from "@/lib/webrtc/constants";
import { encodeChunk, decodeChunk } from "@/lib/webrtc/chunker";
import { playTransferStart, playTransferComplete } from "@/lib/audioFX";
import type { FileMetaMsg, FileControlMsg } from "@/lib/types";

interface IncomingFile {
  meta: FileMetaMsg;
  chunks: (ArrayBuffer | undefined)[];
  receivedCount: number;
  receivedBytes: number;
}

export function useFileTransfer() {
  const incomingRef = useRef<Map<string, IncomingFile>>(new Map());
  const { startTransfer, setProgress, completeTransfer, failTransfer } = useTransferStore();

  const sendFile = useCallback(
    async (channel: RTCDataChannel, file: File, peerId: string) => {
      if (channel.readyState !== "open") {
        console.warn("Data channel not open; cannot send file");
        return;
      }

      const fileId = Math.random().toString(36).slice(2, 18);
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      const meta: FileMetaMsg = {
        type: "meta",
        fileId,
        name: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
        totalChunks,
      };

      channel.send(JSON.stringify(meta));
      startTransfer(fileId, peerId, file.name, file.size, "sending");
      playTransferStart();

      try {
        const buffer = await file.arrayBuffer();
        let offset = 0;
        let seq = 0;
        let bytesSent = 0;

        while (offset < buffer.byteLength) {
          if (channel.bufferedAmount > BUFFER_THRESHOLD) {
            await new Promise<void>((resolve) => {
              const check = () => {
                if (channel.bufferedAmount <= BUFFER_LOW_THRESHOLD) {
                  channel.removeEventListener("bufferedamountlow", check);
                  resolve();
                }
              };
              channel.bufferedAmountLowThreshold = BUFFER_LOW_THRESHOLD;
              channel.addEventListener("bufferedamountlow", check);
            });
          }

          const rawChunk = buffer.slice(offset, offset + CHUNK_SIZE);
          channel.send(encodeChunk(fileId, seq, rawChunk));

          offset += CHUNK_SIZE;
          bytesSent += rawChunk.byteLength;
          seq++;

          setProgress(fileId, Math.round((seq / totalChunks) * 100), bytesSent);
        }

        const endMsg: FileControlMsg = { type: "end", fileId };
        channel.send(JSON.stringify(endMsg));
        completeTransfer(fileId);
        playTransferComplete();
      } catch (err) {
        console.error("File send failed", err);
        failTransfer(fileId);
      }
    },
    [startTransfer, setProgress, completeTransfer, failTransfer]
  );

  const handleIncomingMessage = useCallback(
    async (event: MessageEvent, peerId: string) => {
      if (typeof event.data === "string") {
        const msg: FileControlMsg = JSON.parse(event.data);

        if (msg.type === "meta") {
          incomingRef.current.set(msg.fileId, {
            meta: msg,
            chunks: new Array(msg.totalChunks),
            receivedCount: 0,
            receivedBytes: 0,
          });
          startTransfer(msg.fileId, peerId, msg.name, msg.size, "receiving");
          playTransferStart();
          return;
        }

        if (msg.type === "end") {
          const entry = incomingRef.current.get(msg.fileId);
          if (!entry) return;

          const blobParts: ArrayBuffer[] = [];
          for (let i = 0; i < entry.meta.totalChunks; i++) {
            if (entry.chunks[i] !== undefined) {
              blobParts.push(entry.chunks[i]!);
            }
          }
          const blob = new Blob(blobParts, { type: entry.meta.mime });
          triggerDownload(blob, entry.meta.name);

          completeTransfer(msg.fileId);
          playTransferComplete();
          incomingRef.current.delete(msg.fileId);
          return;
        }

        return;
      }

      let raw: ArrayBuffer;
      if (event.data instanceof ArrayBuffer) {
        raw = event.data;
      } else if (event.data instanceof Blob) {
        raw = await event.data.arrayBuffer();
      } else if (event.data?.buffer instanceof ArrayBuffer) {
        raw = event.data.buffer;
      } else {
        return;
      }
      const { fileId, seq, payload } = decodeChunk(raw);
      const entry = incomingRef.current.get(fileId);
      if (!entry) return;

      if (entry.chunks[seq] === undefined) {
        entry.chunks[seq] = payload;
        entry.receivedCount++;
        entry.receivedBytes += payload.byteLength;
        setProgress(
          fileId,
          Math.round((entry.receivedCount / entry.meta.totalChunks) * 100),
          entry.receivedBytes
        );
      }
    },
    [startTransfer, setProgress, completeTransfer]
  );

  return { sendFile, handleIncomingMessage };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
