import { useEffect, useState } from 'react';
import { obterEquipe } from '../api/equipe';
import { Carregando, ErroCarregamento, ListaVazia } from '../components/EstadoLista';
import { mensagemErro } from '../lib/formatters';

export default function EquipePage() {
  const [lista, setLista] = useState([]), [erro, setErro] = useState(''), [carregando, setCarregando] = useState(true);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let ativo = true;
    obterEquipe().then(res => { if (ativo) { setLista(res.data); setErro(''); } }).catch(e => { if (ativo) setErro(mensagemErro(e)); }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [tentativa]);
  return <div className="container"><div className="page-header"><h1>Minha equipe</h1><p>Acompanhe as ordens de serviço dos eletricistas associados a você.</p></div>
    {erro && <ErroCarregamento mensagem={erro} onTentarNovamente={() => { setCarregando(true); setTentativa(t => t + 1); }} />}
    {carregando ? <Carregando /> : <div className="table-responsive"><table className="table table-dark table-bordered table-hover custom-table text-center"><thead><tr><th>Eletricista</th><th>Solicitadas</th><th>Abertas</th><th>Bloqueadas</th><th>Concluídas</th></tr></thead><tbody>{lista.length ? lista.map(e => <tr key={e.id}><td>{e.nome}</td><td>{e.solicitadas}</td><td>{e.abertas}</td><td>{e.bloqueadas}</td><td>{e.fechadas}</td></tr>) : <ListaVazia texto="Nenhum eletricista associado. Solicite ao administrador a definição da equipe." />}</tbody></table></div>}
  </div>;
}
