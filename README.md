# Mesa RPG - Espelho do Mestre

Ferramenta web local para auxiliar mestres de RPG de mesa no controle visual da sessão. O objetivo é permitir que o Mestre prepare mapas, imagens, cenas, vídeos, tokens, medições, efeitos, anotações e rolagens de dados, exibindo para os jogadores somente o que for confirmado.

A aplicação roda localmente no computador do Mestre e pode abrir uma segunda janela para ser arrastada para a TV ou monitor dos jogadores.

---

## 1. Visão geral

A ferramenta possui duas áreas principais:

- **Tela do Mestre:** painel privado de controle, preparação de cenas, bibliotecas, ferramentas, anotações e dados.
- **Tela dos Jogadores / TV:** tela pública exibida para os jogadores, com mapas, imagens, vídeos, tokens, grid, pointer, medições, efeitos e rolagens públicas.

O Mestre pode preparar tudo antes e só mostrar para os jogadores quando desejar.

---

## 2. Requisitos

### Obrigatório

- Windows ou sistema com navegador moderno.
- Google Chrome, Edge ou outro navegador Chromium recomendado.
- Node.js LTS instalado.

### Necessário para recursos online

- Internet para carregar vídeos do YouTube.
- Internet para carregar os dados 3D via DiceBox/CDN.

O restante da aplicação roda localmente pelo servidor JavaScript incluído no projeto.

---

## 3. Como iniciar

1. Extraia a pasta do projeto.
2. Execute `INICIAR_FERRAMENTA.bat`.
3. Aguarde o navegador abrir a tela do Mestre.
4. Clique em **Abrir TV**.
5. Arraste a nova janela para a TV ou segunda tela dos jogadores.
6. Use **Mostrar cena** para enviar a cena atual para a tela dos jogadores.

Caso seja a primeira execução e o servidor não abra corretamente, execute `INSTALAR_DEPENDENCIAS.bat` se o arquivo estiver disponível no pacote.

---

## 4. Estrutura principal do projeto

Arquivos principais:

```txt
index.html
style.css
app.js
server.js
INICIAR_FERRAMENTA.bat
INSTALAR_DEPENDENCIAS.bat
README.md
assets/
```

### Função dos arquivos

- `index.html`: estrutura da interface do Mestre e da TV.
- `style.css`: tema visual, layout, painel, grid, tokens, medições, dados e responsividade.
- `app.js`: lógica principal da aplicação.
- `server.js`: servidor local em JavaScript/Node.js.
- `INICIAR_FERRAMENTA.bat`: inicialização rápida do app.
- `INSTALAR_DEPENDENCIAS.bat`: script auxiliar caso exista necessidade de preparar dependências.
- `assets/`: arquivos auxiliares e instruções de assets.

---

## 5. Recursos disponíveis

## 5.1 Tela dos jogadores

A ferramenta permite abrir uma segunda janela dedicada para os jogadores.

Recursos:

- Abertura de TV em janela separada.
- Exibição controlada pelo Mestre.
- Tela pública pode permanecer oculta até o Mestre confirmar.
- Mapas, imagens, vídeos e arquivos aparecem somente quando enviados.
- Grid, tokens, pointer, medições, efeitos e dados podem aparecer por cima da cena.
- Ideal para usar em TV, projetor ou segundo monitor.

---

## 5.2 Tela privada do Mestre

A tela do Mestre permite preparar, visualizar e controlar tudo antes de mostrar aos jogadores.

Recursos:

- Prévia privada da cena.
- Controle da tela dos jogadores.
- Bibliotecas separadas.
- Anotações do Mestre.
- Ferramentas de mapa.
- Sistema de dados 3D.
- Controle de vídeos e músicas.
- Ajustes de grid e escala.

---

## 5.3 Biblioteca de imagens, mapas e cenas

Permite carregar e preparar várias imagens ou arquivos antes de exibir.

Recursos:

- Upload de múltiplos arquivos.
- Biblioteca visual em cards/quadrados.
- Seleção rápida de cena.
- Prévia privada no painel do Mestre.
- Botão para mostrar a cena na TV.
- Possibilidade de alternar entre mapas, imagens e documentos preparados.

### Formatos aceitos

Para imagens, mapas e cenas:

```txt
JPG, JPEG, PNG, WebP, GIF, BMP, SVG, PDF, TXT, MD, JSON, CSV
```

