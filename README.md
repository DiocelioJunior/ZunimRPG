# Mesa RPG - Espelho do Mestre v11

Versão com player protegido, bibliotecas separadas, medições com notas por hover e upload mais resistente.

## Mudanças principais

- Biblioteca separada para imagens, mapas e cenas.
- Biblioteca separada para tokens.
- Biblioteca separada para vídeos/músicas do YouTube.
- Vídeos continuam abrindo em tela cheia dentro da tela virtual e da TV.
- Grid, tokens, pointer e medições continuam por cima do vídeo.
- Adicionado player pequeno de controle do mestre para pausar, tocar, voltar/avançar e ajustar volume.
- Corrigido bug em que ativar pointer/medições recriava o iframe e pausava o vídeo.
- Upload mais estável: leitura com tentativas automáticas e fallback por ArrayBuffer, além de validação por extensão, tipo e tamanho.
- Servidor local em JavaScript puro, sem Python e sem dependências npm.

## Como usar

1. Extraia a pasta.
2. Rode `INICIAR_FERRAMENTA.bat`.
3. Clique em `Abrir TV` e arraste a janela para a TV dos jogadores.
4. Para vídeos, cole um link do YouTube/YouTube Music/youtu.be ou o ID do vídeo.
5. Clique em `Preparar vídeo` para salvar na biblioteca de vídeos.
6. Clique em `Mostrar` na biblioteca de vídeos ou `Mostrar agora` para enviar para a TV.
7. Use o player pequeno e os botões de controle para gerenciar a reprodução.

## Requisito

- Node.js LTS instalado.

## Observação

Esta versão usa o player incorporado do YouTube via iframe, sem chave da API de dados oficial. Os botões de controle usam a YouTube IFrame Player API, que não exige chave.

## Arquivos aceitos

- Imagens/mapas/cenas: JPG, PNG, WebP, GIF, BMP, SVG, PDF, TXT/MD/JSON/CSV até 60 MB por arquivo.
- Tokens: JPG, PNG, WebP, GIF, BMP ou SVG até 15 MB por token.

Arquivos muito grandes podem demorar para carregar porque o navegador precisa transformar o arquivo em dados locais para enviar para a janela da TV.


## Novidades v11

- O texto das medições/áreas fica oculto e só aparece ao passar o mouse sobre a área/linha, junto dos botões de mover, editar nota, mudar cor e excluir.
- Upload de mapas e tokens foi reforçado com nova leitura estável: se o FileReader falhar, o sistema tenta novamente e usa um fallback por ArrayBuffer.
