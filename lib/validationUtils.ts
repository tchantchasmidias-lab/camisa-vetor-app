/**
 * Sanitização de CPF: apenas números
 */
export const cleanCPF = (cpf: string | undefined | null): string => {
  return (cpf || '').replace(/\D/g, '');
};

/**
 * Sanitização de Telefone: apenas números
 */
export const cleanPhone = (phone: string | undefined | null): string => {
  return (phone || '').replace(/\D/g, '');
};

/**
 * Máscara fluida e não destrutiva para CPF (000.000.000-00)
 */
export const formatCPFMask = (value: string | undefined | null): string => {
  const digits = cleanCPF(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

/**
 * Máscara fluida e não destrutiva para Telefone ((00) 00000-0000 ou (00) 0000-0000)
 */
export const formatPhoneMask = (value: string | undefined | null): string => {
  const digits = cleanPhone(value).slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

/**
 * Validação dos dois dígitos verificadores de CPF
 */
export function isValidCPF(cpf: string | undefined | null): boolean {
  const clean = cleanCPF(cpf);
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false; // Ex: 00000000000, 11111111111...

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(clean.substring(i - 1, i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean.substring(9, 10), 10)) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(clean.substring(i - 1, i), 10) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean.substring(10, 11), 10)) return false;

  return true;
}