Tamanho recomendado:

```txt
Até 60 MB por arquivo
```

Observação: arquivos grandes podem demorar para carregar, pois o navegador precisa processar os dados localmente.

---

## 5.4 Biblioteca de tokens

Sistema para adicionar tokens sobre o mapa.

Recursos:

- Upload de tokens separados da biblioteca de mapas.
- Tokens sobrepostos ao mapa ou vídeo.
- Tokens movíveis pelo Mestre.
- Uso para jogadores, inimigos, NPCs, objetos, marcas ou elementos temporários.
- Tokens continuam funcionando com grid, pointer, medições e vídeos.

### Formatos aceitos para tokens

```txt
JPG, JPEG, PNG, WebP, GIF, BMP, SVG
```

Tamanho recomendado:

```txt
Até 15 MB por token
```

---

## 5.5 Biblioteca de vídeos do YouTube

Permite preparar links de vídeos ou músicas para uso durante a sessão.

Recursos:

- Biblioteca própria para vídeos e músicas.
- Aceita links do YouTube, YouTube Music, youtu.be ou ID direto do vídeo.
- Permite preparar vídeos antes da hora.
- Permite exibir vídeo na tela virtual e na TV.
- Vídeo roda em tela cheia dentro da área de cena.
- Player pequeno de controle para o Mestre.
- Controles de tocar, pausar, avançar, voltar e volume.
- Grid, tokens, pointer, medições e dados funcionam sobre o vídeo.

Observação: o player usa incorporação do YouTube no navegador e depende das permissões do próprio YouTube. Alguns vídeos podem ter restrições de incorporação.

---

## 5.6 Tela virtual e proporção

A ferramenta trabalha com uma tela virtual para manter a visão do Mestre alinhada à visão dos jogadores.

Recursos:

- Opções de proporção da tela virtual.
- Suporte principal para 16:9.
- Visualização ajustada para evitar imagens gigantes e rolagem excessiva.
- Melhor alinhamento entre pointer, grid, medições e cena exibida na TV.

---

## 5.7 Grid configurável

Sistema de grade para mapas de batalha.

Recursos:

- Ativar ou desativar grid.
- Mostrar grid apenas para o Mestre ou também na TV.
- Configurar quantidade de colunas.
- Configurar quantidade de linhas.
- Definir escala por quadrado, por exemplo `1,5 m` por quadrado.
- Escolher cor do grid.
- Ajustar espessura/intensidade das linhas.
- Prender medições no centro dos quadrados.
- Usar tamanho fixo nas áreas de efeito.

Exemplo de configuração:

```txt
Colunas: 16
Linhas: 9
Escala: 1,5 m por quadrado
```

---

## 5.8 Pointer

Ferramenta para apontar visualmente no mapa ou vídeo.

Recursos:

- Pointer em verde neon.
- Sem ícone de `+` no centro.
- Rastro visual rápido.
- Rastro sólido.
- Rastro desaparece rapidamente.
- Funciona sobre imagens, mapas, vídeos e tokens.
- Pode ser usado para indicar pontos de interesse aos jogadores.

---

## 5.9 Ferramentas de medição e áreas de efeito

Ferramentas para medir distância e desenhar efeitos no mapa.

Recursos disponíveis:

- Linha / régua.
- Círculo.
- Quadrado.
- Cone.
- Medições múltiplas simultâneas.
- Medições funcionam sobre tokens.
- Medições funcionam sobre vídeos.
- Medições podem usar o grid para cálculo de distância.
- Cada medição pode ter cor própria.
- Cada medição pode ter nota própria.
- Cada medição pode ser movida individualmente.
- Cada medição pode ser apagada individualmente.
- Botões aparecem ao passar o mouse para evitar poluição visual.
- Opção para limpar medições.

### Notas nas medições

Cada área ou medição pode ter uma nota curta, por exemplo:

```txt
Fogo 2T
Névoa
Silêncio
Veneno
Aura do Boss
Concentração
```

A nota aparece apenas ao passar o mouse sobre a área, reduzindo poluição visual durante a partida.

### Uso recomendado

- Marcar áreas de magias.
- Marcar efeitos ativos.
- Indicar duração de efeitos.
- Identificar áreas perigosas.
- Medir deslocamento.
- Medir alcance de ataques ou magias.

---

## 5.10 Barra de ferramentas

