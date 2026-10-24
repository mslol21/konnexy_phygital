import { z } from 'zod';
import { Type, type Schema } from '@google/genai';

/**
 * Sanitiza texto gerado por LLM:
 * 1. Remove quebras de linha (\r, \n, \t) e espaços duplicados
 * 2. Remove caracteres de controle invisíveis (ASCII 0-31 / 127) e aspas envolventes
 * 3. Garante corte seguro em fronteira de palavra caso ultrapasse 140 caracteres
 */
export function sanitizeReviewString(raw: string): string {
  const cleaned = raw
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/^["'“”«»]+|["'“”«»]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (cleaned.length <= 140) {
    return cleaned;
  }

  // Trunca de forma limpa na última palavra antes de 139 caracteres e adiciona ponto final
  const sliced = cleaned.slice(0, 139);
  const lastSpace = sliced.lastIndexOf(' ');
  const safeCut = lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced;
  return `${safeCut.replace(/[.,;!?-]+$/, '')}.`;
}

/**
 * Schema individual de cada opção de resenha:
 * - Aplica sanitização automática via .transform()
 * - Valida estritamente mínimo de 10 e máximo de 140 caracteres
 */
export const SingleReviewOptionSchema = z
  .string()
  .transform(sanitizeReviewString)
  .pipe(
    z
      .string()
      .min(10, { message: 'A resenha deve ter no mínimo 10 caracteres.' })
      .max(140, { message: 'A resenha deve ter no máximo 140 caracteres.' })
  );

/**
 * Schema principal de saída da IA (Contrato estrito com o Frontend)
 * Exige chave `opcoes` contendo exatamente 3 strings validadas e sanitizadas.
 */
export const AiReviewsOutputSchema = z.object({
  opcoes: z
    .array(SingleReviewOptionSchema)
    .length(3, { message: 'O array "opcoes" deve conter exatamente 3 resenhas.' })
});

export type AiReviewsOutput = z.infer<typeof AiReviewsOutputSchema>;

/**
 * Schema de entrada da requisição HTTP enviada pela Micro-Página Pública
 */
export const GenerateReviewsRequestSchema = z.object({
  tenantName: z
    .string()
    .trim()
    .min(2, 'Nome do estabelecimento inválido.')
    .max(80, 'Nome do estabelecimento muito longo.'),
  nicho: z
    .string()
    .trim()
    .min(2, 'Nicho inválido.')
    .max(60, 'Nicho muito longo.')
    .default('Comércio Local'),
  rating: z.number().int().min(4).max(5).default(5),
  tags: z
    .array(z.string().trim().min(2).max(45))
    .min(1, 'Selecione ao menos 1 tag de elogio.')
    .max(6, 'Máximo de 6 tags permitidas.')
});

export type GenerateReviewsRequest = z.infer<typeof GenerateReviewsRequestSchema>;

/**
 * Resposta enriquecida da API para o cliente (inclui metadados de telemetria sem quebrar o contrato)
 */
export interface GenerateReviewsApiResponse extends AiReviewsOutput {
  meta: {
    source: 'gemini-ai' | 'static-fallback';
    attempts: number;
    latencyMs: number;
  };
}

/**
 * Schema binário nativo do SDK @google/genai (Constrained Decoding)
 * Espelha exatamente o AiReviewsOutputSchema do Zod.
 */
export const GEMINI_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  description: 'Objeto contendo exatamente 3 opções de resenhas curtas para o Google Maps.',
  properties: {
    opcoes: {
      type: Type.ARRAY,
      description:
        'Lista com exatamente 3 strings. Cada string deve ter entre 10 e 140 caracteres, sem quebras de linha.',
      items: {
        type: Type.STRING
      }
    }
  },
  required: ['opcoes']
};

/**
 * Gerador determinístico de Fallback Gracioso baseado no nicho e tags do banco.
 * Passa pela mesma validação Zod (AiReviewsOutputSchema) garantindo 100% de conformidade (10-140 chars).
 */
export function buildNicheFallbackReviews(
  input: Pick<GenerateReviewsRequest, 'tenantName' | 'nicho' | 'tags'>
): AiReviewsOutput {
  const { tenantName, nicho, tags } = input;
  const primaryTag = (tags[0] || 'atendimento excelente').toLowerCase();
  const secondaryTag = (tags[1] || 'qualidade impecável').toLowerCase();
  const shortName = tenantName.slice(0, 32).trim();
  const shortNicho = nicho.slice(0, 28).toLowerCase().trim();

  const rawCandidates = [
    `Excelente experiência em ${shortName}! Destaque para ${primaryTag}. Recomendo muito!`,
    `Melhor ${shortNicho} da região! Adorei ${primaryTag} e ${secondaryTag}. Nota 10!`,
    `Atendimento impecável em ${shortName}. ${tags.slice(0, 2).join(' e ')} fizeram a diferença!`
  ];

  return AiReviewsOutputSchema.parse({
    opcoes: rawCandidates
  });
}
