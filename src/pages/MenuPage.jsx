import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useAuth } from "../context/AuthContext";
import { getMenu } from "../api/menu";
import { Carregando, ErroCarregamento } from "../components/EstadoLista";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const opcoesEixoEscuro = {
  responsive: true,
  plugins: { legend: { labels: { color: "#ffffff" } } },
  scales: {
    x: { ticks: { color: "#ffffff" }, grid: { color: "rgba(255,255,255,0.08)" } },
    y: { beginAtZero: true, ticks: { color: "#ffffff" }, grid: { color: "rgba(255,255,255,0.08)" } },
  },
};

function formatarLabelsMes(lista) {
  return (lista || []).map((item) => {
    const [ano, mes] = String(item.mes || "").split("-");
    if (!ano || !mes) return item.mes || "Sem mês";
    return new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    });
  });
}

export default function MenuPage() {
  const { usuario, ehAdmin } = useAuth();
  const [mesFiltro, setMesFiltro] = useState("");
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  function carregar(mes) {
    setCarregando(true);
    setErro("");
    getMenu(mes)
      .then((res) => setDados(res.data))
      .catch(() => setErro("Não foi possível carregar os dados do dashboard."))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleBuscar(e) {
    e.preventDefault();
    carregar(mesFiltro);
  }

  function handleLimpar() {
    setMesFiltro("");
    carregar();
  }

  const nomeExibicao = dados?.usuario || usuario?.nome || "Usuário";

  if (carregando) return <Carregando texto="Carregando dashboard..." />;
  if (erro) return <ErroCarregamento mensagem={erro} onTentarNovamente={() => carregar(mesFiltro)} />;

  const totais = dados?.totais || {};
  const eletricistaDashboard = dados?.eletricistaDashboard;
  const graficoMes = dados?.graficoMes || [];
  const graficoEletricista = dados?.graficoEletricista || [];
  const graficoStatus = dados?.graficoStatus || {};

  const labelsMes = formatarLabelsMes(graficoMes);
  const valoresMes = graficoMes.map((i) => Number(i.total || 0));

  // Dashboard do eletricista (perfil não-admin)
  if (eletricistaDashboard && !ehAdmin) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Olá, {nomeExibicao}!</h1>
          <p>Resumo das suas ordens de serviço, produtividade e metas.</p>
        </div>

        <div className="row g-4">
          <div className="col-md-6 col-lg-3">
            <div className="card-eletrotech">
              <i className="fa-solid fa-clipboard-list icon-metric"></i>
              <div className="metric-value">{eletricistaDashboard.totalOs ?? 0}</div>
              <div className="metric-label">OSs Realizadas</div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="card-eletrotech">
              <i className="fa-solid fa-box-open icon-metric"></i>
              <div className="metric-value">{eletricistaDashboard.produtosUtilizados ?? 0}</div>
              <div className="metric-label">Produtos Utilizados</div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="card-eletrotech">
              <i className="fa-solid fa-bullseye icon-metric"></i>
              <div className="metric-value">
                R$ {Number(eletricistaDashboard.metaAtual ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <div className="metric-label">Meta Atual</div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="card-eletrotech">
              <i className="fa-solid fa-chart-line icon-metric"></i>
              <div className="metric-value">{graficoMes.length}</div>
              <div className="metric-label">Meses com OS</div>
            </div>
          </div>
        </div>

        <div className="row g-4 mt-1">
          <div className="col-12">
            <div className="painel painel-destaque">
              <h3 style={{ color: "#FBD814" }}>Quantidade de OSs por mês</h3>
              <form onSubmit={handleBuscar} className="filtro-mes">
                <div style={{ flexGrow: 1, minWidth: 220 }}>
                  <label htmlFor="mes">Filtrar mês:</label>
                  <input
                    type="month"
                    id="mes"
                    className="form-control"
                    value={mesFiltro}
                    onChange={(e) => setMesFiltro(e.target.value)}
                  />
                </div>
                <div>
                  <button type="submit" className="btn btn-outline-warning">Buscar</button>
                  <button type="button" className="btn btn-outline-secondary ms-2" onClick={handleLimpar}>Limpar</button>
                </div>
              </form>
              {graficoMes.length > 0 ? (
                <Bar
                  data={{
                    labels: labelsMes,
                    datasets: [{ label: "Quantidade de OS", data: valoresMes, backgroundColor: "#FBD814", borderColor: "#fff", borderWidth: 1, borderRadius: 8 }],
                  }}
                  options={opcoesEixoEscuro}
                />
              ) : (
                <p className="text-muted text-center mt-4">Sem dados para o período selecionado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard admin
  const labelsEletricista = graficoEletricista.map((i) => i.eletricista || "Sem nome");
  const valoresEletricista = graficoEletricista.map((i) => Number(i.total || 0));

  return (
    <div className="container">
      <div className="page-header">
        <h1>Olá, {nomeExibicao}!</h1>
        <p>Bem-vindo(a) ao painel de controle da EletroTech Soluções Elétricas.</p>
      </div>

      <div className="row g-4">
        <div className="col-md-6 col-lg-3">
          <div className="card-eletrotech">
            <i className="fa-solid fa-users icon-metric"></i>
            <div className="metric-value">{totais.eletricistas ?? 0}</div>
            <div className="metric-label">Eletricistas Ativos</div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card-eletrotech">
            <i className="fa-solid fa-box-open icon-metric"></i>
            <div className="metric-value">{totais.produtos ?? 0}</div>
            <div className="metric-label">Produtos Cadastrados</div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card-eletrotech">
            <i className="fa-solid fa-clipboard-list icon-metric"></i>
            <div className="metric-value">{totais.os ?? 0}</div>
            <div className="metric-label">OS Realizadas</div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card-eletrotech">
            <i className="fa-solid fa-chart-line icon-metric"></i>
            <div className="metric-value">
              R$ {Number(totais.metas ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="metric-label">Metas Atingidas</div>
          </div>
        </div>
      </div>

      <div className="row g-4 mt-1">
        <div className="col-lg-6">
          <div className="painel painel-destaque">
            <h3 style={{ color: "#FBD814" }}>OS por eletricista</h3>
            {graficoEletricista.length > 0 ? (
              <Bar
                data={{
                  labels: labelsEletricista,
                  datasets: [{ label: "Quantidade de OS", data: valoresEletricista, backgroundColor: "#FBD814", borderColor: "#fff", borderWidth: 1, borderRadius: 8 }],
                }}
                options={opcoesEixoEscuro}
              />
            ) : (
              <p className="text-muted text-center mt-4">Sem dados no momento.</p>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="painel painel-destaque">
            <h3 style={{ color: "#FBD814" }}>Quantidade de OS por mês</h3>
            <form onSubmit={handleBuscar} className="filtro-mes">
              <div style={{ flexGrow: 1, minWidth: 220 }}>
                <label htmlFor="mes">Filtrar mês:</label>
                <input
                  type="month"
                  id="mes"
                  className="form-control"
                  value={mesFiltro}
                  onChange={(e) => setMesFiltro(e.target.value)}
                />
              </div>
              <div>
                <button type="submit" className="btn btn-outline-warning">Buscar</button>
                <button type="button" className="btn btn-outline-secondary ms-2" onClick={handleLimpar}>Limpar</button>
              </div>
            </form>
            {graficoMes.length > 0 ? (
              <Bar
                data={{
                  labels: labelsMes,
                  datasets: [{ label: "Quantidade de OS", data: valoresMes, backgroundColor: "#FBD814", borderColor: "#fff", borderWidth: 1, borderRadius: 8 }],
                }}
                options={opcoesEixoEscuro}
              />
            ) : (
              <p className="text-muted text-center mt-4">Sem dados para o período.</p>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="painel painel-destaque">
            <h3 style={{ color: "#FBD814" }}>Status das ordens de serviço</h3>
            {(graficoStatus.solicitada || graficoStatus.aberta || graficoStatus.fechada) ? (
              <Doughnut
                data={{
                  labels: ["Solicitadas", "Abertas", "Fechadas"],
                  datasets: [{
                    data: [Number(graficoStatus.solicitada || 0), Number(graficoStatus.aberta || 0), Number(graficoStatus.fechada || 0)],
                    backgroundColor: ["#FBD814", "#f8a81e", "#4ade80"],
                    borderColor: "#282828",
                    borderWidth: 2,
                  }],
                }}
                options={{ responsive: true, plugins: { legend: { labels: { color: "#ffffff" }, position: "bottom" } } }}
              />
            ) : (
              <p className="text-muted text-center mt-4">Sem dados no momento.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