A aplicação possui uma barra de ferramentas visual em estilo compacto.

Recursos:

- Botão de recolher/expandir.
- Botão de grid.
- Botão de pointer.
- Botão de linha/régua.
- Botão de círculo.
- Botão de quadrado.
- Botão de cone.
- Botão de limpar medições.
- Posicionamento próximo à tela virtual para reduzir rolagem.

Objetivo: permitir acesso rápido às ferramentas sem precisar navegar até o fim da página.

---

## 5.11 Dados 3D

Sistema de rolagem de dados 3D integrado ao app.

Recursos:

- Rolagem visual com animação 3D.
- Física visual de rolagem.
- Suporte a dados de RPG:
  - d4
  - d6
  - d8
  - d10
  - d12
  - d20
  - d100
- Rolagem de múltiplos dados.
- Rolagem de tipos mistos.
- Exemplo: `1d4 + 1d6 + 1d8`.
- Resultado final exibido ao final da rolagem.
- Detalhamento dos resultados individuais.
- Modificador positivo ou negativo.
- Vantagem.
- Desvantagem.
- Rolagem pública na TV.
- Rolagem privada apenas para o Mestre.
- Histórico de rolagens.
- Cor personalizável dos dados.
- Clique na área da rolagem para fechar.
- A rolagem desaparece automaticamente após alguns segundos.

### Biblioteca usada nos dados

Os dados 3D usam DiceBox via CDN.

Isso significa que:

- Não precisa de API própria.
- Não precisa de chave de API.
- Precisa de internet para carregar os assets 3D.
- A renderização roda no navegador.

---

## 5.12 Barra rápida de dados

Além do painel completo de dados, existe uma barra rápida para rolagens durante a sessão.

Funcionamento:

1. Clique nos botões dos dados desejados.
2. Cada clique adiciona aquele dado à rolagem preparada.
3. Clique em **Rolar** para jogar todos juntos.

Exemplos:

```txt
Clique D4 uma vez
Clique D8 duas vezes
Resultado preparado: 1d4 + 2d8
```

```txt
Clique D20 duas vezes
Modo: vantagem
Resultado: usa o maior valor
```

Campos disponíveis:

- Botões rápidos: D4, D6, D8, D10, D12, D20, D100.
- Modificador: `+4`, `-2`, etc.
- Modo: normal, vantagem ou desvantagem.
- Cor dos dados.
- Botão para limpar a seleção preparada.
- Botão para rolar.

---

## 5.13 Vantagem e desvantagem

Sistema pensado principalmente para rolagens de d20.

### Vantagem

Rola dois d20 e considera o maior valor.

### Desvantagem

Rola dois d20 e considera o menor valor.

O resultado final considera também o modificador, caso exista.

Exemplo:

```txt
2d20 com vantagem + 5
Resultados: 7 e 16
Valor usado: 16
Total: 21
```

---

## 5.14 Rolagem pública e privada

O Mestre pode escolher como exibir a rolagem.

### Rolagem pública

- Aparece na tela do Mestre.
- Aparece também na TV dos jogadores.
- Útil para rolagens abertas, ataques, dano, tensão pública e momentos dramáticos.

### Rolagem privada

- Aparece apenas para o Mestre.
- Útil para testes ocultos, encontros, percepção passiva, decisões secretas e rolagens narrativas.

---

## 5.15 Anotações do Mestre

Painel lateral para registrar informações importantes durante a sessão.

Campos sugeridos:

- Iniciativa.
- Vida e recursos.
- Eventos importantes.
- Lembrar depois.

Recursos:

- Campos de texto separados.
- Botão para salvar.
- Botão para limpar.
- Notas salvas automaticamente no navegador/localStorage.

Exemplos de uso:

```txt
Iniciativas:
18 - Lukan
15 - Goblin
13 - Wilhelm
```

```txt
Vida / recursos:
Wilhelm: 32/40 PV
Vargan: 58/80 PV
```

```txt
Eventos importantes:
- O grupo poupou o guarda.
- Callahan pegou o documento.
```

---

## 5.16 Persistência local

A ferramenta salva algumas informações localmente no navegador.

Pode incluir:

- Notas do Mestre.
- Algumas configurações de interface.
- Configurações recentes de ferramentas.

Observação: limpar dados do navegador pode apagar informações salvas localmente.

---

## 5.17 Comunicação Mestre/TV

