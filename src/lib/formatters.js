export const moeda = value => Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export function dataBr(value) {
  if (!value) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '—';
}
export const mensagemErro = (error, fallback = 'Não foi possível concluir a operação.') => error.response?.data?.error?.message || error.response?.data?.mensagem || fallback;
export const hoje = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza' }).format(new Date());
