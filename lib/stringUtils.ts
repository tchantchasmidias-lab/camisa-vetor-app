/**
 * Normaliza uma string para comparação de busca insensível a acentos e maiúsculas/minúsculas.
 * Ex: "Águia" -> "aguia", "Fênix" -> "fenix", "São João" -> "sao joao", "Terceirão" -> "terceirao"
 */
export function normalizeSearchTerm(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Formata um título para Title Case / Capitalized padrão:
 * - Mantém preposições em minúsculo ('de', 'da', 'do', 'das', 'dos', 'para', 'em', 'com', 'e', 'a', 'o', 'as', 'os', 'por', 'sem', 'no', 'na', 'nos', 'nas', 'um', 'uma', 'ao', 'aos', 'à', 'às')
 * - Preserva siglas técnicas e formatos em maiúsculo (CDR, PDF, PNG, AI, DTF, SVG, EPS, JPG, JPEG, PSD, CMYK, RGB)
 * - Preserva numerais ordinais (ex: 9º, 9ºAno, 3ºA, 1º, 2ª)
 * - Converte palavras em ALL CAPS para Title Case com primeira letra maiúscula
 */
export function formatTitleCase(str: string | undefined | null): string {
  if (!str) return '';

  const preposicoes = new Set([
    'de', 'da', 'do', 'das', 'dos', 'para', 'pra', 'em', 'com', 'e', 'a', 'o', 'as', 'os',
    'por', 'sem', 'no', 'na', 'nos', 'nas', 'um', 'uma', 'uns', 'umas', 'ao', 'aos', 'à', 'às', 'vs'
  ]);

  const siglas = new Set([
    'cdr', 'pdf', 'png', 'ai', 'dtf', 'svg', 'eps', 'jpg', 'jpeg', 'psd', 'cmyk', 'rgb', 'zip', 'rar'
  ]);

  return str
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      // Se for separador isolado (ex: "|", "-", "/", "&")
      if (/^[|/\-–—&]+$/.test(word)) {
        return word;
      }

      // Separa pontuação final se houver (ex: "interclasse,", "vetor:")
      const match = word.match(/^([^a-zA-Z0-9À-ÿºª]*)(.*?)([^a-zA-Z0-9À-ÿºª]*)$/);
      const prefix = match ? match[1] : '';
      const core = match ? match[2] : word;
      const suffix = match ? match[3] : '';

      const cleanCore = core.toLowerCase();

      // Mantém siglas em maiúsculo
      if (siglas.has(cleanCore)) {
        return `${prefix}${core.toUpperCase()}${suffix}`;
      }

      // Preserva ordinais (ex: 9º, 9ºAno, 3ºA, 1º, 2ª)
      if (/^\d+[ºª][a-zA-Z]?$/i.test(core)) {
        return `${prefix}${core}${suffix}`;
      }

      // Mantém preposição em minúsculo se não for a primeira palavra
      if (index > 0 && preposicoes.has(cleanCore)) {
        return `${prefix}${cleanCore}${suffix}`;
      }

      // Formata Title Case
      const capitalized = core.charAt(0).toUpperCase() + core.slice(1).toLowerCase();
      return `${prefix}${capitalized}${suffix}`;
    })
    .join(' ');
}

/**
 * Gera um título de exibição limpo para os cards da vitrine, removendo prefixos repetitivos
 * ("Vetor Camisa", "Arte Camisa Vetor", "Vetor Premium") e sufixos técnicos repetitivos
 * ("| Arte Editável Coreldraw", "- Arte Editável CorelDRAW", "para Estamparia"),
 * preservando o nome original com fallback seguro caso a limpeza resulte vazia.
 */
export function formatDisplayTitle(rawTitle: string | undefined | null): string {
  if (!rawTitle) return '';
  let clean = rawTitle;

  // Remove sufixos comuns repetitivos
  clean = clean.replace(
    /\s*[\|\-:]\s*(ARTE\s+)?(CAT[ÓO]LICA\s+)?(EDIT[ÁA]VEL)?\s*(PARA\s+ESTAMPARIA.*|DESIGN\s+EDIT[ÁA]VEL.*|ESTAMPA\s+EXCLUSIVA.*|COREL(DRAW)?.*|FESTA\s+JUNINA.*|ESCOLAR.*)$/gi,
    ''
  );
  clean = clean.replace(
    /\s*[\|\-:]\s*Arte\s*(Edit[áa]vel)?\s*(Coreldraw|Photoshop|Illustrator|PDF|CDR)?\s*$/gi,
    ''
  );

  // Remove prefixos comuns repetitivos
  clean = clean.replace(
    /^(VETOR\s+PREMIUM(\s+(PARA\s+CAMISA|ARTE\s+CAMISA|CAMISA|PARA))?|VETOR\s+CAMISA|ARTE\s+CAMISA\s+VETOR|ARTE\s+VETOR|ARTE\s+CAMISA|CAMISA\s+VETOR)\s*[:\-]?\s*/gi,
    ''
  );

  clean = clean.trim();
  const result = clean ? formatTitleCase(clean) : formatTitleCase(rawTitle);
  return result || formatTitleCase(rawTitle);
}

