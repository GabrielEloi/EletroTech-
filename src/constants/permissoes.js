// Espelha application/helpers/permissoes_helper.php (permissoes_disponiveis())
export const PERMISSOES_DISPONIVEIS = {
  menu: "Dashboard",
  ordemServico: "Ordens de Serviço",
  checklist: "Checklist",
  produtos: "Produtos",
  baixas: "Baixas",
  metas: "Metas",
  eletricistas: "Eletricistas",
};

// O perfil vinculado ao eletricista tem somente estes módulos.
export const PERMISSOES_ELETRICISTA = ["menu", "ordemServico", "metas"];
