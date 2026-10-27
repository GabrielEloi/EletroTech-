import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/context/AuthContext';
import { NotificacaoProvider } from '../../src/context/NotificacaoContext';
import Navbar from '../../src/components/Navbar';
import Layout from '../../src/components/Layout';
import RotaProtegida from '../../src/components/RotaProtegida';
import MetasPage from '../../src/pages/MetasPage';

function render(user, child) {
  vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(user) });
  return renderToStaticMarkup(<AuthProvider><NotificacaoProvider><MemoryRouter>{child}</MemoryRouter></NotificacaoProvider></AuthProvider>);
}
const electrician = { id:2,nome:'Ana',eletricista_id:1,is_admin:0,permissoes:['produtos','checklist','eletricistas','baixas'] };
afterEach(() => vi.unstubAllGlobals());

describe('Interface do eletricista', () => {
  it('exibe apenas Dashboard, Metas, Ordens de Serviço e Sair no menu', () => {
    const html=render(electrician,<Navbar />);
    for(const text of ['Dashboard','Metas','Ordens de Serviço','Sair'])expect(html).toContain(text);
    for(const text of ['Usuários','Eletricistas','Produtos','Checklist','Movimentação','Baixas'])expect(html).not.toContain(text);
  });
  it('remove criação de metas, seleção de outros eletricistas e assistente', () => {
    const html=render(electrician,<Layout><MetasPage /></Layout>);
    expect(html).toContain('Consulte suas metas');
    for(const text of ['Nova Meta','Todos os Eletricistas','chat-widget','Cadastrar Meta','Editar Meta'])expect(html).not.toContain(text);
  });
  it.each(['produtos','eletricistas','checklist','baixas','adminOnly'])('bloqueia tela %s mesmo com permissão antiga salva', permission => {
    expect(render(electrician,<RotaProtegida permissao={permission}><p>CONTEUDO_RESTRITO</p></RotaProtegida>)).not.toContain('CONTEUDO_RESTRITO');
  });
  it('mantém a navegação e a criação de metas do administrador', () => {
    const html=render({id:1,is_admin:1,eletricista_id:null,permissoes:[]},<Layout><MetasPage /></Layout>);
    for(const text of ['Usuários','Eletricistas','Produtos','Nova Meta','Todos os Eletricistas'])expect(html).toContain(text);
  });
  it('interpreta is_admin zero como usuário padrão, inclusive em string', () => {
    expect(render({id:4,is_admin:'0',permissoes:['metas']},<Navbar />)).not.toContain('Usuários');
  });
});
