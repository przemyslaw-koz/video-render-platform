export type ReadUploadJsonResult =
  | { ok: true; text: string; json: unknown }
  | { ok: false };

export const readUploadJson = async (file: File): Promise<ReadUploadJsonResult> => {
  const text = await file.text();

  try {
    return { ok: true, text, json: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
};
