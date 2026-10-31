import type { Repository } from '../../db/connection.js';
import type { ChunkRecord } from '../../types/domain.js';

const PARSER_VERSION = 'text-pages-1';
const CHUNKER_VERSION = 'section-window-1';
const TARGET_WORDS = 500;
const OVERLAP_WORDS = 80;

export async function materializeDocumentChunks(repository: Repository, documentId: string): Promise<ChunkRecord[]> {
  const workspace = await repository.read();
  const document = workspace.documents.find((item) => item.id === documentId && !item.deletedAt);
  if (!document) return [];

  const pages = workspace.pageContents[documentId] ?? {};
  const chunks: ChunkRecord[] = [];
  for (const [pageKey, page] of Object.entries(pages)) {
    const physicalPage = Number(pageKey);
    if (!Number.isInteger(physicalPage) || !page.content.trim()) continue;
    const words = page.content.trim().split(/\s+/);
    const step = Math.max(1, TARGET_WORDS - OVERLAP_WORDS);
    for (let offset = 0, index = 0; offset < words.length; offset += step, index += 1) {
      const content = words.slice(offset, offset + TARGET_WORDS).join(' ');
      chunks.push({
        id: `${document.id}-v${document.activeVersion}-p${physicalPage}-${index}`,
        documentId: document.id,
        caseId: document.caseId,
        ownerId: document.ownerId,
        version: document.activeVersion,
        physicalPage,
        sectionTitle: page.sectionTitle,
        content,
        parserVersion: PARSER_VERSION,
        chunkerVersion: CHUNKER_VERSION,
        createdAt: new Date().toISOString(),
      });
    }
  }
  return chunks;
}

export async function replaceDocumentChunks(repository: Repository, documentId: string, chunks: ChunkRecord[]) {
  const workspace = await repository.read();
  workspace.chunks = workspace.chunks.filter((chunk) => chunk.documentId !== documentId);
  workspace.chunks.push(...chunks);
  await repository.write(workspace);
}
