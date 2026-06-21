"use client";

import { useCallback, useRef, useState } from "react";

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

interface DropZoneProps { onFiles: (files: File[]) => void; disabled?: boolean; onWarning?: (msg: string) => void; }

export function DropZone({ onFiles, disabled = false, onWarning }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filterFiles = useCallback((files: File[]): File[] => {
    const valid: File[] = [];
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) onWarning?.(`${oversized.length} file(s) exceed the 2 GB limit and were skipped`);
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE) continue;
      if (f.size === 0) continue;
      valid.push(f);
    }
    return valid;
  }, [onWarning]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    const filtered = filterFiles(files);
    if (filtered.length) onFiles(filtered);
  }, [onFiles, disabled, filterFiles]);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const filtered = filterFiles(files);
    if (filtered.length) onFiles(filtered);
    e.target.value = "";
  }, [onFiles, filterFiles]);

  return (
    <div onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }} onDragLeave={() => setDragging(false)}
      onDrop={handleDrop} onClick={() => !disabled && inputRef.current?.click()} role="button" tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click(); }}
      aria-disabled={disabled}
      className={`group rounded-m3-xl border-2 border-dashed p-10 sm:p-14 text-center cursor-pointer select-none transition-all duration-200 ease-out ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${dragging ? "border-primary bg-primary-container/25 scale-[1.01] shadow-elevation-3" : "border-outline-variant bg-surface-container shadow-elevation-1 hover:border-outline hover:shadow-elevation-2"}`}>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={handleSelect} disabled={disabled} />
      <svg className={`mx-auto mb-3 w-9 h-9 transition-transform duration-200 ${dragging ? "-translate-y-1" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
      </svg>
      <p className="font-display text-base text-on-surface">{disabled ? "Waiting for a peer to connect" : dragging ? "Release to send" : "Drop files to send"}</p>
      <p className="mt-1 text-sm text-on-surface-variant font-body">{disabled ? "Files transfer the moment someone joins this room" : "or click to choose files"}</p>
    </div>
  );
}
