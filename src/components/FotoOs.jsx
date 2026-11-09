import { useEffect, useState } from 'react';
import { obterFotoOs } from '../api/ordensServico';

export default function FotoOs({ idOs, foto }) {
  const [url, setUrl] = useState(''), [erro, setErro] = useState(false);
  useEffect(() => {
    let ativo = true, objectUrl;
    obterFotoOs(idOs, foto.id).then(res => {
      if (ativo) { objectUrl = URL.createObjectURL(res.data); setUrl(objectUrl); }
    }).catch(() => { if (ativo) setErro(true); });
    return () => { ativo = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [idOs, foto.id]);
  return <figure className="col-md-6">{url ? <a href={url} target="_blank" rel="noreferrer"><img className="foto-os" src={url} alt={`Foto da OS ${idOs} — ${foto.etapa}`} /></a> : <p>{erro ? 'Não foi possível carregar a foto.' : 'Carregando foto...'}</p>}<figcaption>{foto.etapa}</figcaption></figure>;
}
