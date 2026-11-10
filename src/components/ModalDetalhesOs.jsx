import { useEffect, useState } from "react";
import FotoOs from "./FotoOs";
import { useAuth } from "../context/auth-store";
import { moeda, mensagemErro } from "../lib/formatters";
import Modal from "./Modal";
import { Carregando } from "./EstadoLista";
import * as osApi from "../api/ordensServico";
import { useNotificacao } from "../context/NotificacaoContext";

const STATUS_BADGE = {
  bloqueada: <span className="badge bg-danger">Bloqueada</span>,
  solicitada: <span className="badge bg-warning text-dark">Solicitada</span>,
  aberta: <span className="badge bg-success">Aberta</span>,
  fechada: <span className="badge bg-secondary">Fechada</span>,
};

export default function ModalDetalhesOs({ idOs, aberto, onFechar }) {
  const { notificar } = useNotificacao();
  const { ehAdmin, ehSupervisor } = useAuth();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [foto, setFoto] = useState(null), [edicao, setEdicao] = useState(null);
  async function salvarEdicao(e) {
    e.preventDefault(); setEnviando(true);
    try { await osApi.editarOrdemServico(idOs,edicao); setEdicao(null); carregar(); notificar('OS atualizada.'); }
    catch (err) { notificar(mensagemErro(err),'erro'); }
    finally { setEnviando(false); }
  }

  function carregar() {
    if (!idOs) return;
    setCarregando(true);
    osApi
      .detalhesOrdemServico(idOs)
      .then((res) => setDados(res.data))
      .catch(() => setDados(null))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    if (aberto) { carregar(); setComentario(""); setFoto(null); setEdicao(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, idOs]);

  async function handleComentario(e) {
    e.preventDefault();
    if (!comentario.trim() && !foto) return;
    setEnviando(true);
    try {
      await osApi.adicionarComentario({ id_os: idOs, comentario, foto });
      setComentario(""); setFoto(null);
      carregar();
    } catch {
      notificar("Erro ao enviar comentário.", "erro");
    } finally {
      setEnviando(false);
    }
  }

  // A API REST retorna a ordem junto dos materiais e respostas.
  const ordem = dados?.ordem || (dados?.id ? dados : null);
  const materiais = dados?.materiais || [];
  const respostas = dados?.respostas || [];
  const comentarios = dados?.comentarios || [];

  return (
    <Modal aberto={aberto} onFechar={onFechar} tamanho="modal-lg" titulo={`Ordem de Serviço #${idOs ?? ""}`}>
      {carregando ? (
        <Carregando texto="Carregando detalhes..." />
      ) : !ordem ? (
        <p className="text-center text-muted">Não foi possível carregar os detalhes desta OS.</p>
      ) : (
        <>
          <div
            className="text-center mb-4"
            style={{ paddingBottom: 14, borderBottom: "1px solid rgba(251, 216, 20, 0.3)" }}
          >
            <div style={{ color: "#a0a0a0", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
              Eletricista responsável
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{ordem.nome_eletricista || "—"}</div>
            <div className="mt-2">{STATUS_BADGE[ordem.status] || <span className="badge bg-secondary">—</span>}</div>
          </div>

          <p><strong>Serviço:</strong> {ordem.descricao || 'Sem descrição'}</p><p><strong>Local:</strong> {ordem.local_servico || 'Não informado'}</p><p><strong>Valor do serviço:</strong> {moeda(ordem.valor_servico)}</p>
          {(ehAdmin || ehSupervisor) && ordem.status !== 'fechada' && <button className="btn btn-sm btn-outline-warning mb-3" onClick={() => setEdicao({ valor_servico: ordem.valor_servico, descricao: ordem.descricao || '', local_servico: ordem.local_servico || '' })}>Editar serviço</button>}
          {edicao && <form className="eletrotech-form mb-4" onSubmit={salvarEdicao}><label>Descrição</label><textarea maxLength={4000} value={edicao.descricao} onChange={e => setEdicao({ ...edicao, descricao: e.target.value })} /><label>Local</label><input maxLength={255} value={edicao.local_servico} onChange={e => setEdicao({ ...edicao, local_servico: e.target.value })} /><label>Valor do serviço (R$)</label><input required type="number" min="0" step="0.01" value={edicao.valor_servico} onChange={e => setEdicao({ ...edicao, valor_servico: e.target.value })} /><button className="btn-submit" disabled={enviando}>Salvar serviço</button><button type="button" className="btn btn-outline-secondary mt-2" onClick={() => setEdicao(null)}>Cancelar edição</button></form>}
          {dados.pendencias?.filter(p => p.bloqueado).map(p => <div className="alert alert-warning" key={p.id}>OS bloqueada ({p.origem === 'manual' ? 'bloqueio manual' : `checklist de ${p.tipo}`}). {p.observacao || 'Aguardando revisão da gestão.'}</div>)}
          {ordem.status === "solicitada" ? (
            <p className="text-center" style={{ color: "#a0a0a0" }}>
              Esta OS ainda não foi aberta. Os materiais e o checklist de início são registrados pelo eletricista
              no momento da abertura.
            </p>
          ) : materiais.length > 0 ? (
            <>
              <h5 className="text-center mb-3">Materiais Utilizados</h5>
              <table className="table table-dark table-sm table-bordered text-center mb-4">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Qtd. Utilizada</th>
                  </tr>
                </thead>
                <tbody>
                  {materiais.map((m, i) => (
                    <tr key={i}>
                      <td>{m.nome_produto}</td>
                      <td>{m.qtd_utilizada}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="text-center">Nenhum material registrado para esta OS.</p>
          )}

          {respostas.length > 0 ? (
            <>
              <h5 className="text-center mb-3">Checklist e Respostas</h5>
              <table className="table table-dark table-sm table-bordered text-center">
                <thead>
                  <tr>
                    <th>Pergunta</th>
                    <th>Resposta</th>
                  </tr>
                </thead>
                <tbody>
                  {respostas.map((r, i) => (
                    <tr key={i}>
                      <td>{r.texto_pergunta}</td>
                      <td>
                        {r.resposta ? r.resposta.charAt(0).toUpperCase() + r.resposta.slice(1) : "-"}
                        {r.motivo_nao && (
                          <div className="text-start mt-2">
                            <strong>Motivo:</strong> {r.motivo_nao}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="text-center">Nenhuma resposta de checklist registrada para esta OS.</p>
          )}

          <hr style={{ borderColor: "rgba(251, 216, 20, 0.3)", margin: "20px 0" }} />
          <h5 className="text-center mb-3">
            <i className="fa-solid fa-comments"></i> Comentários
          </h5>

          {!!dados.fotos?.length && <><h5>Fotos da OS</h5><div className="row">{dados.fotos.map(f => <FotoOs key={f.id} idOs={idOs} foto={f} />)}</div></>}
          {!!dados.historico?.length && <><h5>Histórico de atividades</h5><ul>{dados.historico.map(h => <li key={h.id}>{h.data_evento} · {h.autor} · {h.acao.replaceAll('_',' ')}{h.observacao ? `: ${h.observacao}` : ''}</li>)}</ul></>}
          <form className="mb-4" onSubmit={handleComentario}>
            <textarea
              className="form-control mb-2"
              rows={2}
              placeholder="Escreva um comentário..."
              style={{ background: "transparent", color: "#fff", border: "1px solid #777" }}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            ></textarea>
            <label className="d-block mb-2">Foto (opcional, até 8 MB)<input className="form-control" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={e => setFoto(e.target.files[0] || null)} /></label>
            <button type="submit" className="btn btn-sm btn-outline-success" disabled={enviando} style={{ borderRadius: 20, fontWeight: "bold" }}>
              <i className="fa-solid fa-paper-plane"></i> Enviar
            </button>
          </form>

          {comentarios.length > 0 ? (
            <div>
              {comentarios.map((c, i) => (
                <div key={i} className="mb-3 p-2" style={{ border: "1px solid rgba(251,216,20,0.3)", borderRadius: 8, background: "#333" }}>
                  {c.comentario && <div style={{ whiteSpace: "pre-wrap" }}>{c.comentario}</div>}
                  <div className="mt-1" style={{ fontSize: 11, color: "#e0e0e0" }}>
                    <i className="fa-regular fa-clock" style={{ color: "#FBD814" }}></i>{" "}
                    {c.data_comentario ? new Date(c.data_comentario).toLocaleString("pt-BR") : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center" style={{ color: "#a0a0a0" }}>Nenhum comentário registrado para esta OS.</p>
          )}
        </>
      )}
    </Modal>
  );
}
