<?php
defined('BASEPATH') or exit('No direct script access allowed');

class ChatController extends MY_Controller
{
    public function enviar()
    {
        if ($this->input->method() !== 'post') {
            return $this->responderJson(array('erro' => 'Método não permitido.'));
        }

        $caminhoEnv = FCPATH . '../.env';
        $env = file_exists($caminhoEnv) ? parse_ini_file($caminhoEnv) : array();
        $flowiseUrl = $env['FLOWISE_API_URL'] ?? '';

        if (empty($flowiseUrl)) {
            return $this->responderJson(array('erro' => 'Erro de configuração: URL do Flowise não encontrada no .env.'));
        }

        $dados = json_decode($this->input->raw_input_stream, true);
        $mensagemUsuario = $dados['mensagem'] ?? '';

        if (empty($mensagemUsuario)) {
            return $this->responderJson(array('erro' => 'A mensagem não pode estar vazia.'));
        }

        $payload = array('question' => $mensagemUsuario);

        $ch = curl_init($flowiseUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json',
        ));

        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

        $resposta = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $erroCurl = curl_error($ch);
        curl_close($ch);

        if ($erroCurl) {
            return $this->responderJson(array('erro' => 'Falha de comunicação com o motor de IA: ' . $erroCurl));
        }

        if ($httpCode !== 200) {
            return $this->responderJson(array('erro' => 'O servidor de IA retornou o código HTTP ' . $httpCode));
        }

        $resultado = json_decode($resposta, true);
        $textoIA = $resultado['text'] ?? 'Não foi possível obter uma resposta do documento técnico.';

        $this->responderJson(array('resposta' => $textoIA));
    }

    private function responderJson(array $dados)
    {
        $this->output
            ->set_content_type('application/json')
            ->set_output(json_encode($dados));
    }
}
