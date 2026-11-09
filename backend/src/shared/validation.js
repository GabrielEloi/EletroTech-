import { AppError } from './http.js';

export const invalid = (message) => new AppError(422, message, 'VALIDATION_ERROR');
export const list = (value) => value == null ? [] : Array.isArray(value) ? value : [value];
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza' }).format(new Date());

export function id(value) {
  if (!['number','string'].includes(typeof value)) throw invalid('Identificador inválido.');
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 1) throw invalid('Identificador inválido.');
  return result;
}

export function amount(value, label = 'Valor', { integer = false, positive = false } = {}) {
  if (!['number','string'].includes(typeof value)) throw invalid(`${label} inválido.`);
  if (value == null || String(value).trim() === '') throw invalid(`${label} é obrigatório.`);
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0 || result > (integer ? 2147483647 : 99999999.99) ||
      (integer && !Number.isSafeInteger(result)) || (positive && result === 0)) throw invalid(`${label} inválido.`);
  if (!integer && Math.abs(result * 100 - Math.round(result * 100)) > 0.00001) throw invalid(`${label} deve ter no máximo duas casas decimais.`);
  return result;
}

export function date(value, label = 'Data') {
  const result = String(value ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || result < '2000-01-01' || result > '2099-12-31' ||
      Number.isNaN(Date.parse(result)) || new Date(`${result}T12:00:00Z`).toISOString().slice(0, 10) !== result) throw invalid(`${label} inválida.`);
  return result;
}

export function month(value) {
  const result = String(value ?? '');
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(result)) throw invalid('Mês inválido, use YYYY-MM.');
  return result;
}

export function period(value, type = 'mensal') {
  if (type === 'mensal') return month(value);
  if (type !== 'anual' || !/^20\d{2}$/.test(String(value))) throw invalid('Ano inválido, use YYYY.');
  return String(value);
}

export function periodBounds(reference, type = 'mensal') {
  const validated = period(reference, type);
  const year = Number(validated.slice(0, 4));
  const m = type === 'anual' ? 1 : Number(validated.slice(5, 7));
  const endYear = type === 'anual' || m === 12 ? year + 1 : year;
  const endMonth = type === 'anual' || m === 12 ? 1 : m + 1;
  return [`${year}-${String(m).padStart(2, '0')}-01`, `${endYear}-${String(endMonth).padStart(2, '0')}-01`];
}

export function pageInfo(req) {
  const page = req.query.page == null ? 1 : id(req.query.page);
  const pageSize = req.query.pageSize == null ? 20 : Math.min(100, id(req.query.pageSize));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function text(value, label, max = 255) {
  if (!['number','string'].includes(typeof value)) throw invalid(`${label} é obrigatório.`);
  const result = String(value ?? '').trim();
  if (!result || result.length > max) throw invalid(`${label} é obrigatório e deve ter até ${max} caracteres.`);
  return result;
}
