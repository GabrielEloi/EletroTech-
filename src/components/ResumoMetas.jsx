import { moeda } from '../lib/formatters';

export default function ResumoMetas({ metas = [] }) {
  if (!metas.length) return <p className="text-muted mt-3">Nenhuma meta mensal ou anual cadastrada para o período selecionado.</p>;
  return <div className="painel painel-destaque mt-4"><h3 style={{ color: '#FBD814' }}>Acompanhamento de metas</h3><div className="table-responsive"><table className="table table-dark table-bordered text-center"><thead><tr><th>Eletricista</th><th>Período</th><th>OS cumpridas / meta</th><th>Faturamento realizado / meta</th></tr></thead><tbody>{metas.map(m => <tr key={m.id}><td>{m.nome_eletricista}</td><td>{m.tipo_periodo === 'anual' ? 'Anual' : 'Mensal'} · {m.mes_meta}</td><td>{m.qtd_os_meta ? `${m.os_realizadas} / ${m.qtd_os_meta} (${Number(m.progresso_os).toFixed(1)}%)` : '—'}</td><td>{Number(m.vlr_meta) > 0 ? `${moeda(m.faturamento_realizado)} / ${moeda(m.vlr_meta)} (${Number(m.progresso_faturamento).toFixed(1)}%)` : '—'}</td></tr>)}</tbody></table></div></div>;
}
