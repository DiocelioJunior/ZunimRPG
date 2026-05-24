//Diow:
//Funcão para renderizar a interface do mestre
//Talvez seja uma boa ideia quebrar essa função em trechos menores , cada botão da barra de navegação pode abrir um card

function renderMaster() {
  app.className = "app";
  app.innerHTML = `

    <main class="layout">
      <aside class="sidebar">
        <section class="panel">
          <h2>1. Tela dos jogadores</h2>
          <div class="buttons two">
            <button class="primary" id="openPlayerBtn">Abrir TV</button>
            <button class="success" id="showBtnTop">Mostrar cena</button>
          </div>
          <div class="status" id="playerStatus">Tela dos jogadores ainda não aberta.</div>
        </section>

        <section class="panel">
          <h2>2. Controles rápidos</h2>

          <div class="quick-grid">
            <div class="field">
              <label for="screenRatioSelect">Tela virtual</label>
              <select id="screenRatioSelect">
                <option value="16:9">16:9</option>
                <option value="4:3">4:3</option>
                <option value="1:1">1:1</option>
                <option value="21:9">21:9</option>
                <option value="fill">Preencher</option>
              </select>
            </div>

            <div class="field">
              <label for="rulerModeSelect">Ferramenta</label>
              <select id="rulerModeSelect">
                <option value="line">Linha / Régua</option>
                <option value="circle">Círculo</option>
                <option value="square">Quadrado</option>
                <option value="cone">Cone</option>
              </select>
            </div>
          </div>

          <div class="compact-tools">
            <button id="quickLineBtn">Linha</button>
            <button id="quickCircleBtn">Círculo</button>
            <button id="quickSquareBtn">Quad.</button>
            <button id="quickConeBtn">Cone</button>
          </div>

          <div class="compact-row" style="margin-top: 8px;">
            <div class="field">
              <label for="gridColumnsInput">Col.</label>
              <input id="gridColumnsInput" type="number" min="1" max="100" value="16" />
            </div>

            <div class="field">
              <label for="gridRowsInput">Lin.</label>
              <input id="gridRowsInput" type="number" min="1" max="100" value="9" />
            </div>

            <div class="field">
              <label for="gridMetersInput">m/q.</label>
              <input id="gridMetersInput" type="number" min="0.1" step="0.1" value="1.5" />
            </div>
          </div>

          <div class="quick-grid">
            <div class="field">
              <label for="effectFixedMetersInput">Tamanho fixo</label>
              <input id="effectFixedMetersInput" type="number" min="0.1" step="0.5" value="3" />
            </div>

            <div class="field">
              <label for="effectColorInput">Cor do efeito</label>
              <input id="effectColorInput" type="color" value="#22d3ee" />
            </div>

            <div class="field">
              <label for="gridColorInput">Cor do grid</label>
              <input id="gridColorInput" type="color" value="#ffffff" />
            </div>

            <div class="field">
              <label for="gridThicknessInput">Esp. <span id="gridThicknessValue" class="range-value">1px</span></label>
              <input id="gridThicknessInput" type="range" min="1" max="5" step="1" value="1" />
            </div>

            <div class="field">
              <label for="gridOpacityInput">Int. <span id="gridOpacityValue" class="range-value">34%</span></label>
              <input id="gridOpacityInput" type="range" min="0.05" max="1" step="0.05" value="0.34" />
            </div>
          </div>

          <label class="checkline"><input type="checkbox" id="gridEnabledCheck" /> Exibir grid</label>
          <label class="checkline"><input type="checkbox" id="gridShowPlayersCheck" checked /> Mostrar grid na TV</label>
          <label class="checkline"><input type="checkbox" id="gridSnapCheck" checked /> Prender no centro dos quadrados</label>
          <label class="checkline"><input type="checkbox" id="effectFixedCheck" /> Usar tamanho fixo nas áreas</label>

          <div class="buttons two">
            <button id="applyGridBtn" class="primary">Aplicar</button>
            <button id="clearMeasurementsBtn" class="warning">Limpar medições</button>
          </div>

          <div class="status" id="screenRatioStatus">Tela virtual: 16:9</div>
          <div class="status" id="gridStatus">Grid: desligado | 16 x 9 | 1,5 m por quadrado</div>
        </section>

        <section class="panel">
          <h2>3. Biblioteca de vídeos do YouTube</h2>
          <p>Cole o link ou ID. O vídeo abre em tela cheia na tela virtual/TV, enquanto o player pequeno abaixo serve para controlar com mais precisão.</p>

          <div class="field">
            <label for="youtubeLinkInput">Link ou ID do vídeo</label>
            <input id="youtubeLinkInput" type="text" placeholder="Ex: https://www.youtube.com/watch?v=..." />
          </div>

          <div class="field">
            <label for="youtubeTitleInput">Nome opcional</label>
            <input id="youtubeTitleInput" type="text" placeholder="Ex: Mapa interativo / Música de batalha" />
          </div>

          <div class="buttons two">
            <button id="addYoutubeBtn" class="success">Preparar vídeo</button>
            <button id="showYoutubeBtn" class="primary">Mostrar agora</button>
          </div>

          <div class="youtube-control-panel">
            <div class="youtube-control-title">Player de controle do mestre</div>
            <div id="youtubeControlBox" class="youtube-control-box">
              <div class="library-empty">Selecione ou prepare um vídeo para carregar o player.</div>
            </div>

            <div class="buttons four" style="margin-top: 7px;">
              <button id="youtubePlayBtn" class="success">Play</button>
              <button id="youtubePauseBtn" class="warning">Pause</button>
              <button id="youtubeBackBtn">-10s</button>
              <button id="youtubeForwardBtn">+10s</button>
            </div>

            <div class="buttons three" style="margin-top: 7px;">
              <button id="youtubeStopBtn">Stop</button>
              <button id="youtubeMuteBtn">Mudo</button>
              <button id="youtubeUnmuteBtn">Som</button>
            </div>

            <div class="field" style="margin-top: 8px;">
              <label for="youtubeVolumeRange">Volume sincronizado <span id="youtubeVolumeValue" class="range-value">70%</span></label>
              <input id="youtubeVolumeRange" type="range" min="0" max="100" step="1" value="70" />
            </div>
          </div>

          <div id="videoLibraryList" class="video-library-list" style="margin-top: 8px;">
            <div class="library-empty">Nenhum vídeo preparado.</div>
          </div>

          <div class="buttons two" style="margin-top: 8px;">
            <button id="removeYoutubeBtn" class="warning">Remover vídeo</button>
            <button id="clearYoutubeBtn" class="danger">Limpar vídeos</button>
          </div>

          <div class="status" id="youtubeStatus">Servidor JavaScript local. Sem Python e sem chave da API de dados do YouTube.</div>
        </section>

        <section class="panel">
          <h2>5. Biblioteca de tokens</h2>
          <input class="file-input" id="tokenInput" type="file" multiple accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg" />
          <div class="mini-note">Tokens aceitos: JPG, PNG, WebP, GIF, BMP ou SVG. Limite prático: até 15 MB por token.</div>

          <div id="tokenLibraryList" class="token-library-grid" style="margin-top: 8px;"></div>

          <div class="buttons two" style="margin-top: 8px;">
            <button id="addTokenToMapBtn" class="success">Adicionar</button>
            <button id="removeTokenSourceBtn" class="danger">Excluir</button>
          </div>

          <div class="buttons four" style="margin-top: 7px;">
            <button id="tokenSizeDownBtn">-</button>
            <button id="tokenSizeUpBtn">+</button>
            <button id="removeMapTokenBtn" class="warning">Rem.</button>
            <button id="clearMapTokensBtn" class="danger">Limpar</button>
          </div>

          <div class="status" id="tokenStatus">Nenhum token carregado.</div>
        </section>

        <section class="panel">
          <h2>6. Ajuste da cena</h2>

          <div class="quick-grid">
            <div class="field">
              <label for="fitSelect">Ajuste</label>
              <select id="fitSelect">
                <option value="contain">Mostrar inteiro</option>
                <option value="cover">Preencher</option>
                <option value="stretch">Esticar</option>
              </select>
            </div>

            <div class="field">
              <label>&nbsp;</label>
              <button id="resetViewBtn">Resetar</button>
            </div>
          </div>

          <div class="buttons four">
            <button id="zoomOutBtn">Zoom -</button>
            <button id="zoomInBtn">Zoom +</button>
            <button id="rotateLeftBtn">-90°</button>
            <button id="rotateRightBtn">+90°</button>
          </div>

          <div class="status" id="viewStatus">Zoom: 100% | Rotação: 0°</div>
        </section>

        <section class="panel">
          <h2>7. Texto rápido</h2>
          <div class="field">
            <label for="quickTextTitle">Nome</label>
            <input id="quickTextTitle" type="text" placeholder="Ex: Carta da Clínica Aurora" />
          </div>

          <div class="field">
            <label for="quickText">Texto</label>
            <textarea id="quickText" placeholder="Ex: Ao abrir o envelope..."></textarea>
          </div>

          <button id="prepareTextBtn">Adicionar texto</button>
        </section>
      </aside>

      <section class="stage">
        <div class="stage-header">
          <div>
            <strong>Prévia privada do Mestre</strong><br />
            <small id="previewTitle">Nada preparado ainda.</small>
          </div>
          <small id="previewHelp">A prévia respeita a proporção escolhida.</small>
        </div>

      </section>

      <aside class="notesbar">
        <section class="panel">
          <h2>Anotações do Mestre</h2>
          <p>Iniciativa, PV, consequências e pontos importantes.</p>

          <div class="field">
            <label for="notesInitiatives">Iniciativas</label>
            <textarea class="notes-area" id="notesInitiatives" placeholder="18 - Lukan&#10;15 - Goblin&#10;13 - Wilhelm"></textarea>
          </div>

          <div class="field">
            <label for="notesHp">Vida / recursos</label>
            <textarea class="notes-area" id="notesHp" placeholder="Wilhelm: 32/40 PV&#10;Vargan: 58/80 PV"></textarea>
          </div>

          <div class="field">
            <label for="notesImportant">Eventos importantes</label>
            <textarea class="notes-area large" id="notesImportant" placeholder="- O grupo poupou o guarda.&#10;- Callahan pegou o documento."></textarea>
          </div>

          <div class="field">
            <label for="notesStory">Lembrar depois</label>
            <textarea class="notes-area large" id="notesStory" placeholder="- Criar consequência para a próxima sessão."></textarea>
          </div>

          <div class="buttons two">
            <button id="saveNotesBtn" class="success">Salvar</button>
            <button id="clearNotesBtn" class="danger">Limpar</button>
          </div>

          <div class="notes-save-status" id="notesSaveStatus">Notas salvas automaticamente neste navegador.</div>
        </section>
      </aside>
    </main>
  `;

  const previewArea = document.getElementById("previewArea");
  const previewStack = document.getElementById("previewStack");
  const masterPreview = document.getElementById("masterPreview");
  const toolbarDock = document.getElementById("toolbarDock");
  const previewTitle = document.getElementById("previewTitle");
  const previewHelp = document.getElementById("previewHelp");
  const fileInput = document.getElementById("fileInput");
  const fileInfo = document.getElementById("fileInfo");
  const playerStatus = document.getElementById("playerStatus");
  const fitSelect = document.getElementById("fitSelect");
  const viewStatus = document.getElementById("viewStatus");
  const libraryList = document.getElementById("libraryList");

  const tokenInput = document.getElementById("tokenInput");
  const tokenLibraryList = document.getElementById("tokenLibraryList");
  const tokenStatus = document.getElementById("tokenStatus");

  const floatingToolbar = document.getElementById("floatingToolbar");
  const toolbarToggleBtn = document.getElementById("toolbarToggleBtn");
  const toolbarToggleIcon = document.getElementById("toolbarToggleIcon");
  const toolbarToggleText = document.getElementById("toolbarToggleText");

  const toggleGridBtn = document.getElementById("toggleGridBtn");
  const togglePointerBtn = document.getElementById("togglePointerBtn");
  const toolLineBtn = document.getElementById("toolLineBtn");
  const toolCircleBtn = document.getElementById("toolCircleBtn");
  const toolSquareBtn = document.getElementById("toolSquareBtn");
  const toolConeBtn = document.getElementById("toolConeBtn");
  const clearMeasurementsToolBtn = document.getElementById("clearMeasurementsToolBtn");
  const clearToolsBtn = document.getElementById("clearToolsBtn");

  const quickLineBtn = document.getElementById("quickLineBtn");
  const quickCircleBtn = document.getElementById("quickCircleBtn");
  const quickSquareBtn = document.getElementById("quickSquareBtn");
  const quickConeBtn = document.getElementById("quickConeBtn");

  const screenRatioSelect = document.getElementById("screenRatioSelect");
  const screenRatioStatus = document.getElementById("screenRatioStatus");

  const gridEnabledCheck = document.getElementById("gridEnabledCheck");
  const gridShowPlayersCheck = document.getElementById("gridShowPlayersCheck");
  const gridSnapCheck = document.getElementById("gridSnapCheck");
  const gridColumnsInput = document.getElementById("gridColumnsInput");
  const gridRowsInput = document.getElementById("gridRowsInput");
  const gridMetersInput = document.getElementById("gridMetersInput");
  const gridColorInput = document.getElementById("gridColorInput");
  const gridThicknessInput = document.getElementById("gridThicknessInput");
  const gridOpacityInput = document.getElementById("gridOpacityInput");
  const gridThicknessValue = document.getElementById("gridThicknessValue");
  const gridOpacityValue = document.getElementById("gridOpacityValue");
  const gridStatus = document.getElementById("gridStatus");

  const rulerModeSelect = document.getElementById("rulerModeSelect");
  const effectFixedCheck = document.getElementById("effectFixedCheck");
  const effectFixedMetersInput = document.getElementById("effectFixedMetersInput");
  const effectColorInput = document.getElementById("effectColorInput");

  const notesInitiatives = document.getElementById("notesInitiatives");
  const notesHp = document.getElementById("notesHp");
  const notesImportant = document.getElementById("notesImportant");
  const notesStory = document.getElementById("notesStory");
  const notesSaveStatus = document.getElementById("notesSaveStatus");

  let notesSaveTimer = null;

  function updateToolbarState() {
    floatingToolbar.classList.toggle("collapsed", toolbarCollapsed);
    toolbarToggleIcon.textContent = toolbarCollapsed ? "☰" : "⇤";
    toolbarToggleText.textContent = toolbarCollapsed ? "Abrir" : "Recolher";
  }

  function updateScreenSize() {
    const reservedHeight = toolbarDock.offsetHeight || 68;
    fitVirtualScreen(masterPreview, previewArea, screenRatio, reservedHeight);
    previewStack.style.width = masterPreview.style.width;
    renderMasterOverlays();
  }

  function updateSelectedFromId() {
    stagedItem = getSelectedItem();
  }

  function renderMasterOverlays() {
    const tokensInteractive = !pointerEnabled && !rulerEnabled && !isDrawingMeasure && !measureDrag;

    renderGrid(masterPreview, gridSettings, !stagedItem);
    renderTokens(masterPreview, mapTokens, {
      master: true,
      selectedId: selectedMapTokenId,
      tokensInteractive,
      forceHidden: !stagedItem,
      onTokenPointerDown: startTokenDrag
    });
    renderMeasurements(masterPreview, getVisibleMeasurements(), gridSettings, !stagedItem, {
      master: true,
      onDeleteMeasurement: deleteMeasurement,
      onMoveMeasurementPointerDown: startMeasurementDrag,
      onEditMeasurementNote: editMeasurementNote,
      onUpdateMeasurementColor: updateMeasurementColor
    });
    renderPointer(masterPreview, masterPointer);
  }

  function updateToolButtons() {
    toggleGridBtn.classList.toggle("active-tool", gridSettings.enabled);
    togglePointerBtn.classList.toggle("active-tool", pointerEnabled);

    toolLineBtn.classList.toggle("active-tool", rulerEnabled && rulerSettings.mode === "line");
    toolCircleBtn.classList.toggle("active-tool", rulerEnabled && rulerSettings.mode === "circle");
    toolSquareBtn.classList.toggle("active-tool", rulerEnabled && rulerSettings.mode === "square");
    toolConeBtn.classList.toggle("active-tool", rulerEnabled && rulerSettings.mode === "cone");

    quickLineBtn.classList.toggle("active-quick", rulerEnabled && rulerSettings.mode === "line");
    quickCircleBtn.classList.toggle("active-quick", rulerEnabled && rulerSettings.mode === "circle");
    quickSquareBtn.classList.toggle("active-quick", rulerEnabled && rulerSettings.mode === "square");
    quickConeBtn.classList.toggle("active-quick", rulerEnabled && rulerSettings.mode === "cone");

    masterPreview.classList.toggle("pointer-mode", pointerEnabled);
    masterPreview.classList.toggle("ruler-mode", rulerEnabled);
    masterPreview.classList.toggle("measure-move-mode", Boolean(measureDrag));
  }

  function updateGridFields() {
    gridEnabledCheck.checked = Boolean(gridSettings.enabled);
    gridShowPlayersCheck.checked = Boolean(gridSettings.showOnPlayers);
    gridSnapCheck.checked = Boolean(gridSettings.snapToGrid);
    gridColumnsInput.value = gridSettings.columns;
    gridRowsInput.value = gridSettings.rows;
    gridMetersInput.value = gridSettings.metersPerSquare;
    gridColorInput.value = gridSettings.color || "#ffffff";
    gridThicknessInput.value = gridSettings.thickness || 1;
    gridOpacityInput.value = gridSettings.opacity || 0.34;

    rulerModeSelect.value = rulerSettings.mode;
    effectFixedCheck.checked = Boolean(rulerSettings.useFixedSize);
    effectFixedMetersInput.value = rulerSettings.fixedMeters;
    effectColorInput.value = rulerSettings.color || "#22d3ee";

    gridThicknessValue.textContent = `${gridSettings.thickness || 1}px`;
    gridOpacityValue.textContent = `${Math.round((gridSettings.opacity || 0.34) * 100)}%`;
    gridStatus.textContent = `Grid: ${gridSettings.enabled ? "ligado" : "desligado"} | ${gridSettings.columns} x ${gridSettings.rows} | ${formatMeters(gridSettings.metersPerSquare)} m por quadrado`;
  }

  function updatePreview() {
    updateSelectedFromId();

    renderMasterItemIfNeeded(masterPreview);
    updateScreenSize();
    updateToolButtons();
    updateToolbarState();

    if (stagedItem) {
      previewTitle.textContent = stagedItem.name || "Conteúdo preparado";
      fitSelect.value = stagedItem.fit || "contain";
      viewStatus.textContent = `Zoom: ${Math.round((stagedItem.zoom || 1) * 100)}% | Rotação: ${stagedItem.rotation || 0}°`;
    } else {
      previewTitle.textContent = "Nada preparado ainda.";
      viewStatus.textContent = "Zoom: 100% | Rotação: 0°";
    }

    screenRatioSelect.value = screenRatio;
    screenRatioStatus.textContent = `Tela virtual: ${getRatioLabel(screenRatio)}`;
    updateGridFields();
    updateYoutubeControlPanel(stagedItem);

    if (measureDrag) previewHelp.textContent = "Movendo medição selecionada.";
    else if (rulerEnabled) previewHelp.textContent = "Ferramenta de área ativa. Ela funciona por cima dos tokens.";
    else if (pointerEnabled) previewHelp.textContent = "Pointer ativo.";
    else previewHelp.textContent = "Arraste tokens ou use as ferramentas.";
  }

  function renderLibrary() {
    libraryList.innerHTML = "";

    const sceneItems = library.filter(item => item.kind !== "youtube");

    if (sceneItems.length === 0) {
      const empty = document.createElement("div");
      empty.className = "library-empty";
      //empty.textContent = "Nenhuma imagem, mapa ou cena preparada.";
      libraryList.appendChild(empty);
      return;
    }

    sceneItems.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "library-card" + (item.id === selectedId ? " active" : "");
      card.title = item.name || "Sem nome";

      const thumb = document.createElement("div");
      thumb.className = "library-thumb";

      if (item.kind === "image") {
        const img = document.createElement("img");
        img.src = item.data;
        thumb.appendChild(img);
      } else if (item.kind === "pdf") {
        thumb.textContent = "PDF";
      } else if (item.kind === "text") {
        thumb.textContent = "TXT";
      } else if (item.kind === "youtube") {
        if (item.thumb) {
          const img = document.createElement("img");
          img.src = item.thumb;
          thumb.appendChild(img);
        } else {
          thumb.textContent = "YT";
        }
      } else {
        thumb.textContent = "ARQ";
      }

      //const number = document.createElement("div");
      //number.className = "library-number";
      //number.textContent = index + 1;

      //const caption = document.createElement("div");
      //caption.className = "library-caption";

      //const title = document.createElement("div");
      //title.className = "library-title";
      //title.textContent = item.name || "Sem nome";

      //const meta = document.createElement("div");
      //meta.className = "library-meta";
      //meta.textContent = `${getKindLabel(item.kind)}${item.size ? " | " + formatFileSize(item.size) : ""}`;

     // caption.appendChild(title);
      //caption.appendChild(meta);
      card.appendChild(thumb);
      //card.appendChild(number);
      //card.appendChild(caption);

      card.addEventListener("click", () => selectItem(item.id));
      card.addEventListener("dblclick", () => {
        selectItem(item.id);
        showSelectedOnTv();
      });

      libraryList.appendChild(card);
    });
  }

  function renderTokenLibrary() {
    tokenLibraryList.innerHTML = "";

    if (tokenLibrary.length === 0) {
      const empty = document.createElement("div");
      empty.className = "library-empty";
      empty.textContent = "Nenhum token.";
      tokenLibraryList.appendChild(empty);
      return;
    }

    tokenLibrary.forEach((token, index) => {
      const card = document.createElement("div");
      card.className = "library-card" + (token.id === selectedTokenSourceId ? " active" : "");
      card.title = token.name || "Token";

      const thumb = document.createElement("div");
      thumb.className = "library-thumb";
      const img = document.createElement("img");
      img.src = token.data;
      img.alt = token.name || "Token";
      thumb.appendChild(img);

      const number = document.createElement("div");
      number.className = "library-number";
      number.textContent = index + 1;

      const caption = document.createElement("div");
      caption.className = "library-caption";

      const title = document.createElement("div");
      title.className = "library-title";
      title.textContent = token.name || "Token";

      caption.appendChild(title);
      card.appendChild(thumb);
      card.appendChild(number);
      card.appendChild(caption);

      card.addEventListener("click", () => {
        selectedTokenSourceId = token.id;
        renderTokenLibrary();
      });

      card.addEventListener("dblclick", () => {
        selectedTokenSourceId = token.id;
        addSelectedTokenToMap();
      });

      tokenLibraryList.appendChild(card);
    });
  }

  function selectItem(id) {
    selectedId = id;
    masterPointer.visible = false;
    measurements = [];
    measureDraft = null;
    measureDrag = null;
    clearPointerTrail(masterPreview);
    sendToPlayers(createMessage("hidePointer"));
    sendMeasurementsState();
    renderLibrary();
    renderVideoLibrary();
    updatePreview();
  }

  function ensureSelected() {
    if (!selectedId || !getSelectedItem()) {
      alert("Selecione um item da biblioteca primeiro.");
      return false;
    }
    return true;
  }

  function showSelectedOnTv() {
    if (!ensureSelected()) return;

    updateSelectedFromId();
    publishedItem = deepClone(stagedItem);

    masterPointer.visible = false;
    clearPointerTrail(masterPreview);
    renderMasterOverlays();

    sendScreenSettings();
    sendGridSettings();
    sendToPlayers(createMessage("show", { item: publishedItem, screenRatio, gridSettings }));
    sendTokenState();
    sendMeasurementsState();
    sendToPlayers(createMessage("hidePointer"));
  }

  function removeItem(id) {
    const item = library.find(entry => entry.id === id);
    if (!item) return;

    const confirmDelete = confirm(`Excluir "${item.name}" da biblioteca?`);
    if (!confirmDelete) return;

    library = library.filter(entry => entry.id !== id);

    if (selectedId === id) {
      selectedId = library[0]?.id || null;
      stagedItem = getSelectedItem();
      measurements = [];
      measureDraft = null;
      measureDrag = null;
    }

    renderLibrary();
    renderVideoLibrary();
    updatePreview();
  }

  function updateItemView(partial) {
    if (!ensureSelected()) return;
    const item = getSelectedItem();
    Object.assign(item, partial);
    updatePreview();
    renderLibrary();
    renderVideoLibrary();
  }

  async function addFilesToLibrary(files) {
    const fileArray = Array.from(files || []);
    if (fileArray.length === 0) return;

    fileInfo.textContent = `Carregando ${fileArray.length} arquivo(s)...`;

    const items = [];
    const rejected = [];

    for (const file of fileArray) {
      const kind = getFileKind(file);

      if (kind === "unknown") {
        rejected.push(`${file.name}: formato não suportado`);
        continue;
      }

      if (file.size > SCENE_MAX_BYTES) {
        rejected.push(`${file.name}: ${describeBytes(file.size)} acima do limite de ${describeBytes(SCENE_MAX_BYTES)}`);
        continue;
      }

      try {
        const item = await readFileAsItem(file);
        if (item) items.push(item);
      } catch (error) {
        console.warn("Erro ao carregar arquivo:", file.name, error);
        rejected.push(`${file.name}: erro de leitura após tentativas. Verifique se o arquivo não está aberto/corrompido.`);
      }
    }

    if (items.length === 0) {
      fileInfo.textContent = rejected.length
        ? `Nenhum arquivo carregado. ${rejected.slice(0, 2).join(" | ")}${rejected.length > 2 ? "..." : ""}`
        : "Nenhum arquivo compatível foi carregado.";
      return;
    }

    library.push(...items);
    selectedId = items[0].id;

    fileInfo.textContent = `${items.length} item(ns) adicionados.${rejected.length ? ` ${rejected.length} ignorado(s): ${rejected.slice(0, 2).join(" | ")}${rejected.length > 2 ? "..." : ""}` : ""}`;
    renderLibrary();
    renderVideoLibrary();
    updatePreview();
  }

  async function addFilesToTokenLibrary(files) {
    const fileArray = Array.from(files || []);
    if (fileArray.length === 0) return;

    tokenStatus.textContent = `Carregando ${fileArray.length} token(s)...`;

    const items = [];
    const rejected = [];

    for (const file of fileArray) {
      if (!isImageFile(file)) {
        rejected.push(`${file.name}: token precisa ser imagem`);
        continue;
      }

      if (file.size > TOKEN_MAX_BYTES) {
        rejected.push(`${file.name}: ${describeBytes(file.size)} acima do limite de ${describeBytes(TOKEN_MAX_BYTES)}`);
        continue;
      }

      try {
        const item = await readTokenFile(file);
        if (item) items.push(item);
      } catch (error) {
        console.warn("Erro ao carregar token:", file.name, error);
        rejected.push(`${file.name}: erro de leitura após tentativas. Verifique se o arquivo não está aberto/corrompido.`);
      }
    }

    if (items.length === 0) {
      tokenStatus.textContent = rejected.length
        ? `Nenhum token carregado. ${rejected.slice(0, 2).join(" | ")}${rejected.length > 2 ? "..." : ""}`
        : "Nenhum token compatível foi carregado.";
      return;
    }

    tokenLibrary.push(...items);
    selectedTokenSourceId = items[0].id;
    tokenStatus.textContent = `${items.length} token(s) adicionados.${rejected.length ? ` ${rejected.length} ignorado(s): ${rejected.slice(0, 2).join(" | ")}${rejected.length > 2 ? "..." : ""}` : ""}`;
    renderTokenLibrary();
  }

  function addSelectedTokenToMap() {
    const source = getSelectedTokenSource();

    if (!source) {
      alert("Selecione um token da biblioteca primeiro.");
      return;
    }

    const token = { id: createId(), sourceId: source.id, name: source.name, data: source.data, x: 0.5, y: 0.5, size: 7 };
    mapTokens.push(token);
    selectedMapTokenId = token.id;
    renderMasterOverlays();
    sendTokenState();
    tokenStatus.textContent = "Token adicionado ao mapa.";
  }

  function removeSelectedTokenSource() {
    if (!selectedTokenSourceId) {
      alert("Selecione um token da biblioteca primeiro.");
      return;
    }

    const source = getSelectedTokenSource();
    const confirmDelete = confirm(`Excluir "${source?.name || "token"}" da biblioteca?`);
    if (!confirmDelete) return;

    tokenLibrary = tokenLibrary.filter(token => token.id !== selectedTokenSourceId);
    selectedTokenSourceId = tokenLibrary[0]?.id || null;
    renderTokenLibrary();
  }

  function removeSelectedMapToken() {
    if (!selectedMapTokenId) {
      alert("Selecione um token no mapa primeiro.");
      return;
    }

    mapTokens = mapTokens.filter(token => token.id !== selectedMapTokenId);
    selectedMapTokenId = null;
    renderMasterOverlays();
    sendTokenState();
  }

  function clearMapTokens() {
    if (mapTokens.length === 0) return;
    const confirmClear = confirm("Remover todos os tokens do mapa?");
    if (!confirmClear) return;

    mapTokens = [];
    selectedMapTokenId = null;
    renderMasterOverlays();
    sendTokenState();
  }

  function resizeSelectedMapToken(delta) {
    const token = getSelectedMapToken();
    if (!token) {
      alert("Selecione um token no mapa primeiro.");
      return;
    }
    token.size = Math.max(2, Math.min(20, Number(token.size || 7) + delta));
    renderMasterOverlays();
    sendTokenState();
  }

  function getYoutubeThumb(item) {
    if (item.thumb) return item.thumb;
    if (!item.videoId) return null;
    return `https://img.youtube.com/vi/${encodeURIComponent(item.videoId)}/hqdefault.jpg`;
  }

  function getVideoItems() {
    return library.filter(item => item.kind === "youtube");
  }

  function addYoutubeLinkAsScene(showAfterAdd = false) {
    const input = document.getElementById("youtubeLinkInput");
    const titleInput = document.getElementById("youtubeTitleInput");
    const status = document.getElementById("youtubeStatus");

    const videoId = extractYoutubeVideoId(input?.value || "");

    if (!videoId) {
      alert("Cole um link válido do YouTube, YouTube, YouTube Music, youtu.be ou um ID de vídeo.");
      return null;
    }

    const title = titleInput?.value.trim() || `YouTube - ${videoId}`;
    const existing = library.find(item => item.kind === "youtube" && item.videoId === videoId);

    let scene;
    if (existing) {
      scene = existing;
      scene.name = title;
      scene.title = title;
    } else {
      scene = {
        id: createId(),
        kind: "youtube",
        name: title,
        title,
        artist: "",
        duration: "",
        resultType: "video",
        videoId,
        thumb: `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`,
        size: 0,
        fit: "stretch",
        zoom: 1,
        rotation: 0
      };
      library.push(scene);
    }

    selectedId = scene.id;
    if (input) input.value = "";
    if (titleInput) titleInput.value = "";

    renderLibrary();
    renderVideoLibrary();
    updatePreview();
    updateYoutubeControlPanel(scene, true);

    if (status) status.textContent = "Vídeo preparado. Use o player pequeno ou clique em Mostrar cena.";

    if (showAfterAdd) showSelectedOnTv();
    return scene;
  }

  function renderVideoLibrary() {
    const box = document.getElementById("videoLibraryList");
    if (!box) return;

    const videos = getVideoItems();
    if (!videos.length) {
      box.innerHTML = `<div class="library-empty">Nenhum vídeo preparado.</div>`;
      return;
    }

    box.innerHTML = "";
    videos.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "video-card" + (item.id === selectedId ? " active" : "");
      card.title = item.name || item.title || "Vídeo";

      const thumb = document.createElement("div");
      thumb.className = "video-card-thumb";
      const thumbUrl = getYoutubeThumb(item);
      if (thumbUrl) {
        const img = document.createElement("img");
        img.src = thumbUrl;
        img.alt = item.name || "Vídeo";
        thumb.appendChild(img);
      } else {
        thumb.textContent = "YT";
      }

      const info = document.createElement("div");
      info.className = "video-card-info";
      info.innerHTML = `
        <div class="video-card-title">${escapeHtml(item.name || item.title || "Vídeo")}</div>
        <div class="video-card-meta">${escapeHtml(item.videoId || "")}</div>
      `;

      const actions = document.createElement("div");
      actions.className = "video-card-actions";

      const showBtn = document.createElement("button");
      showBtn.className = "success";
      showBtn.textContent = "Mostrar";
      showBtn.addEventListener("click", event => {
        event.stopPropagation();
        selectedId = item.id;
        renderLibrary();
        renderVideoLibrary();
        updatePreview();
        updateYoutubeControlPanel(item, true);
        showSelectedOnTv();
      });

      const selectBtn = document.createElement("button");
      selectBtn.textContent = "Prévia";
      selectBtn.addEventListener("click", event => {
        event.stopPropagation();
        selectItem(item.id);
        updateYoutubeControlPanel(item, true);
      });

      actions.appendChild(showBtn);
      actions.appendChild(selectBtn);

      card.appendChild(thumb);
      card.appendChild(info);
      card.appendChild(actions);

      card.addEventListener("click", () => selectItem(item.id));
      card.addEventListener("dblclick", () => {
        selectItem(item.id);
        showSelectedOnTv();
      });

      box.appendChild(card);
    });
  }

  function removeSelectedYoutubeScene() {
    const item = getSelectedItem();
    if (!item || item.kind !== "youtube") {
      alert("Selecione um vídeo da biblioteca primeiro.");
      return;
    }

    const confirmDelete = confirm(`Remover "${item.name || item.title || "vídeo"}" da biblioteca de vídeos?`);
    if (!confirmDelete) return;

    library = library.filter(entry => entry.id !== item.id);
    selectedId = library[0]?.id || null;
    stagedItem = getSelectedItem();
    measurements = [];
    measureDraft = null;
    measureDrag = null;

    renderLibrary();
    renderVideoLibrary();
    updatePreview();
  }

  function clearYoutubeScenes() {
    const videos = getVideoItems();
    if (!videos.length) return;

    const confirmClear = confirm("Remover todos os vídeos preparados?");
    if (!confirmClear) return;

    const ids = new Set(videos.map(item => item.id));
    library = library.filter(item => !ids.has(item.id));
    if (selectedId && ids.has(selectedId)) selectedId = library[0]?.id || null;
    stagedItem = getSelectedItem();
    measurements = [];
    measureDraft = null;
    measureDrag = null;

    renderLibrary();
    renderVideoLibrary();
    updatePreview();
  }

  function startTokenDrag(event, tokenId) {
    if (pointerEnabled || rulerEnabled || measureDrag) return;

    event.preventDefault();
    event.stopPropagation();

    selectedMapTokenId = tokenId;
    tokenDrag = { tokenId, pointerId: event.pointerId };
    masterPreview.setPointerCapture?.(event.pointerId);
    renderMasterOverlays();
  }

  function updateTokenDrag(event) {
    if (!tokenDrag) return;

    event.preventDefault();
    event.stopPropagation();

    const token = mapTokens.find(entry => entry.id === tokenDrag.tokenId);
    if (!token) return;

    const snapSettings = gridSettings.enabled && gridSettings.snapToGrid ? gridSettings : null;
    const point = getPointFromEvent(event, masterPreview, snapSettings);

    token.x = point.x;
    token.y = point.y;

    renderMasterOverlays();
    sendTokenState();
  }

  function finishTokenDrag(event) {
    if (!tokenDrag) return;
    event.preventDefault();
    event.stopPropagation();
    updateTokenDrag(event);
    tokenDrag = null;
  }

  function startMeasurementDrag(event, measurementId) {
    event.preventDefault();
    event.stopPropagation();

    const measurement = measurements.find(item => item.id === measurementId);
    if (!measurement) return;

    const origin = getPointFromEvent(event, masterPreview, null);

    measureDrag = {
      id: measurementId,
      pointerId: event.pointerId,
      origin,
      originalStart: deepClone(measurement.start),
      originalEnd: deepClone(measurement.end)
    };

    masterPreview.setPointerCapture?.(event.pointerId);

    pointerEnabled = false;
    isDrawingMeasure = false;
    measureDraft = null;

    renderMasterOverlays();
    updateToolButtons();
  }

  function updateMeasurementDrag(event) {
    if (!measureDrag) return;

    event.preventDefault();
    event.stopPropagation();

    const measurement = measurements.find(item => item.id === measureDrag.id);
    if (!measurement) return;

    const current = getPointFromEvent(event, masterPreview, null);

    let dx = current.x - measureDrag.origin.x;
    let dy = current.y - measureDrag.origin.y;

    const sx = measureDrag.originalStart.x + dx;
    const sy = measureDrag.originalStart.y + dy;
    const ex = measureDrag.originalEnd.x + dx;
    const ey = measureDrag.originalEnd.y + dy;

    const minX = Math.min(sx, ex);
    const maxX = Math.max(sx, ex);
    const minY = Math.min(sy, ey);
    const maxY = Math.max(sy, ey);

    if (minX < 0) dx -= minX;
    if (maxX > 1) dx -= (maxX - 1);
    if (minY < 0) dy -= minY;
    if (maxY > 1) dy -= (maxY - 1);

    const newStart = { x: measureDrag.originalStart.x + dx, y: measureDrag.originalStart.y + dy };
    const newEnd = { x: measureDrag.originalEnd.x + dx, y: measureDrag.originalEnd.y + dy };

    measurement.start = snapPointToGridIfNeeded(newStart);
    measurement.end = snapPointToGridIfNeeded(newEnd);

    renderMasterOverlays();
    sendMeasurementsState();
  }

  function finishMeasurementDrag(event) {
    if (!measureDrag) return;
    event.preventDefault();
    event.stopPropagation();
    updateMeasurementDrag(event);
    measureDrag = null;
    renderMasterOverlays();
    updateToolButtons();
    updatePreview();
    sendMeasurementsState();
  }

  function editMeasurementNote(id) {
    const measurement = measurements.find(item => item.id === id);
    if (!measurement) return;

    const current = measurement.note || "";
    const next = prompt("Nota do efeito/medição\nEx: Fogo 2 turnos, Área 1, Silêncio, Lentidão 3T", current);

    if (next === null) return;

    measurement.note = String(next || "").trim();
    renderMasterOverlays();
    sendMeasurementsState();
  }

  function updateMeasurementColor(id, color) {
    const measurement = measurements.find(item => item.id === id);
    if (!measurement) return;

    measurement.color = color || "#22d3ee";
    renderMasterOverlays();
    sendMeasurementsState();
  }

  function deleteMeasurement(id) {
    measurements = measurements.filter(item => item.id !== id);
    if (measureDrag && measureDrag.id === id) measureDrag = null;
    renderMasterOverlays();
    updateToolButtons();
    sendMeasurementsState();
  }

  function setPointerMode(enabled) {
    pointerEnabled = enabled;

    if (pointerEnabled) {
      rulerEnabled = false;
      isDrawingMeasure = false;
      measureDraft = null;
      measureDrag = null;
    }

    if (!pointerEnabled) {
      masterPointer.visible = false;
      clearPointerTrail(masterPreview);
      sendToPlayers(createMessage("hidePointer"));
    }

    renderMasterOverlays();
    updateToolButtons();
    updatePreview();
  }

  function setAreaTool(mode) {
    rulerSettings.mode = mode;
    rulerModeSelect.value = mode;
    rulerEnabled = true;
    pointerEnabled = false;
    measureDrag = null;
    masterPointer.visible = false;
    clearPointerTrail(masterPreview);
    sendToPlayers(createMessage("hidePointer"));

    if (!gridSettings.enabled) {
      gridSettings.enabled = true;
      sendGridSettings();
    }

    updateGridFields();
    renderMasterOverlays();
    updateToolButtons();
    updatePreview();
  }

  function toggleGridQuick() {
    gridSettings.enabled = !gridSettings.enabled;

    if (!gridSettings.enabled) clearMeasurements();

    updateGridFields();
    renderMasterOverlays();
    updateToolButtons();
    sendGridSettings();
  }

  function clearAllTools() {
    pointerEnabled = false;
    rulerEnabled = false;
    isDrawingMeasure = false;
    measureDraft = null;
    measureDrag = null;
    masterPointer.visible = false;

    clearPointerTrail(masterPreview);
    renderMasterOverlays();
    updateToolButtons();

    sendToPlayers(createMessage("hidePointer"));
    sendMeasurementsState();

    updatePreview();
  }

  function sendPointerFromEvent(event) {
    if (!pointerEnabled) return;

    event.preventDefault();
    event.stopPropagation();

    if (!stagedItem) {
      alert("Selecione um mapa, imagem, PDF ou texto antes de usar o pointer.");
      setPointerMode(false);
      return;
    }

    const now = performance.now();
    if (event.type === "pointermove" && now - lastPointerSentAt < 16) return;
    lastPointerSentAt = now;

    const point = getPointFromEvent(event, masterPreview, null);

    masterPointer = { visible: true, x: point.x, y: point.y };

    addPointerTrail(masterPreview, point.x, point.y);
    renderPointer(masterPreview, masterPointer);

    sendToPlayers(createMessage("pointer", { pointer: masterPointer, trail: true }));
  }

  function startMeasure(event) {
    if (!rulerEnabled || measureDrag) return;

    event.preventDefault();
    event.stopPropagation();

    if (!stagedItem) {
      alert("Selecione um mapa ou imagem antes de usar a ferramenta de área.");
      rulerEnabled = false;
      updateToolButtons();
      return;
    }

    if (!gridSettings.enabled) {
      alert("Ative o grid antes de usar a ferramenta de área.");
      return;
    }

    isDrawingMeasure = true;
    const point = getPointFromEvent(event, masterPreview, gridSettings);

    measureDraft = {
      id: createId(),
      visible: true,
      draft: true,
      mode: rulerSettings.mode,
      start: point,
      end: point,
      useFixedSize: rulerSettings.useFixedSize,
      fixedMeters: rulerSettings.fixedMeters,
      color: rulerSettings.color || "#22d3ee",
      note: ""
    };

    masterPreview.setPointerCapture?.(event.pointerId);
    renderMasterOverlays();
    sendMeasurementsState();
  }

  function updateMeasure(event) {
    if (!rulerEnabled || !isDrawingMeasure || !measureDraft || measureDrag) return;
    event.preventDefault();
    event.stopPropagation();
    measureDraft.end = getPointFromEvent(event, masterPreview, gridSettings);
    renderMasterOverlays();
    sendMeasurementsState();
  }

  function finishMeasure(event) {
    if (!rulerEnabled || !isDrawingMeasure || !measureDraft || measureDrag) return;

    event.preventDefault();
    event.stopPropagation();

    isDrawingMeasure = false;
    measureDraft.end = getPointFromEvent(event, masterPreview, gridSettings);

    const finalMeasure = deepClone(measureDraft);
    delete finalMeasure.draft;

    measurements.push(finalMeasure);
    measureDraft = null;

    renderMasterOverlays();
    sendMeasurementsState();
  }

  function clearMeasurements() {
    measurements = [];
    measureDraft = null;
    measureDrag = null;
    isDrawingMeasure = false;

    renderMasterOverlays();
    sendMeasurementsState();
    updateToolButtons();
  }

  function applyGridSettingsFromFields() {
    gridSettings = {
      enabled: gridEnabledCheck.checked,
      columns: Math.max(1, Number(gridColumnsInput.value || 16)),
      rows: Math.max(1, Number(gridRowsInput.value || 9)),
      metersPerSquare: Math.max(0.1, Number(gridMetersInput.value || 1.5)),
      snapToGrid: gridSnapCheck.checked,
      showOnPlayers: gridShowPlayersCheck.checked,
      color: gridColorInput.value || "#ffffff",
      thickness: Math.max(1, Number(gridThicknessInput.value || 1)),
      opacity: Math.max(0.05, Math.min(1, Number(gridOpacityInput.value || 0.34)))
    };

    rulerSettings = {
      mode: rulerModeSelect.value || "line",
      useFixedSize: effectFixedCheck.checked,
      fixedMeters: Math.max(0.1, Number(effectFixedMetersInput.value || 3)),
      color: effectColorInput.value || "#22d3ee"
    };

    if (!gridSettings.enabled) clearMeasurements();

    updateGridFields();
    renderMasterOverlays();
    updateToolButtons();
    sendGridSettings();
    sendMeasurementsState();
  }

  function getCurrentNotes() {
    return {
      initiatives: notesInitiatives.value,
      hp: notesHp.value,
      important: notesImportant.value,
      story: notesStory.value
    };
  }

  function applyNotes(notes) {
    notesInitiatives.value = notes.initiatives || "";
    notesHp.value = notes.hp || "";
    notesImportant.value = notes.important || "";
    notesStory.value = notes.story || "";
  }

  function scheduleNotesSave() {
    clearTimeout(notesSaveTimer);
    notesSaveStatus.textContent = "Salvando...";

    notesSaveTimer = setTimeout(() => {
      saveNotes(getCurrentNotes());
      notesSaveStatus.textContent = "Notas salvas automaticamente.";
    }, 350);
  }

  function setupNotes() {
    applyNotes(loadNotes());

    [notesInitiatives, notesHp, notesImportant, notesStory].forEach(textarea => {
      textarea.addEventListener("input", scheduleNotesSave);
    });

    document.getElementById("saveNotesBtn").addEventListener("click", () => {
      saveNotes(getCurrentNotes());
      notesSaveStatus.textContent = "Notas salvas agora.";
    });

    document.getElementById("clearNotesBtn").addEventListener("click", () => {
      const confirmClear = confirm("Limpar todas as anotações do mestre?");
      if (!confirmClear) return;

      applyNotes({ initiatives: "", hp: "", important: "", story: "" });
      saveNotes(getCurrentNotes());
      notesSaveStatus.textContent = "Notas limpas.";
    });
  }

  ///ABRIR SEGUNDA TELA