A comunicação entre a tela do Mestre e a tela dos jogadores acontece no navegador.

Recursos sincronizados:

- Cena exibida.
- Grid.
- Tokens.
- Pointer.
- Medições.
- Áreas de efeito.
- Rolagens públicas.
- Vídeos exibidos.

A janela da TV precisa permanecer aberta para receber atualizações.

---

## 6. Fluxo de uso recomendado em sessão

### Antes da sessão

1. Abrir o app.
2. Abrir a TV dos jogadores.
3. Carregar mapas e imagens na biblioteca de cenas.
4. Carregar tokens necessários.
5. Preparar vídeos ou músicas do YouTube.
6. Configurar grid do mapa principal.
7. Preencher anotações iniciais.

### Durante a sessão

1. Selecionar a cena desejada.
2. Conferir na prévia privada.
3. Clicar em **Mostrar cena** quando quiser revelar.
4. Usar pointer para indicar locais.
5. Usar régua e áreas para distâncias e magias.
6. Mover tokens conforme o combate.
7. Usar dados 3D para rolagens públicas ou privadas.
8. Atualizar notas do Mestre.

### Depois da sessão

1. Revisar anotações.
2. Copiar eventos importantes para a preparação da próxima sessão.
3. Salvar qualquer informação fora do navegador, se for muito importante.

---

## 7. Atalhos conceituais de uso

Não são atalhos de teclado obrigatórios, mas fluxos rápidos:

```txt
Mapa novo → escolher arquivo → selecionar cena → mostrar cena
```

```txt
Combate → ativar grid → adicionar tokens → usar régua/áreas → rolar dados
```

```txt
Magia em área → escolher círculo/quadrado/cone → desenhar → editar nota/cor
```

```txt
Rolagem rápida → clicar dados → definir modificador → escolher modo → rolar
```

---

## 8. Arquivos aceitos

### Imagens, mapas e cenas

```txt
JPG, JPEG, PNG, WebP, GIF, BMP, SVG, PDF, TXT, MD, JSON, CSV
```

Limite recomendado:

```txt
Até 60 MB por arquivo
```

### Tokens

```txt
JPG, JPEG, PNG, WebP, GIF, BMP, SVG
```

Limite recomendado:

```txt
Até 15 MB por token
```

### Vídeos

Aceita:

```txt
Links do YouTube
Links do YouTube Music
Links youtu.be
ID direto do vídeo
```

---

## 9. Limitações conhecidas

### YouTube

Alguns vídeos podem não tocar incorporados por restrições do próprio YouTube ou do proprietário do vídeo.

Possíveis sintomas:

- player não carrega;
- vídeo mostra erro de incorporação;
- vídeo abre apenas no YouTube;
- controles ficam limitados.

Solução recomendada:

- testar outro vídeo;
- usar links de vídeos públicos;
- evitar vídeos com restrição de incorporação.

### Dados 3D

Os dados dependem de CDN/Internet para carregar a biblioteca e assets 3D.

Possíveis sintomas:

- resultado aparece em texto, mas o dado não aparece;
- mensagem de inicialização fica presa;
- console mostra erro de carregamento externo.

Solução recomendada:

- verificar internet;
- abrir F12 > Console/Network;
- conferir bloqueio de CDN pelo navegador, antivírus ou rede.

### Upload de arquivos

Arquivos muito grandes ou corrompidos podem falhar.

Solução recomendada:

- testar outro formato;
- reduzir tamanho do arquivo;
- converter imagens grandes para JPG/WebP;
- reenviar o arquivo após recarregar a página.

---

## 10. Solução de problemas

### O app não abre

Verifique:

- Node.js LTS instalado.
- `INICIAR_FERRAMENTA.bat` executado como usuário normal.
- Porta local não bloqueada.
- Antivírus não bloqueando o servidor local.

### A TV não atualiza

Verifique:

- A janela da TV está aberta.
- A janela não foi recarregada em outra rota incorreta.
- O Mestre clicou em **Mostrar cena**.
- O navegador não bloqueou comunicação local.

### A imagem não carrega

Verifique:

- Formato suportado.
- Tamanho dentro do limite recomendado.
- Arquivo não está corrompido.
- Tente enviar novamente.

### O vídeo não toca

Verifique:

- Link válido.
- Internet ativa.
- Vídeo permite incorporação.
- Teste com outro vídeo público.

### O dado 3D não aparece

