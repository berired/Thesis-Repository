// The Web NFC API is not in TypeScript's DOM types yet. Only what the app uses is declared.
// It works in Chrome on Android over HTTPS; no other browser has it.

interface NDEFRecordLike {
  recordType: string;
  mediaType?: string;
  encoding?: string;
  data?: DataView;
}

interface NDEFReadingEventLike extends Event {
  serialNumber: string;
  message: { records: readonly NDEFRecordLike[] };
}

declare class NDEFReader extends EventTarget {
  constructor();
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  write(
    message: string | { records: { recordType: string; data: string }[] },
    options?: { overwrite?: boolean; signal?: AbortSignal },
  ): Promise<void>;
  makeReadOnly?(options?: { signal?: AbortSignal }): Promise<void>;
}