document.getElementById("openPlayerBtn").addEventListener("click", () => {
  const url = new URL(window.location.href);

  // marca que é a tela dos jogadores
  url.searchParams.set("view", "player");

  playerWindow = window.open(
    url.toString(),
    "mesa-rpg-player",
    "popup=yes,width=1280,height=720"
  );

  if (playerWindow) {

    playerStatus.textContent =
      "Tela dos jogadores aberta. Arraste essa janela para a TV.";

    setTimeout(() => {
      sendScreenSettings();
      sendGridSettings();

      if (publishedItem) {
        sendToPlayers(
          createMessage("show", {
            item: publishedItem,
            screenRatio,
            gridSettings
          })
        );

        sendTokenState();
        sendMeasurementsState();

      } else {
        sendToPlayers(
          createMessage("blackout", { screenRatio })
        );
      }
    }, 500);

  } else {
    playerStatus.textContent =
      "O navegador bloqueou a janela. Permita pop-ups para este arquivo.";
  }
});

  fileInput.addEventListener("click", () => { fileInput.value = ""; });
  tokenInput.addEventListener("click", () => { tokenInput.value = ""; });

  fileInput.addEventListener("change", async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    await addFilesToLibrary(selectedFiles);
    fileInput.value = "";
  });

  tokenInput.addEventListener("change", async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    await addFilesToTokenLibrary(selectedFiles);
    tokenInput.value = "";
  });

  document.getElementById("prepareTextBtn").addEventListener("click", () => {
    const titleInput = document.getElementById("quickTextTitle");
    const textInput = document.getElementById("quickText");
    const text = textInput.value.trim();

    if (!text) {
      alert("Digite algum texto primeiro.");
      return;
    }

    const title = titleInput.value.trim() || "Texto rápido";
    const item = { id: createId(), kind: "text", name: title, text, ...defaultSettings };

    library.push(item);
    selectedId = item.id;

    titleInput.value = "";
    textInput.value = "";

    fileInfo.textContent = "Texto adicionado à biblioteca.";
    renderLibrary();
    renderVideoLibrary();
    updatePreview();
  });

  document.getElementById("addYoutubeBtn").addEventListener("click", () => addYoutubeLinkAsScene(false));
  document.getElementById("showYoutubeBtn").addEventListener("click", () => {
    const added = addYoutubeLinkAsScene(false);
    if (added) showSelectedOnTv();
  });
  document.getElementById("youtubeLinkInput").addEventListener("keydown", event => {
    if (event.key === "Enter") addYoutubeLinkAsScene(false);
  });
  document.getElementById("removeYoutubeBtn").addEventListener("click", removeSelectedYoutubeScene);
  document.getElementById("clearYoutubeBtn").addEventListener("click", clearYoutubeScenes);

  document.getElementById("youtubePlayBtn").addEventListener("click", () => broadcastYoutubeControl("play"));
  document.getElementById("youtubePauseBtn").addEventListener("click", () => broadcastYoutubeControl("pause"));
  document.getElementById("youtubeStopBtn").addEventListener("click", () => broadcastYoutubeControl("stop"));
  document.getElementById("youtubeBackBtn").addEventListener("click", () => broadcastYoutubeControl("seekRelative", -10));
  document.getElementById("youtubeForwardBtn").addEventListener("click", () => broadcastYoutubeControl("seekRelative", 10));
  document.getElementById("youtubeMuteBtn").addEventListener("click", () => broadcastYoutubeControl("mute"));
  document.getElementById("youtubeUnmuteBtn").addEventListener("click", () => broadcastYoutubeControl("unmute"));
  document.getElementById("youtubeVolumeRange").addEventListener("input", (event) => {
    const value = Number(event.target.value || 0);
    document.getElementById("youtubeVolumeValue").textContent = value + "%";
    broadcastYoutubeControl("volume", value);
  });

  document.getElementById("showSelectedSmallBtn").addEventListener("click", showSelectedOnTv);
  document.getElementById("showBtnTop").addEventListener("click", showSelectedOnTv);

  document.getElementById("removeSelectedBtn").addEventListener("click", () => {
    if (!ensureSelected()) return;
    const item = getSelectedItem();
    if (!item || item.kind === "youtube") {
      alert("Selecione uma imagem, mapa ou cena nesta biblioteca. Para vídeos, use a biblioteca de vídeos.");
      return;
    }
    removeItem(selectedId);
  });

  document.getElementById("clearLibraryBtn").addEventListener("click", () => {
    const sceneItems = library.filter(item => item.kind !== "youtube");
    if (sceneItems.length === 0) return;
    const confirmClear = confirm("Limpar todas as imagens, mapas e cenas? Os vídeos serão mantidos.");
    if (!confirmClear) return;

    const removedIds = new Set(sceneItems.map(item => item.id));
    library = library.filter(item => item.kind === "youtube");
    if (selectedId && removedIds.has(selectedId)) selectedId = library[0]?.id || null;
    stagedItem = getSelectedItem();
    masterPointer.visible = false;
    measurements = [];
    measureDraft = null;
    measureDrag = null;

    renderLibrary();
    renderVideoLibrary();
    updatePreview();
  });

  document.getElementById("addTokenToMapBtn").addEventListener("click", addSelectedTokenToMap);
  document.getElementById("removeTokenSourceBtn").addEventListener("click", removeSelectedTokenSource);
  document.getElementById("removeMapTokenBtn").addEventListener("click", removeSelectedMapToken);
  document.getElementById("clearMapTokensBtn").addEventListener("click", clearMapTokens);
  document.getElementById("tokenSizeDownBtn").addEventListener("click", () => resizeSelectedMapToken(-1));
  document.getElementById("tokenSizeUpBtn").addEventListener("click", () => resizeSelectedMapToken(1));

  screenRatioSelect.addEventListener("change", () => {
    screenRatio = screenRatioSelect.value;
    masterPointer.visible = false;
    clearPointerTrail(masterPreview);
    updatePreview();
    sendScreenSettings();
    sendToPlayers(createMessage("hidePointer"));
    sendMeasurementsState();
  });

  fitSelect.addEventListener("change", () => updateItemView({ fit: fitSelect.value }));

  document.getElementById("zoomInBtn").addEventListener("click", () => {
    if (!ensureSelected()) return;
    const item = getSelectedItem();
    updateItemView({ zoom: Math.min(3, Number(item.zoom || 1) + 0.1) });
  });

  document.getElementById("zoomOutBtn").addEventListener("click", () => {
    if (!ensureSelected()) return;
    const item = getSelectedItem();
    updateItemView({ zoom: Math.max(0.2, Number(item.zoom || 1) - 0.1) });
  });

  document.getElementById("rotateLeftBtn").addEventListener("click", () => {
    if (!ensureSelected()) return;
    const item = getSelectedItem();
    updateItemView({ rotation: Number(item.rotation || 0) - 90 });
  });

  document.getElementById("rotateRightBtn").addEventListener("click", () => {
    if (!ensureSelected()) return;
    const item = getSelectedItem();
    updateItemView({ rotation: Number(item.rotation || 0) + 90 });
  });

  document.getElementById("resetViewBtn").addEventListener("click", () => {
    updateItemView({ fit: "contain", zoom: 1, rotation: 0 });
  });

  toolbarToggleBtn.addEventListener("click", () => {
    toolbarCollapsed = !toolbarCollapsed;
    updateToolbarState();
    updateScreenSize();
  });

  toggleGridBtn.addEventListener("click", toggleGridQuick);
  togglePointerBtn.addEventListener("click", () => setPointerMode(!pointerEnabled));

  toolLineBtn.addEventListener("click", () => setAreaTool("line"));
  toolCircleBtn.addEventListener("click", () => setAreaTool("circle"));
  toolSquareBtn.addEventListener("click", () => setAreaTool("square"));
  toolConeBtn.addEventListener("click", () => setAreaTool("cone"));

  quickLineBtn.addEventListener("click", () => setAreaTool("line"));
  quickCircleBtn.addEventListener("click", () => setAreaTool("circle"));
  quickSquareBtn.addEventListener("click", () => setAreaTool("square"));
  quickConeBtn.addEventListener("click", () => setAreaTool("cone"));

  clearMeasurementsToolBtn.addEventListener("click", clearMeasurements);
  clearToolsBtn.addEventListener("click", clearAllTools);
  document.getElementById("clearMeasurementsBtn").addEventListener("click", clearMeasurements);
  document.getElementById("applyGridBtn").addEventListener("click", applyGridSettingsFromFields);

  [
    gridEnabledCheck,
    gridShowPlayersCheck,
    gridSnapCheck,
    gridColumnsInput,
    gridRowsInput,
    gridMetersInput,
    gridColorInput,
    effectColorInput,
    gridThicknessInput,
    gridOpacityInput,
    rulerModeSelect,
    effectFixedCheck,
    effectFixedMetersInput
  ].forEach(element => {
    element.addEventListener("change", applyGridSettingsFromFields);
    element.addEventListener("input", applyGridSettingsFromFields);
  });

  masterPreview.addEventListener("pointerdown", event => {
    if (tokenDrag || measureDrag) return;

    if (rulerEnabled) {
      startMeasure(event);
      return;
    }

    if (pointerEnabled) sendPointerFromEvent(event);
  });

  masterPreview.addEventListener("pointermove", event => {
    if (measureDrag) {
      updateMeasurementDrag(event);
      return;
    }

    if (tokenDrag) {
      updateTokenDrag(event);
      return;
    }

    if (rulerEnabled) {
      updateMeasure(event);
      return;
    }

    if (pointerEnabled) sendPointerFromEvent(event);
  });

  masterPreview.addEventListener("pointerup", event => {
    if (measureDrag) {
      finishMeasurementDrag(event);
      return;
    }

    if (tokenDrag) {
      finishTokenDrag(event);
      return;
    }

    if (rulerEnabled) finishMeasure(event);
  });

  masterPreview.addEventListener("pointerleave", event => {
    if (measureDrag) {
      finishMeasurementDrag(event);
      return;
    }

    if (tokenDrag) {
      finishTokenDrag(event);
      return;
    }

    if (rulerEnabled && isDrawingMeasure) finishMeasure(event);
  });

  masterPreview.addEventListener("pointercancel", () => {
    tokenDrag = null;
    measureDrag = null;
    isDrawingMeasure = false;
    measureDraft = null;
  });

  masterPreview.addEventListener("dragstart", event => event.preventDefault());

  document.getElementById("hideBtn").addEventListener("click", () => {
    masterPointer.visible = false;
    clearPointerTrail(masterPreview);
    renderMasterOverlays();
    sendToPlayers(createMessage("blackout", { screenRatio }));
  });

  window.addEventListener("resize", () => updateScreenSize());

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => updateScreenSize());
    resizeObserver.observe(previewArea);
    resizeObserver.observe(toolbarDock);
  }

  setupNotes();
  renderLibrary();
  renderVideoLibrary();
  renderTokenLibrary();
  updatePreview();
}