Verifique:

- Internet ativa.
- CDN não bloqueada.
- Abra F12 > Console/Network.
- Procure erros relacionados a DiceBox, assets ou CDN.

### Tudo ficou preto ou travado

Tente:

1. Fechar navegador.
2. Fechar terminal do servidor.
3. Rodar `INICIAR_FERRAMENTA.bat` novamente.
4. Forçar atualização com `Ctrl + F5`.
5. Testar em uma pasta nova extraída do ZIP.

---

## 11. Recomendações de uso visual

### Para mapas

- Preferir proporção 16:9 quando for usar em TV.
- Usar grid já alinhado ou configurar grid no app.
- Evitar imagens extremamente pesadas.
- Usar JPG/WebP para mapas grandes.

### Para tokens

- Preferir PNG ou WebP com fundo transparente.
- Manter arquivos pequenos.
- Usar nomes fáceis de identificar.

### Para vídeos

- Testar os links antes da sessão.
- Salvar os vídeos na biblioteca antes do jogo.
- Evitar depender de vídeos com restrição de incorporação.

### Para dados

- Usar rolagens públicas em momentos importantes.
- Usar rolagens privadas para testes secretos.
- Usar cores diferentes para climas ou personagens.

---

## 12. Possíveis melhorias futuras

Ideias de evolução da ferramenta:

- Sistema de salvamento de campanhas.
- Perfis por sessão.
- Exportação/importação de bibliotecas.
- Controle de iniciativa integrado.
- Fichas resumidas de jogadores e monstros.
- Integração com banco de dados de magias.
- Controle de vida de tokens.
- Camadas de mapa.
- Fog of war.
- Grid hexagonal.
- Atalhos de teclado.
- Sons locais além do YouTube.
- Dados 3D offline, sem depender de CDN.
- Temas visuais customizáveis.
- Persistência em arquivo local.

---

## 13. Observações para desenvolvimento

A ferramenta foi construída para evoluir em módulos. Os principais blocos lógicos podem ser separados em:

```txt
core/app
screen/tv-sync
scene-library
token-library
youtube-player
grid-tools
pointer-tools
measurement-tools
dice-system
notes-system
storage/local
```

Essa separação facilita manutenção, refatoração e evolução do front.

### Módulo de dados

O sistema de dados pode ser tratado como módulo independente, contendo:

- criação de rolagens;
- parsing de dados selecionados;
- modificadores;
- vantagem/desvantagem;
- renderização DiceBox;
- resultado final;
- histórico;
- comunicação com a TV.

---

## 14. Resumo das features

- Tela privada do Mestre.
- Tela pública dos jogadores.
- Controle de exibição por confirmação.
- Biblioteca de mapas, imagens e cenas.
- Biblioteca de tokens.
- Biblioteca de vídeos do YouTube.
- Player pequeno do YouTube para o Mestre.
- Vídeo em tela cheia dentro da cena.
- Grid configurável.
- Pointer neon com rastro.
- Régua de distância.
- Áreas de efeito: linha, círculo, quadrado e cone.
- Medições múltiplas.
- Cor individual por medição.
- Nota individual por medição.
- Mover e apagar medição específica.
- Menus por hover para evitar poluição visual.
- Tokens sobrepostos e movíveis.
- Ferramentas funcionando sobre tokens e vídeos.
- Anotações do Mestre.
- Dados 3D com animação.
- d4, d6, d8, d10, d12, d20 e d100.
- Rolagens múltiplas e mistas.
- Modificadores.
- Vantagem e desvantagem.
- Rolagem pública na TV.
- Rolagem privada para o Mestre.
- Histórico de rolagens.
- Cor personalizável dos dados.
- Servidor local em JavaScript/Node.js.
- Sem necessidade de API própria.

---

## 15. Licenças e dependências externas

A aplicação usa recursos externos para algumas funções:

- YouTube IFrame Player para reprodução incorporada de vídeos.
- DiceBox via CDN para dados 3D.

Esses recursos dependem das permissões, disponibilidade e termos dos respectivos serviços.

---

## 16. Nota final

Esta ferramenta foi pensada para facilitar a vida do Mestre durante sessões presenciais de RPG de mesa, permitindo preparar cenas de forma privada e revelar conteúdo aos jogadores no momento certo, com suporte a mapas, vídeos, tokens, efeitos, anotações e rolagens 3D.
