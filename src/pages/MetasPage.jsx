import { useCallback, useEffect, useState } from 'react';
import * as api from '../api/metas';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Carregando, ErroCarregamento, ListaVazia } from '../components/EstadoLista';
import { useNotificacao } from '../context/NotificacaoContext';
import { useAuth } from '../context/auth-store';
import { hoje, moeda, mensagemErro } from '../lib/formatters';

function MetaProgresso({ realizado, meta, percentual, dinheiro = false }) {
  if (!meta) return <span>—</span>;
  const format = dinheiro ? moeda : value => Number(value).toLocaleString('pt-BR');
  return <div>{format(realizado)} / {format(meta)}<div className="progress mt-1" style={{ height: 6 }}><div className="progress-bar bg-warning" style={{ width: `${Math.min(100, percentual || 0)}%` }} /></div><small>{Number(percentual || 0).toFixed(1)}%</small></div>;
}

export default function MetasPage() {
  const { ehAdmin, ehSupervisor, ehEletricista } = useAuth();
  const podeGerenciar = ehAdmin || ehSupervisor;
  const { notificar } = useNotificacao();
  const [metas, setMetas] = useState([]), [eletricistas, setEletricistas] = useState([]);
  const [carregando, setCarregando] = useState(true), [erro, setErro] = useState('');
  const [filtros, setFiltros] = useState({ filtro_eletricista: '', tipo_periodo: '', periodo: '' });
  const [aplicados, setAplicados] = useState({}), [pagina, setPagina] = useState(1);
  const [form, setForm] = useState(null), [salvando, setSalvando] = useState(false);
  const carregar = useCallback(async () => {
    setCarregando(true); setErro('');
    try { const { data } = await api.listarMetas(aplicados); setMetas(data); }
    catch (e) { setErro(mensagemErro(e, 'Não foi possível carregar as metas.')); }
    finally { setCarregando(false); }
  }, [aplicados]);
  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    if (podeGerenciar) api.opcoesMetas().then(res => setEletricistas(res.data)).catch(e => setErro(mensagemErro(e)));
  }, [podeGerenciar]);

  async function salvar(e) {
    e.preventDefault(); setSalvando(true);
    try {
      if (form.id) await api.editarMeta(form); else await api.cadastrarMeta(form);
      notificar('Meta salva.'); setForm(null); await carregar();
    } catch (err) { notificar(mensagemErro(err), 'erro'); }
    finally { setSalvando(false); }
  }
  async function excluir(id) {
    if (!window.confirm('Excluir esta meta?')) return;
    try { await api.excluirMeta(id); notificar('Meta excluída.'); setPagina(1); await carregar(); }
    catch (e) { notificar(mensagemErro(e), 'erro'); }
  }
  function nova() { setForm({ eletricista_meta: '', tipo_periodo: 'mensal', mes_meta: hoje().slice(0, 7), qtd_os_meta: '', vlr_meta: '' }); }

  return <div className="container">
    <div className="page-header"><h1>Metas</h1><p>{ehEletricista ? 'Consulte suas metas mensais e anuais de OS e faturamento.' : 'Metas mensais e anuais de OS e faturamento por eletricista.'}</p></div>
    {podeGerenciar && <div id="acoes_id"><button onClick={nova}><i className="fa-solid fa-plus" /> Nova Meta</button></div>}
    <form className="filtro-mes justify-content-center" onSubmit={e => { e.preventDefault(); setPagina(1); setAplicados({ ...filtros }); }}>
      {podeGerenciar && <div><label>Eletricista</label><select className="form-select" value={filtros.filtro_eletricista} onChange={e => setFiltros({ ...filtros, filtro_eletricista: e.target.value })}><option value="">{ehSupervisor ? 'Todos da minha equipe' : 'Todos os Eletricistas'}</option>{eletricistas.map(el => <option key={el.id} value={el.id}>{el.nome}</option>)}</select></div>}
      <div><label>Periodicidade</label><select className="form-select" value={filtros.tipo_periodo} onChange={e => setFiltros({ ...filtros, tipo_periodo: e.target.value, periodo: '' })}><option value="">Mensais e anuais</option><option value="mensal">Mensal</option><option value="anual">Anual</option></select></div>
      {filtros.tipo_periodo && <div><label>{filtros.tipo_periodo === 'anual' ? 'Ano' : 'Mês'}</label><input className="form-control" type={filtros.tipo_periodo === 'anual' ? 'number' : 'month'} min={filtros.tipo_periodo === 'anual' ? 2000 : '2000-01'} max={filtros.tipo_periodo === 'anual' ? 2099 : '2099-12'} value={filtros.periodo} onChange={e => setFiltros({ ...filtros, periodo: e.target.value })} /></div>}
      <div><button className="btn btn-outline-warning">Filtrar</button><button type="button" className="btn btn-outline-secondary ms-2" onClick={() => { setFiltros({ filtro_eletricista: '', tipo_periodo: '', periodo: '' }); setAplicados({}); setPagina(1); }}>Limpar</button></div>
    </form>
    <p className="text-muted small mt-3">O realizado considera as OS fechadas e o valor dos serviços pela data de fechamento. Metas mensais e anuais são acompanhadas separadamente.</p>
    {erro && <ErroCarregamento mensagem={erro} onTentarNovamente={carregar} />}
    {carregando ? <Carregando texto="Carregando metas..." /> : <>
      <div className="table-responsive"><table className="table table-dark table-bordered table-hover custom-table text-center">
        <thead><tr>{podeGerenciar && <th>Ações</th>}<th>Eletricista</th><th>Periodicidade</th><th>Período</th><th>OS cumpridas / meta</th><th>Faturamento realizado / meta</th></tr></thead>
        <tbody>{metas.length ? metas.slice((pagina - 1) * 10, pagina * 10).map(m => <tr key={m.id}>
          {podeGerenciar && <td><button className="btn btn-sm btn-outline-warning me-2" onClick={() => setForm({ ...m, qtd_os_meta: m.qtd_os_meta ?? '', vlr_meta: Number(m.vlr_meta) || '' })}>Editar</button><button className="btn btn-sm btn-outline-danger" onClick={() => excluir(m.id)}>Excluir</button></td>}
          <td>{m.nome_eletricista}</td><td>{m.tipo_periodo === 'anual' ? 'Anual' : 'Mensal'}</td><td>{m.mes_meta}</td>
          <td><MetaProgresso realizado={m.os_realizadas} meta={m.qtd_os_meta} percentual={m.progresso_os} /></td><td><MetaProgresso realizado={m.faturamento_realizado} meta={Number(m.vlr_meta)} percentual={m.progresso_faturamento} dinheiro /></td>
        </tr>) : <ListaVazia texto="Nenhuma meta encontrada para os filtros selecionados." />}</tbody>
      </table></div><Pagination totalRows={metas.length} page={pagina} porPagina={10} onChange={setPagina} />
    </>}
    {podeGerenciar && <Modal aberto={!!form} onFechar={() => !salvando && setForm(null)} titulo={form?.id ? 'Editar Meta' : 'Cadastrar Meta'}>
      {form && <form className="eletrotech-form" onSubmit={salvar}>
        <label>Eletricista</label>{form.id ? <p>{form.nome_eletricista}</p> : <select required value={form.eletricista_meta} onChange={e => setForm({ ...form, eletricista_meta: e.target.value })}><option value="">Selecione um eletricista ativo...</option>{eletricistas.map(el => <option key={el.id} value={el.id}>{el.nome}</option>)}</select>}
        <label>Periodicidade</label><select disabled={!!form.id} value={form.tipo_periodo} onChange={e => setForm({ ...form, tipo_periodo: e.target.value, mes_meta: e.target.value === 'anual' ? hoje().slice(0, 4) : hoje().slice(0, 7) })}><option value="mensal">Mensal</option><option value="anual">Anual</option></select>
        <label>{form.tipo_periodo === 'anual' ? 'Ano de referência' : 'Mês de referência'}</label><input disabled={!!form.id} required type={form.tipo_periodo === 'anual' ? 'number' : 'month'} min={form.tipo_periodo === 'anual' ? 2000 : '2000-01'} max={form.tipo_periodo === 'anual' ? 2099 : '2099-12'} value={form.mes_meta} onChange={e => setForm({ ...form, mes_meta: e.target.value })} />
        <label>Quantidade de OS a cumprir (opcional)</label><input type="number" min="1" step="1" value={form.qtd_os_meta} onChange={e => setForm({ ...form, qtd_os_meta: e.target.value })} />
        <label>Faturamento a realizar em R$ (opcional)</label><input type="number" min="0.01" step="0.01" value={form.vlr_meta} onChange={e => setForm({ ...form, vlr_meta: e.target.value })} />
        <p className="text-muted small">Preencha pelo menos uma das duas metas. Para acompanhar ambas, informe os dois valores.</p>
        <button className="btn-submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar meta'}</button>
      </form>}
    </Modal>}
  </div>;
}
