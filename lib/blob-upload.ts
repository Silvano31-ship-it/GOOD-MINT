// lib/blob-upload.ts — validação compartilhada de upload de arquivo (Vercel Blob).
// Usado pelas rotas de avatar, imagem de post social e documento de pós-venda.

export interface UploadValidation {
  ok: boolean;
  error?: string;
}

export function validateUploadedFile(
  file: File,
  opts: { maxBytes: number; allowedTypes: Set<string> }
): UploadValidation {
  if (!opts.allowedTypes.has(file.type)) {
    return { ok: false, error: "Tipo de arquivo não permitido." };
  }
  if (file.size > opts.maxBytes) {
    return { ok: false, error: `O arquivo deve ter no máximo ${Math.round(opts.maxBytes / (1024 * 1024))} MB.` };
  }
  return { ok: true };
}
