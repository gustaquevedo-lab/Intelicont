/**
 * Motor RAG Híbrido Legal para InteliCont.
 * Combina similitud vectorial (nomic-embed-text vía Ollama) con coincidencia léxica/palabras clave.
 * Mantiene compatibilidad con el patrón de Inteliaudit: Score = 0.7 * Coseno + 0.3 * Léxico.
 */

import { NORMATIVAS_PARAGUAY } from "./rag-data";
import { DEFAULT_OLLAMA_URL } from "@/lib/ai-provider";

export interface ResultadoRAG {
  id: string;
  fuente: string;
  categoria: string;
  articulo: string;
  titulo: string;
  contenido: string;
  score: number;
}

/** Calcula similitud coseno entre dos vectores numéricos */
export function similitudCoseno(v1: number[], v2: number[]): number {
  if (!v1 || !v2 || v1.length === 0 || v1.length !== v2.length) return 0.0;
  let dot = 0;
  let norm1 = 0;
  let norm2 = 0;
  for (let i = 0; i < v1.length; i++) {
    dot += v1[i] * v2[i];
    norm1 += v1[i] * v1[i];
    norm2 += v2[i] * v2[i];
  }
  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator <= 0) return 0.0;
  return dot / denominator;
}

/** Normaliza texto para búsqueda léxica (elimina acentos y minúsculas) */
function normalizarTexto(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cache en memoria de embeddings calculados para las normativas */
const embeddingsCache = new Map<string, number[]>();

async function obtenerEmbeddingOllama(texto: string, ollamaUrl?: string): Promise<number[] | null> {
  const url = (ollamaUrl || process.env.OLLAMA_URL || DEFAULT_OLLAMA_URL).replace(/\/$/, "");
  try {
    const res = await fetch(`${url}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "nomic-embed-text",
        prompt: texto.slice(0, 1000),
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { embedding?: number[] };
    return Array.isArray(data.embedding) ? data.embedding : null;
  } catch {
    return null;
  }
}

/** Pre-indexa normativas si hay conexión a Ollama; no bloquea si falla */
export async function precargarEmbeddingsNormativas(ollamaUrl?: string): Promise<number> {
  let cargados = 0;
  for (const item of NORMATIVAS_PARAGUAY) {
    if (!embeddingsCache.has(item.id)) {
      const textoParaEmbedding = `${item.fuente} ${item.categoria} ${item.articulo} ${item.titulo} ${item.contenido}`;
      const emb = await obtenerEmbeddingOllama(textoParaEmbedding, ollamaUrl);
      if (emb) {
        embeddingsCache.set(item.id, emb);
        cargados++;
      }
    }
  }
  return cargados;
}

/**
 * Busca normativas tributarias usando scoring híbrido (vectorial + léxico).
 * @param query Consulta del usuario o concepto legal
 * @param limit Número máximo de resultados a devolver (default: 3)
 * @param categoriaFiltro Opcional: filtro por categoría ("IRE", "IVA", "RG90", etc.)
 * @param ollamaUrl Opcional: URL personalizada de Ollama
 */
export async function buscarNormativas(
  query: string,
  limit: number = 3,
  categoriaFiltro?: string,
  ollamaUrl?: string
): Promise<ResultadoRAG[]> {
  if (!query || !query.trim()) return [];

  const queryNorm = normalizarTexto(query);
  const palabrasQuery = queryNorm.split(" ").filter((p) => p.length >= 3);

  // Intentar obtener embedding de la consulta
  const queryEmb = await obtenerEmbeddingOllama(query, ollamaUrl);

  const items = categoriaFiltro
    ? NORMATIVAS_PARAGUAY.filter((n) => n.categoria.toLowerCase() === categoriaFiltro.toLowerCase())
    : NORMATIVAS_PARAGUAY;

  const candidatos: ResultadoRAG[] = [];

  for (const item of items) {
    // 1. Puntuación vectorial si tenemos embeddings
    let simVec = 0.0;
    if (queryEmb) {
      let itemEmb = embeddingsCache.get(item.id);
      if (!itemEmb) {
        const textoParaEmbedding = `${item.fuente} ${item.categoria} ${item.articulo} ${item.titulo} ${item.contenido}`;
        itemEmb = (await obtenerEmbeddingOllama(textoParaEmbedding, ollamaUrl)) || undefined;
        if (itemEmb) embeddingsCache.set(item.id, itemEmb);
      }
      if (itemEmb) {
        simVec = Math.max(0.0, similitudCoseno(queryEmb, itemEmb));
      }
    }

    // 2. Puntuación léxica complementaria
    const textoCompleto = normalizarTexto(
      `${item.fuente} ${item.categoria} ${item.articulo} ${item.titulo} ${item.contenido} ${item.palabrasClave.join(" ")}`
    );

    let coincidencias = 0;
    for (const p of palabrasQuery) {
      if (textoCompleto.includes(p)) coincidencias++;
    }

    // Coincidencia exacta de palabras clave asigna un boost léxico
    for (const kw of item.palabrasClave) {
      const kwNorm = normalizarTexto(kw);
      if (queryNorm.includes(kwNorm)) coincidencias += 2;
    }

    const simLex = Math.min(1.0, coincidencias / Math.max(1, palabrasQuery.length));

    // 3. Score híbrido (0.7 vector + 0.3 léxico cuando hay vector, sino 1.0 léxico)
    const score = queryEmb ? 0.7 * simVec + 0.3 * simLex : simLex;

    if (score > 0.05) {
      candidatos.push({
        id: item.id,
        fuente: item.fuente,
        categoria: item.categoria,
        articulo: item.articulo,
        titulo: item.titulo,
        contenido: item.contenido,
        score: Math.round(score * 1000) / 1000,
      });
    }
  }

  // Ordenar por score descendente
  candidatos.sort((a, b) => b.score - a.score);
  return candidatos.slice(0, limit);
}
