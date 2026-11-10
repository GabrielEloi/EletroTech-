import api from './client';

export const listarSupervisores = () => api.get('/supervisores');
export const criarSupervisor = dados => api.post('/supervisores', dados);
export const editarSupervisor = (id, dados) => api.put(`/supervisores/${id}`, dados);
export const salvarEquipe = (id, eletricistaIds, transferir) => api.put(`/supervisores/${id}/equipe`, { eletricistaIds, transferir });
