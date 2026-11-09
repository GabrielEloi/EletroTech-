import Modal from './Modal';
import { dataBr, moeda } from '../lib/formatters';

export default function Relatorio({ aberto, onFechar, titulo, children }) {
  return <Modal aberto={aberto} onFechar={onFechar} titulo={titulo} tamanho="modal-xl">
    <div className="relatorio-impressao"><h2>{titulo}</h2>{children}</div>
    <button className="btn btn-warning mt-3 sem-impressao" onClick={() => window.print()}><i className="fa-solid fa-print" /> Imprimir / Salvar PDF</button>
  </Modal>;
}

export function TabelaMovimentacoes({ itens }) {
  const entradas = itens.filter(m => m.tipo === 'entrada').reduce((total, m) => total + Number(m.quantidade) * Number(m.valor_unitario), 0);
  const saidas = itens.filter(m => m.tipo === 'saida').reduce((total, m) => total + Number(m.quantidade) * Number(m.valor_unitario), 0);
  return <><div className="table-responsive"><table className="table table-dark table-bordered text-center"><thead><tr><th>Data</th><th>Material</th><th>Tipo</th><th>Quantidade</th><th>Valor unitário</th><th>Total</th><th>Origem</th></tr></thead><tbody>{itens.map(m => <tr key={m.id}><td>{dataBr(m.data_mov || m.data_baixa)}</td><td>{m.nome_produto}</td><td>{m.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td><td>{m.quantidade}</td><td>{moeda(m.valor_unitario)}</td><td>{moeda(Number(m.quantidade) * Number(m.valor_unitario))}</td><td>{m.origem || '—'}</td></tr>)}</tbody></table></div><p>Entradas: {moeda(entradas)} · Saídas: {moeda(saidas)}</p></>;
}
