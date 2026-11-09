import { useCallback, useEffect, useState } from 'react';
import * as api from '../api/supervisores';
import Modal from '../components/Modal';
import { Carregando, ErroCarregamento, ListaVazia } from '../components/EstadoLista';
import { useNotificacao } from '../context/NotificacaoContext';
import { mensagemErro } from '../lib/formatters';

export default function SupervisoresPage() {
  const { notificar } = useNotificacao();
  const [dados, setDados] = useState({ supervisores: [], eletricistasAtivos: [] });
  const [carregando, setCarregando] = useState(true), [erro, setErro] = useState('');
  const [form, setForm] = useState(null), [equipe, setEquipe] = useState(null), [ids, setIds] = useState([]);
  const [transferir, setTransferir] = useState(false), [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true); setErro('');
    try { const { data } = await api.listarSupervisores(); setDados(data); }
    catch (e) { setErro(mensagemErro(e, 'Não foi possível carregar os supervisores.')); }
    finally { setCarregando(false); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  async function salvarLogin(e) {
    e.preventDefault(); setSalvando(true);
    try {
      if (form.id) await api.editarSupervisor(form.id, form);
      else await api.criarSupervisor(form);
      notificar(form.id ? 'Supervisor atualizado.' : 'Supervisor criado. Use Associar eletricistas para montar a equipe.');
      setForm(null); await carregar();
    } catch (err) { notificar(mensagemErro(err), 'erro'); }
    finally { setSalvando(false); }
  }
  function abrirEquipe(supervisor) {
    setEquipe(supervisor);
    setIds(supervisor.equipe.filter(e => !e.data_demissao).map(e => Number(e.id)));
    setTransferir(false);
  }
  async function salvarEquipe(e) {
    e.preventDefault(); setSalvando(true);
    try {
      await api.salvarEquipe(equipe.id, ids, transferir);
      notificar('Equipe atualizada.'); setEquipe(null); await carregar();
    } catch (err) { notificar(mensagemErro(err), 'erro'); }
    finally { setSalvando(false); }
  }

  return <div className="container">
    <div className="page-header"><h1>Supervisores</h1><p>Crie os acessos de supervisão e defina os eletricistas de cada equipe.</p></div>
    <div id="acoes_id"><button type="button" onClick={() => setForm({ usuario: '', senha: '' })}><i className="fa-solid fa-plus" /> Novo Supervisor</button></div>
    {erro && <ErroCarregamento mensagem={erro} onTentarNovamente={carregar} />}
    {carregando ? <Carregando /> : <div className="table-responsive"><table className="table table-dark table-hover table-bordered custom-table text-center">
      <thead><tr><th>Ações</th><th>Usuário</th><th>Eletricistas associados</th><th>Equipe</th></tr></thead>
      <tbody>{dados.supervisores.length ? dados.supervisores.map(s => <tr key={s.id}>
        <td><button className="btn btn-sm btn-outline-warning me-2" onClick={() => setForm({ id: s.id, usuario: s.usuario, senha: '' })}>Editar login</button><button className="btn btn-sm btn-outline-light" onClick={() => abrirEquipe(s)}>Associar eletricistas</button></td>
        <td>{s.usuario}</td><td>{s.equipe.length}</td><td>{s.equipe.map(e => e.nome).join(', ') || 'Sem eletricistas associados'}</td>
      </tr>) : <ListaVazia texto="Nenhum supervisor cadastrado." />}</tbody>
    </table></div>}
    <Modal aberto={!!form} onFechar={() => !salvando && setForm(null)} titulo={form?.id ? 'Editar Supervisor' : 'Novo Supervisor'}>
      {form && <form className="eletrotech-form" onSubmit={salvarLogin}>
        <label htmlFor="supervisor-usuario">Usuário</label><input id="supervisor-usuario" required maxLength={50} autoComplete="off" value={form.usuario} onChange={e => setForm({ ...form, usuario: e.target.value })} />
        <label htmlFor="supervisor-senha">{form.id ? 'Nova senha (opcional)' : 'Senha de acesso'}</label><input id="supervisor-senha" type="password" autoComplete="new-password" required={!form.id} minLength={8} maxLength={72} value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} />
        <p className="text-muted">Acesso a Dashboard, OS, Metas e Checklists. Os dados operacionais são limitados aos eletricistas associados.</p>
        <button className="btn-submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar supervisor'}</button>
      </form>}
    </Modal>
    <Modal aberto={!!equipe} onFechar={() => !salvando && setEquipe(null)} titulo={`Equipe de ${equipe?.usuario || ''}`}>
      <form onSubmit={salvarEquipe}>
        <p>Selecione os eletricistas ativos. Cada eletricista possui um supervisor responsável.</p>
        <div className="equipe-lista">{dados.eletricistasAtivos.map(e => <label className="equipe-opcao" key={e.id}>
          <input type="checkbox" checked={ids.includes(Number(e.id))} onChange={() => setIds(current => current.includes(Number(e.id)) ? current.filter(i => i !== Number(e.id)) : [...current, Number(e.id)])} />
          <span>{e.nome}<small className="d-block text-muted">{e.supervisor ? `Supervisor atual: ${e.supervisor}` : 'Sem supervisor'}</small></span>
        </label>)}{!dados.eletricistasAtivos.length && <p>Nenhum eletricista ativo disponível.</p>}</div>
        <label className="equipe-opcao mt-3"><input type="checkbox" checked={transferir} onChange={e => setTransferir(e.target.checked)} /><span>Permitir transferir os selecionados que pertencem a outro supervisor.</span></label>
        <p className="text-muted small">Ao transferir ou desmarcar um eletricista, o supervisor anterior perde imediatamente o acesso aos dados dele.</p>
        <button className="btn btn-warning w-100" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar equipe'}</button>
      </form>
    </Modal>
  </div>;
}
