/*
  Mesa RPG - Sistema de Dados 3D v22
  Arquivo separado para integração no front.

  Dependência via CDN:
  - @3d-dice/dice-box é carregado dinamicamente por import().

  Exemplo mínimo:

  MesaRpgDice.init({
    masterContainer: '#masterPreview',
    historyContainer: '#diceHistoryList',
    onPublicRoll: (roll) => sendToPlayers({ action: 'diceRoll', roll })
  });

  const roll = MesaRpgDice.createDiceRoll({ pool: { 4: 1, 6: 1, 8: 1 }, modifier: 2, publicRoll: true });
  MesaRpgDice.storeDiceRoll(roll);
  MesaRpgDice.playDiceRollAnimation(document.querySelector('#masterPreview'), roll);
*/

(function (global) {
  'use strict';

  const DICE_BOX_CDN_VERSIONS = ['1.1.14', '1.1.4'];
  let activeDiceBoxVersion = DICE_BOX_CDN_VERSIONS[0];
  let diceBoxModulePromise = null;

  const state = {
    diceRollHistory: [],
    lastDiceRollId: null,
    quickDicePool: {},
    masterContainer: null,
    playerContainer: null,
    historyContainer: null,
    onPublicRoll: null,
    onHistoryChange: null,
    selectors: {},
    controlsBound: false,
    incomingRollsBound: false,
    autoInitialized: false
  };

  const DEFAULT_SELECTORS = {
    diceTypeSelect: '#diceTypeSelect',
    diceCountInput: '#diceCountInput',
    diceModifierInput: '#diceModifierInput',
    diceModeSelect: '#diceModeSelect',
    diceColorInput: '#diceColorInput',
    diceLabelInput: '#diceLabelInput',
    rollPublicDiceBtn: '#rollPublicDiceBtn',
    rollPrivateDiceBtn: '#rollPrivateDiceBtn',
    diceQuickButtons: '.dice-quick-buttons button[data-dice]',

    quickDicePoolLabel: '#quickDicePoolLabel',
    quickDiceModifierInput: '#quickDiceModifierInput',
    quickDiceModeSelect: '#quickDiceModeSelect',
    quickDiceColorInput: '#quickDiceColorInput',
    quickRollDiceBtn: '#quickRollDiceBtn',
    quickClearDiceBtn: '#quickClearDiceBtn',
    quickDieButtons: '.quick-die-btn[data-quick-die]'
  };

  function query(ref) {
    if (!ref) return null;
    if (typeof ref === 'string') return document.querySelector(ref);
    return ref;
  }

  function queryAll(ref) {
    if (!ref) return [];
    if (typeof ref === 'string') return Array.from(document.querySelectorAll(ref));
    if (Array.isArray(ref)) return ref;
    return Array.from(ref || []);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function createId() {
    return 'dice-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  function normalizeModifier(value) {
    const number = Number(value || 0);
    if (!Number.isFinite(number)) return 0;
    return Math.trunc(number);
  }

  function formatModifier(modifier) {
    const value = normalizeModifier(modifier);
    if (value > 0) return `+${value}`;
    if (value < 0) return String(value);
    return '';
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function withTimeout(promise, ms, label) {
    return Promise.race([
      Promise.resolve(promise),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`${label || 'Operação'} demorou mais que ${Math.round(ms / 1000)}s.`)), ms);
      })
    ]);
  }

  function getDiceBoxCdnBase(version = activeDiceBoxVersion) {
    return `https://unpkg.com/@3d-dice/dice-box@${version}`;
  }

  function getDiceBoxModuleUrl(version = activeDiceBoxVersion) {
    return `${getDiceBoxCdnBase(version)}/dist/dice-box.es.min.js`;
  }

  function getDiceBoxOrigin(version = activeDiceBoxVersion) {
    return `${getDiceBoxCdnBase(version)}/dist/`;
  }

  function getDiceModeLabel(mode) {
    if (mode === 'advantage') return 'vantagem';
    if (mode === 'disadvantage') return 'desvantagem';
    return 'normal';
  }

  function normalizeDiceSide(value) {
    const allowedSides = [4, 6, 8, 10, 12, 20, 100];
    const numeric = Number(value || 20);
    return allowedSides.includes(numeric) ? numeric : 20;
  }

  function normalizeDicePool(pool, sides, count) {
    const parts = [];
    const addPart = (side, qty) => {
      const safeSide = normalizeDiceSide(side);
      const safeQty = clamp(Math.trunc(Number(qty || 0)), 0, 20);
      if (safeQty > 0) parts.push({ sides: safeSide, count: safeQty });
    };

    if (Array.isArray(pool)) {
      pool.forEach(entry => addPart(entry?.sides, entry?.count));
    } else if (pool && typeof pool === 'object') {
      Object.entries(pool).forEach(([side, qty]) => addPart(side, qty));
    }

    if (!parts.length) {
      addPart(sides || 20, count || 1);
    }

    const merged = new Map();
    parts.forEach(part => {
      merged.set(part.sides, (merged.get(part.sides) || 0) + part.count);
    });

    const orderedSides = [4, 6, 8, 10, 12, 20, 100];
    let totalVisualDice = 0;

    return orderedSides
      .filter(side => merged.has(side))
      .map(side => {
        let qty = clamp(merged.get(side), 1, 20);
        const visualPerDie = side === 100 ? 2 : 1;
        const remaining = Math.max(0, 32 - totalVisualDice);
        qty = Math.min(qty, Math.max(1, Math.floor(remaining / visualPerDie)) || 1);
        totalVisualDice += qty * visualPerDie;
        return { sides: side, count: qty };
      })
      .filter(part => part.count > 0);
  }

  function calculateRollTotals(roll) {
    if (!roll || !Array.isArray(roll.dice)) return roll;

    const groups = new Map();

    roll.dice.forEach((die, index) => {
      const key = die.groupKey || die.id || String(index);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(die);
    });

    const keptValues = [];

    groups.forEach(group => {
      const first = group[0];
      const isAdvantageGroup = first && first.sides === 20 && first.groupMode && first.groupMode !== 'normal' && group.length >= 2;

      if (isAdvantageGroup) {
        const values = group.map(die => Number(die.value || 1));
        const target = first.groupMode === 'advantage' ? Math.max(...values) : Math.min(...values);
        let keptAssigned = false;

        group.forEach(die => {
          const shouldKeep = !keptAssigned && Number(die.value || 1) === target;
          die.kept = shouldKeep;
          die.dropped = !shouldKeep;
          if (shouldKeep) {
            keptAssigned = true;
            keptValues.push(Number(die.value || 1));
          }
        });
      } else {
        group.forEach(die => {
          die.kept = true;
          die.dropped = false;
          keptValues.push(Number(die.value || 1));
        });
      }
    });

    roll.keptValues = keptValues;
    roll.subtotal = keptValues.reduce((sum, value) => sum + value, 0);
    roll.total = roll.subtotal + normalizeModifier(roll.modifier);
    return roll;
  }

  function createDiceRoll({ sides, count, modifier, mode, label, publicRoll, pool, themeColor }) {
    const poolParts = normalizeDicePool(pool, sides, count);
    const safeModifier = normalizeModifier(modifier);
    const hasD20 = poolParts.some(part => part.sides === 20);
    const safeMode = hasD20 ? (mode || 'normal') : 'normal';
    const dice = [];
    const visualPlan = [];
    let groupNumber = 1;

    poolParts.forEach(part => {
      for (let i = 0; i < part.count; i++) {
        const groupKey = createId();

        if (part.sides === 20 && (safeMode === 'advantage' || safeMode === 'disadvantage')) {
          const a = randomInt(1, 20);
          const b = randomInt(1, 20);
          const indexA = dice.length;
          dice.push({ id: createId(), sides: 20, value: a, group: groupNumber, groupKey, groupMode: safeMode, kept: true, dropped: false });
          const indexB = dice.length;
          dice.push({ id: createId(), sides: 20, value: b, group: groupNumber, groupKey, groupMode: safeMode, kept: true, dropped: false });
          visualPlan.push({ kind: 'die', sides: 20, diceIndex: indexA });
          visualPlan.push({ kind: 'die', sides: 20, diceIndex: indexB });
        } else if (part.sides === 100) {
          const value = randomInt(1, 100);
          const diceIndex = dice.length;
          dice.push({ id: createId(), sides: 100, value, group: groupNumber, groupKey, groupMode: 'normal', kept: true, dropped: false });
          visualPlan.push({ kind: 'd100-tens', sides: 10, diceIndex, groupKey });
          visualPlan.push({ kind: 'd100-ones', sides: 10, diceIndex, groupKey });
        } else {
          const value = randomInt(1, part.sides);
          const diceIndex = dice.length;
          dice.push({ id: createId(), sides: part.sides, value, group: groupNumber, groupKey, groupMode: 'normal', kept: true, dropped: false });
          visualPlan.push({ kind: 'die', sides: part.sides, diceIndex });
        }

        groupNumber += 1;
      }
    });

    const expressionParts = poolParts.map(part => {
      if (part.sides === 20 && (safeMode === 'advantage' || safeMode === 'disadvantage')) {
        return `${part.count}x 2d20 ${safeMode === 'advantage' ? 'maior' : 'menor'}`;
      }
      return `${part.count}d${part.sides}`;
    });

    const roll = {
      id: createId(),
      label: String(label || '').trim(),
      sides: poolParts.length === 1 ? poolParts[0].sides : 0,
      count: poolParts.reduce((sum, part) => sum + part.count, 0),
      poolParts,
      visualPlan,
      modifier: safeModifier,
      mode: safeMode,
      expression: `${expressionParts.join(' + ')}${formatModifier(safeModifier)}`,
      dice,
      keptValues: [],
      subtotal: 0,
      total: 0,
      themeColor: themeColor || '',
      publicRoll: Boolean(publicRoll),
      createdAt: Date.now()
    };

    return calculateRollTotals(roll);
  }

  function getDiceRollTitle(roll) {
    const label = roll.label ? `${roll.label} • ` : '';
    return `${label}${roll.expression}`;
  }

  function getDiceRollDetails(roll) {
    if (!roll || !Array.isArray(roll.dice)) return '';

    const groups = new Map();
    roll.dice.forEach((die, index) => {
      const key = die.groupKey || die.id || String(index);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(die);
    });

    const details = [];

    groups.forEach(group => {
      const first = group[0];
      const isAdvantageGroup = first && first.sides === 20 && first.groupMode && first.groupMode !== 'normal' && group.length >= 2;

      if (isAdvantageGroup) {
        const kept = group.find(die => die.kept);
        const values = group.map(die => die.kept ? `${die.value}` : `(${die.value})`).join(', ');
        details.push(`[${values}]=>${kept ? kept.value : '?'}`);
      } else {
        details.push(String(first?.value ?? '?'));
      }
    });

    return details.join(' + ');
  }

  function renderDiceHistory() {
    const box = query(state.historyContainer);
    if (!box) return;

    if (!state.diceRollHistory.length) {
      box.innerHTML = '<div class="library-empty">Nenhuma rolagem ainda.</div>';
      return;
    }

    box.innerHTML = '';
    state.diceRollHistory.slice(0, 8).forEach(roll => {
      const item = document.createElement('div');
      item.className = 'dice-history-card';
      item.innerHTML = `
        <div class="dice-history-main">
          <strong>${escapeHtml(String(roll.total))}</strong>
          <span>${escapeHtml(getDiceRollTitle(roll))}</span>
        </div>
        <div class="dice-history-meta">
          ${escapeHtml(getDiceRollDetails(roll))}${roll.modifier ? ` | mod ${escapeHtml(formatModifier(roll.modifier))}` : ''} | ${roll.publicRoll ? 'TV' : 'Mestre'}
        </div>
      `;
      box.appendChild(item);
    });
  }

  function storeDiceRoll(roll) {
    state.diceRollHistory.unshift(roll);
    state.diceRollHistory = state.diceRollHistory.slice(0, 30);
    renderDiceHistory();
    if (typeof state.onHistoryChange === 'function') state.onHistoryChange(state.diceRollHistory.slice());
  }

  function getDiceHistory() {
    return state.diceRollHistory.slice();
  }

  function clearDiceHistory() {
    state.diceRollHistory = [];
    renderDiceHistory();
    if (typeof state.onHistoryChange === 'function') state.onHistoryChange([]);
  }

  function getDiceBoxNotation(roll) {
    if (!roll) return '1d20';

    const parts = Array.isArray(roll.poolParts) && roll.poolParts.length
      ? roll.poolParts
      : normalizeDicePool(null, roll.sides || 20, roll.count || 1);

    const terms = parts.map(part => {
      if (part.sides === 100) return `${part.count * 2}d10`;
      if (part.sides === 20 && (roll.mode === 'advantage' || roll.mode === 'disadvantage')) return `${part.count * 2}d20`;
      return `${part.count}d${part.sides}`;
    });

    return terms.join('+') || '1d20';
  }

  function getDiceBoxThemeColor(roll) {
    if (roll?.themeColor) return roll.themeColor;

    const side = Number(roll?.sides || roll?.poolParts?.[0]?.sides || 20);
    if (side === 4) return '#f97316';
    if (side === 6) return '#3b82f6';
    if (side === 8) return '#22c55e';
    if (side === 10) return '#facc15';
    if (side === 12) return '#d946ef';
    if (side === 20) return '#14b8a6';
    if (side === 100) return '#ef4444';
    return '#16a34a';
  }

  function hasMixedDiceTypes(roll) {
    const parts = Array.isArray(roll?.poolParts) ? roll.poolParts : [];
    const activeSides = parts
      .filter(part => Number(part?.count || 0) > 0)
      .map(part => Number(part.sides || 20));
    return new Set(activeSides).size > 1;
  }

  function getMixedDiceParts(roll) {
    const parts = Array.isArray(roll?.poolParts) && roll.poolParts.length
      ? roll.poolParts
      : normalizeDicePool(null, roll?.sides || 20, roll?.count || 1);

    return parts
      .filter(part => Number(part.count || 0) > 0)
      .map(part => ({
        sides: normalizeDiceSide(part.sides),
        count: clamp(Number(part.count || 1), 1, 20)
      }));
  }

  function copySubRollResultsToOriginalRoll(originalRoll, subRoll, side) {
    if (!originalRoll || !subRoll || !Array.isArray(originalRoll.dice) || !Array.isArray(subRoll.dice)) return false;

    const targetIndices = originalRoll.dice
      .map((die, index) => Number(die.sides) === Number(side) ? index : -1)
      .filter(index => index >= 0);

    if (!targetIndices.length) return false;

    subRoll.dice.forEach((die, index) => {
      const targetIndex = targetIndices[index];
      if (targetIndex == null) return;

      originalRoll.dice[targetIndex] = {
        ...originalRoll.dice[targetIndex],
        value: die.value,
        kept: die.kept,
        dropped: die.dropped,
        groupMode: die.groupMode || originalRoll.dice[targetIndex].groupMode || 'normal'
      };
    });

    calculateRollTotals(originalRoll);
    return true;
  }

  function collectDiceBoxNumbers(value, out = [], depth = 0) {
    if (depth > 8 || value == null) return out;

    if (Array.isArray(value)) {
      value.forEach(item => collectDiceBoxNumbers(item, out, depth + 1));
      return out;
    }

    if (typeof value !== 'object') return out;

    const preferredKeys = ['rolls', 'dice', 'results', 'values', 'set', 'sets', 'throws', 'rollResults'];
    let usedPreferred = false;

    preferredKeys.forEach(key => {
      if (Array.isArray(value[key])) {
        usedPreferred = true;
        collectDiceBoxNumbers(value[key], out, depth + 1);
      }
    });

    const hasDieIdentity = ['sides', 'type', 'dieType', 'notation', 'groupId', 'rollId', 'theme'].some(key => key in value);
    const numericKeys = ['value', 'result', 'roll', 'face', 'side'];

    for (const key of numericKeys) {
      const numeric = Number(value[key]);
      if (hasDieIdentity && Number.isFinite(numeric)) {
        out.push(numeric);
        return out;
      }
    }

    if (!usedPreferred) {
      Object.entries(value).forEach(([key, child]) => {
        if (['total', 'subtotal', 'sum', 'modifier'].includes(key)) return;
        if (typeof child === 'object' && child !== null) collectDiceBoxNumbers(child, out, depth + 1);
      });
    }

    return out;
  }

  function normalizeVisualDieValue(rawValue, sides, role) {
    let value = Math.round(Number(rawValue));
    if (!Number.isFinite(value)) value = 1;

    if (role === 'd100-tens' || role === 'd100-ones') {
      if (value === 10) return 0;
      return clamp(value, 0, 9);
    }

    return clamp(value, 1, sides || 20);
  }

  function applyDiceBoxResultsToRoll(roll, rawResults) {
    if (!roll || !Array.isArray(roll.visualPlan) || !Array.isArray(roll.dice)) return false;

    const values = collectDiceBoxNumbers(rawResults, []);
    console.log('DiceBox resultados brutos:', rawResults, 'valores extraídos:', values);

    if (!values.length) return false;

    const plan = roll.visualPlan;
    const dice = roll.dice.map(die => ({ ...die }));
    const d100Groups = new Map();

    for (let i = 0; i < plan.length; i++) {
      if (values[i] == null) break;
      const entry = plan[i];

      if (entry.kind === 'die') {
        const target = dice[entry.diceIndex];
        if (target) target.value = normalizeVisualDieValue(values[i], entry.sides, entry.kind);
      }

      if (entry.kind === 'd100-tens' || entry.kind === 'd100-ones') {
        const current = d100Groups.get(entry.groupKey) || { diceIndex: entry.diceIndex, tens: 0, ones: 0 };
        if (entry.kind === 'd100-tens') current.tens = normalizeVisualDieValue(values[i], 10, 'd100-tens');
        if (entry.kind === 'd100-ones') current.ones = normalizeVisualDieValue(values[i], 10, 'd100-ones');
        d100Groups.set(entry.groupKey, current);
      }
    }

    d100Groups.forEach(group => {
      const target = dice[group.diceIndex];
      if (!target) return;
      target.value = group.tens === 0 && group.ones === 0 ? 100 : (group.tens * 10) + group.ones;
    });

    roll.dice = dice;
    calculateRollTotals(roll);
    return true;
  }

  function sanitizeDiceDomId(value) {
    return String(value || createId()).replace(/[^a-zA-Z0-9_-]/g, '-');
  }

  async function loadDiceBoxModule() {
    if (!diceBoxModulePromise) {
      diceBoxModulePromise = (async () => {
        let lastError = null;

        for (const version of DICE_BOX_CDN_VERSIONS) {
          try {
            const module = await import(getDiceBoxModuleUrl(version));
            activeDiceBoxVersion = version;
            return module.default || module.DiceBox || module;
          } catch (error) {
            lastError = error;
            console.warn(`Falha ao importar DiceBox ${version}`, error);
          }
        }

        throw lastError || new Error('Não foi possível importar o DiceBox.');
      })();
    }

    return diceBoxModulePromise;
  }

  function renderDiceResultText(resultBox, roll) {
    if (!resultBox) return;
    const detail = getDiceRollDetails(roll);
    resultBox.classList.remove('rolling');
    resultBox.classList.add('done');
    resultBox.innerHTML = `
      <span>${escapeHtml(detail)}</span>
      <strong>Total: ${escapeHtml(String(roll.total))}</strong>
    `;
  }

  function renderDiceBoxError(resultBox, message) {
    if (!resultBox) return;
    resultBox.classList.remove('rolling');
    resultBox.classList.add('done');
    resultBox.innerHTML = `
      <span>${escapeHtml(message || 'Não foi possível carregar o DiceBox via CDN.')}</span>
    `;
  }

  function buildDiceBoxConfig(stage, safeId, roll, options = {}, onRollComplete = null) {
    return {
      id: `dicebox-canvas-${safeId}`,
      container: `#${stage.id}`,
      assetPath: 'assets/',
      origin: getDiceBoxOrigin(),
      scale: options.player ? 7.4 : 6.6,
      gravity: 1,
      mass: 1,
      friction: 0.78,
      restitution: 0.18,
      angularDamping: 0.42,
      linearDamping: 0.42,
      spinForce: 5.2,
      throwForce: 6.2,
      startingHeight: 7,
      settleTimeout: 4200,
      delay: 0,
      lightIntensity: 1.35,
      enableShadows: true,
      shadowTransparency: 0.62,
      offscreen: false,
      suspendSimulation: false,
      theme: 'default',
      themeColor: getDiceBoxThemeColor(roll),
      onRollComplete: onRollComplete || undefined,
      onThemeConfigLoaded: () => console.log('DiceBox tema carregado'),
      onThemeLoaded: () => console.log('DiceBox assets carregados')
    };
  }

  function createDiceBoxInstance(DiceBox, stage, safeId, roll, options, onRollComplete, mode) {
    const config = buildDiceBoxConfig(stage, safeId, roll, options, onRollComplete);

    if (mode === 'legacy-selector') {
      const legacyConfig = { ...config };
      delete legacyConfig.container;
      return new DiceBox(`#${stage.id}`, legacyConfig);
    }

    return new DiceBox(config);
  }

  async function initAndRollDiceBox(DiceBox, stage, safeId, roll, options, resultBox, mode) {
    let rollResolved = false;
    let rollResolve;
    let callbackResults = null;
    const rollCompletePromise = new Promise(resolve => {
      rollResolve = resolve;
    });

    const diceBox = createDiceBoxInstance(DiceBox, stage, safeId, roll, options, (results) => {
      rollResolved = true;
      callbackResults = results;
      rollResolve(results);
    }, mode);

    await withTimeout(diceBox.init(), 11000, `Inicialização do DiceBox (${mode})`);

    if (typeof diceBox.show === 'function') diceBox.show();
    if (resultBox) resultBox.textContent = 'Rolando dados 3D...';

    const notation = getDiceBoxNotation(roll);
    const maybeResult = diceBox.roll(notation, {
      theme: 'default',
      themeColor: getDiceBoxThemeColor(roll),
      newStartPoint: true
    });

    let returnedResults = null;

    if (maybeResult && typeof maybeResult.then === 'function') {
      try {
        returnedResults = await withTimeout(maybeResult, 17000, `Rolagem do DiceBox (${mode})`);
      } catch (error) {
        if (!rollResolved) {
          returnedResults = await withTimeout(rollCompletePromise, 5000, `Resultado visual do DiceBox (${mode})`);
        }
      }
    } else {
      try {
        returnedResults = await withTimeout(rollCompletePromise, 17000, `Rolagem do DiceBox (${mode})`);
      } catch (error) {
        if (!rollResolved) await sleep(3000);
      }
    }

    const visualResults = callbackResults || returnedResults;
    if (visualResults) {
      applyDiceBoxResultsToRoll(roll, visualResults);
      renderDiceHistory();
    }

    return diceBox;
  }

  async function initAndRollDiceBoxAnyMode(DiceBox, stage, safeId, roll, options, resultBox) {
    const modes = ['object-config', 'legacy-selector'];
    let lastError = null;
    let diceBox = null;

    for (const mode of modes) {
      try {
        stage.innerHTML = '';
        if (resultBox) {
          resultBox.textContent = mode === 'object-config'
            ? 'Inicializando...'
            : 'Tentando modo alternativo...';
        }

        diceBox = await initAndRollDiceBox(DiceBox, stage, `${safeId}-${mode}`, roll, options, resultBox, mode);
        return diceBox;
      } catch (error) {
        lastError = error;
        console.warn(`Falha no DiceBox misto usando ${mode}`, error);
        try { diceBox?.clear?.(); } catch (e) {}
        try { diceBox?.hide?.(); } catch (e) {}
        diceBox = null;
      }
    }

    throw lastError || new Error('Não foi possível rolar o dado misto.');
  }

  async function playMixedDiceBoxRollAnimation(container, roll, options = {}) {
    if (!container || !roll) return;

    container.querySelectorAll('.dice-roll-overlay').forEach(node => node.remove());

    const overlay = document.createElement('div');
    overlay.className = 'dice-roll-overlay dicebox-roll-overlay dicebox-mixed-overlay';
    overlay.innerHTML = `
      <div class="dice-roll-title">${escapeHtml(getDiceRollTitle(roll))}</div>
      <div class="dice-physics-stage dicebox-stage dicebox-mixed-stage dicebox-mixed-overlap-stage"></div>
      <div class="dice-roll-result rolling">Preparando dados mistos...</div>
    `;
    container.appendChild(overlay);

    const stage = overlay.querySelector('.dicebox-mixed-stage');
    const result = overlay.querySelector('.dice-roll-result');
    const safeId = sanitizeDiceDomId(roll.id || createId());
    stage.id = `dicebox-mixed-stage-${safeId}`;

    const diceBoxes = [];
    let cleaned = false;
    const persistMs = options.persistMs || 5200;

    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      diceBoxes.forEach(box => {
        try { box?.clear?.(); } catch (error) {}
        try { box?.hide?.(); } catch (error) {}
      });
      overlay.remove();
    }

    overlay.addEventListener('pointerdown', () => cleanup(), { once: true });

    try {
      const DiceBox = await loadDiceBoxModule();
      if (!overlay.isConnected) return;

      const parts = getMixedDiceParts(roll);
      stage.innerHTML = '';

      const partTasks = parts.map(async (part, index) => {
        const subRoll = createDiceRoll({
          pool: { [part.sides]: part.count },
          modifier: 0,
          mode: roll.mode || 'normal',
          label: `${part.count}d${part.sides}`,
          themeColor: roll.themeColor || getDiceBoxThemeColor({ sides: part.sides }),
          publicRoll: roll.publicRoll
        });

        const layer = document.createElement('div');
        layer.className = 'dice-mixed-layer';
        layer.id = `dicebox-mixed-layer-${safeId}-${index}-${part.sides}`;
        layer.style.zIndex = String(10 + index);
        stage.appendChild(layer);

        const hiddenResult = document.createElement('div');
        hiddenResult.className = 'dice-mixed-hidden-result';

        const diceBox = await initAndRollDiceBoxAnyMode(
          DiceBox,
          layer,
          `${safeId}-mixedlayer-${index}`,
          subRoll,
          { ...options, mixed: true, overlayLayer: true },
          hiddenResult
        );

        diceBoxes.push(diceBox);
        copySubRollResultsToOriginalRoll(roll, subRoll, part.sides);
        return { part, subRoll, diceBox };
      });

      const settled = await Promise.allSettled(partTasks);
      const failures = settled.filter(item => item.status === 'rejected');

      calculateRollTotals(roll);
      renderDiceHistory();

      if (failures.length && failures.length === settled.length) {
        throw failures[0].reason || new Error('Falha ao rolar todos os dados mistos.');
      }

      if (failures.length) {
        console.warn('Alguns layers de dados mistos falharam:', failures);
      }

      if (!overlay.isConnected) return;
      renderDiceResultText(result, roll);
      setTimeout(() => overlay.classList.add('fade-out'), persistMs);
      setTimeout(cleanup, persistMs + 650);
    } catch (error) {
      console.error('Erro ao rolar dados mistos em layers:', error);
      renderDiceBoxError(result, 'Não foi possível carregar a rolagem mista. Resultado: ' + String(roll.total));
      setTimeout(() => overlay.classList.add('fade-out'), 5200);
      setTimeout(cleanup, 5900);
    }
  }

  async function playDiceRollAnimation(container, roll, options = {}) {
    if (!container || !roll) return;

    if (hasMixedDiceTypes(roll)) {
      return playMixedDiceBoxRollAnimation(container, roll, { ...options, persistMs: options.persistMs || 5200 });
    }

    container.querySelectorAll('.dice-roll-overlay').forEach(node => node.remove());

    const overlay = document.createElement('div');
    overlay.className = 'dice-roll-overlay dicebox-roll-overlay';
    overlay.innerHTML = `
      <div class="dice-roll-title">${escapeHtml(getDiceRollTitle(roll))}</div>
      <div class="dice-physics-stage dicebox-stage"></div>
      <div class="dice-roll-result rolling">Preparando dados 3D...</div>
    `;
    container.appendChild(overlay);

    const stage = overlay.querySelector('.dicebox-stage');
    const result = overlay.querySelector('.dice-roll-result');
    const safeId = sanitizeDiceDomId(roll.id || createId());
    stage.id = `dicebox-stage-${safeId}`;

    let diceBox = null;
    let cleaned = false;
    const persistMs = options.persistMs || 5200;

    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      try { diceBox?.clear?.(); } catch (error) {}
      try { diceBox?.hide?.(); } catch (error) {}
      overlay.remove();
    }

    overlay.addEventListener('pointerdown', () => cleanup(), { once: true });

    try {
      const DiceBox = await loadDiceBoxModule();
      if (!overlay.isConnected) return;

      const modes = ['object-config', 'legacy-selector'];
      let lastError = null;

      for (const mode of modes) {
        try {
          stage.innerHTML = '';
          result.textContent = mode === 'object-config'
            ? 'Inicializando dados 3D...'
            : 'Tentando modo alternativo dos dados 3D...';

          diceBox = await initAndRollDiceBox(DiceBox, stage, `${safeId}-${mode}`, roll, options, result, mode);
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
          console.warn(`Falha no DiceBox usando ${mode}`, error);
          try { diceBox?.clear?.(); } catch (e) {}
          try { diceBox?.hide?.(); } catch (e) {}
          diceBox = null;
        }
      }

      if (lastError) throw lastError;
      if (!overlay.isConnected) return;

      renderDiceResultText(result, roll);
      setTimeout(() => overlay.classList.add('fade-out'), persistMs);
      setTimeout(cleanup, persistMs + 650);
    } catch (error) {
      console.error('Erro ao carregar/rolar DiceBox:', error);
      renderDiceBoxError(result, 'DiceBox não carregou. Verifique internet/CDN no F12. Resultado: ' + String(roll.total));
      setTimeout(() => overlay.classList.add('fade-out'), 5200);
      setTimeout(cleanup, 5900);
    }
  }

  function parseQuickModifier(value) {
    const text = String(value || '0').trim().replace(',', '.');
    if (!text) return 0;
    const number = Number(text);
    return Number.isFinite(number) ? Math.trunc(number) : 0;
  }

  function getQuickPoolText() {
    const sides = [4, 6, 8, 10, 12, 20, 100];
    const parts = sides
      .filter(side => Number(state.quickDicePool[side] || 0) > 0)
      .map(side => `${state.quickDicePool[side]}d${side}`);
    return parts.length ? parts.join(' + ') : 'vazio';
  }

  function renderQuickDicePool() {
    const selectors = state.selectors;
    const label = query(selectors.quickDicePoolLabel);
    if (label) label.textContent = `Dados: ${getQuickPoolText()}`;

    queryAll(selectors.quickDieButtons).forEach(button => {
      const side = Number(button.dataset.quickDie);
      const qty = Number(state.quickDicePool[side] || 0);
      button.classList.toggle('active', qty > 0);
      button.textContent = qty > 0 ? `D${side} ×${qty}` : `D${side}`;
    });
  }

  function addQuickDie(side) {
    const safeSide = normalizeDiceSide(side);
    state.quickDicePool[safeSide] = clamp(Number(state.quickDicePool[safeSide] || 0) + 1, 0, 20);
    renderQuickDicePool();
  }

  function clearQuickDicePool() {
    state.quickDicePool = {};
    renderQuickDicePool();
  }

  function emitPublicRoll(roll) {
    if (typeof state.onPublicRoll === 'function') {
      state.onPublicRoll(roll);
    }
  }

  function rollQuickDicePool(options = {}) {
    const selectors = state.selectors;
    const hasDice = Object.values(state.quickDicePool).some(value => Number(value || 0) > 0);
    const pool = hasDice ? { ...state.quickDicePool } : { 20: 1 };
    const roll = createDiceRoll({
      pool,
      modifier: parseQuickModifier(query(selectors.quickDiceModifierInput)?.value || 0),
      mode: query(selectors.quickDiceModeSelect)?.value || 'normal',
      label: options.label || 'Rolagem rápida',
      themeColor: query(selectors.quickDiceColorInput)?.value || query(selectors.diceColorInput)?.value || '',
      publicRoll: options.publicRoll !== false
    });

    state.lastDiceRollId = roll.id;
    storeDiceRoll(roll);
    playDiceRollAnimation(options.container || query(state.masterContainer), roll, { master: true });
    if (roll.publicRoll) emitPublicRoll(roll);
    return roll;
  }

  function rollDiceFromUi(publicRoll = true, options = {}) {
    const selectors = state.selectors;
    const roll = createDiceRoll({
      sides: Number(query(selectors.diceTypeSelect)?.value || 20),
      count: Number(query(selectors.diceCountInput)?.value || 1),
      modifier: Number(query(selectors.diceModifierInput)?.value || 0),
      mode: query(selectors.diceModeSelect)?.value || 'normal',
      label: query(selectors.diceLabelInput)?.value || '',
      themeColor: query(selectors.diceColorInput)?.value || '',
      publicRoll
    });

    state.lastDiceRollId = roll.id;
    storeDiceRoll(roll);
    playDiceRollAnimation(options.container || query(state.masterContainer), roll, { master: true });
    if (publicRoll) emitPublicRoll(roll);
    return roll;
  }

  function setupDiceControls(customSelectors = {}) {
    state.selectors = { ...DEFAULT_SELECTORS, ...state.selectors, ...customSelectors };
    const selectors = state.selectors;

    if (state.controlsBound) {
      renderQuickDicePool();
      return;
    }

    queryAll(selectors.diceQuickButtons).forEach(button => {
      button.addEventListener('click', () => {
        const diceTypeSelect = query(selectors.diceTypeSelect);
        const diceModeSelect = query(selectors.diceModeSelect);
        const diceColorInput = query(selectors.diceColorInput);
        if (diceTypeSelect) diceTypeSelect.value = button.dataset.dice || '20';
        if (diceTypeSelect && diceModeSelect && diceTypeSelect.value !== '20') diceModeSelect.value = 'normal';
        if (diceColorInput) diceColorInput.value = getDiceBoxThemeColor({ sides: Number(diceTypeSelect?.value || 20) });
      });
    });

    const diceTypeSelect = query(selectors.diceTypeSelect);
    diceTypeSelect?.addEventListener('change', () => {
      const diceModeSelect = query(selectors.diceModeSelect);
      const diceColorInput = query(selectors.diceColorInput);
      if (diceTypeSelect.value !== '20' && diceModeSelect) diceModeSelect.value = 'normal';
      if (diceColorInput) diceColorInput.value = getDiceBoxThemeColor({ sides: Number(diceTypeSelect.value || 20) });
    });

    queryAll(selectors.quickDieButtons).forEach(button => {
      button.addEventListener('click', () => addQuickDie(button.dataset.quickDie));
    });

    query(selectors.quickRollDiceBtn)?.addEventListener('click', () => rollQuickDicePool({ publicRoll: true }));
    query(selectors.quickClearDiceBtn)?.addEventListener('click', clearQuickDicePool);
    query(selectors.rollPublicDiceBtn)?.addEventListener('click', () => rollDiceFromUi(true));
    query(selectors.rollPrivateDiceBtn)?.addEventListener('click', () => rollDiceFromUi(false));

    state.controlsBound = true;
    renderQuickDicePool();
  }

  function receiveDiceRoll(messageOrRoll, container, options = {}) {
    const roll = messageOrRoll?.roll || messageOrRoll;
    if (!roll) return false;
    if (roll.id && roll.id === state.lastDiceRollId) return false;
    state.lastDiceRollId = roll.id || createId();
    playDiceRollAnimation(container || query(state.playerContainer) || query(state.masterContainer), roll, { player: true, persistMs: options.persistMs || 9500 });
    return true;
  }

  function init(options = {}) {
    state.masterContainer = options.masterContainer || state.masterContainer;
    state.playerContainer = options.playerContainer || state.playerContainer;
    state.historyContainer = options.historyContainer || state.historyContainer;
    state.onPublicRoll = options.onPublicRoll || state.onPublicRoll;
    state.onHistoryChange = options.onHistoryChange || state.onHistoryChange;
    state.selectors = { ...DEFAULT_SELECTORS, ...(options.selectors || {}) };

    if (options.setupControls !== false) setupDiceControls(state.selectors);
    if (options.preload !== false) loadDiceBoxModule().catch(error => console.warn('Pré-carregamento do DiceBox falhou:', error));

    return api;
  }

  function isSameAppMessage(message) {
    if (!message || message.action !== 'diceRoll') return false;
    if (typeof CHANNEL_NAME === 'undefined') return true;
    return !message.app || message.app === CHANNEL_NAME;
  }

  function createDiceMessage(roll) {
    if (typeof createMessage === 'function') {
      return createMessage('diceRoll', { roll });
    }

    return {
      app: typeof CHANNEL_NAME !== 'undefined' ? CHANNEL_NAME : 'mesa-rpg',
      action: 'diceRoll',
      roll,
      createdAt: Date.now()
    };
  }

  function sendPublicDiceRoll(roll) {
    if (typeof sendToPlayers === 'function') {
      sendToPlayers(createDiceMessage(roll));
    }
  }

  function handleIncomingDiceRoll(message) {
    if (!isSameAppMessage(message)) return;
    receiveDiceRoll(message, query(state.playerContainer) || query(state.masterContainer), { persistMs: 9500 });
  }

  function setupIncomingDiceRolls() {
    if (state.incomingRollsBound) return;
    state.incomingRollsBound = true;

    window.addEventListener('message', event => handleIncomingDiceRoll(event.data));

    if (typeof channel !== 'undefined' && channel && typeof channel.addEventListener === 'function') {
      channel.addEventListener('message', event => handleIncomingDiceRoll(event.data));
    }

    window.addEventListener('storage', event => {
      if (typeof CHANNEL_NAME !== 'undefined' && event.key !== CHANNEL_NAME + '-last') return;
      try { handleIncomingDiceRoll(JSON.parse(event.newValue)); } catch (error) {}
    });
  }

  function replayLastDiceRollIfNeeded() {
    if (typeof localStorage === 'undefined' || typeof CHANNEL_NAME === 'undefined') return;

    try {
      const lastMessage = localStorage.getItem(CHANNEL_NAME + '-last');
      if (lastMessage) handleIncomingDiceRoll(JSON.parse(lastMessage));
    } catch (error) {}
  }

  function autoInit() {
    if (state.autoInitialized) return;
    state.autoInitialized = true;

    const playerMode = typeof isPlayer !== 'undefined' && isPlayer;

    init({
      masterContainer: '#masterPreview',
      playerContainer: '#playerScreen',
      historyContainer: '#diceHistoryList',
      onPublicRoll: sendPublicDiceRoll,
      setupControls: !playerMode,
      preload: !playerMode
    });

    setupIncomingDiceRolls();
    if (playerMode) replayLastDiceRollIfNeeded();
  }

  const api = {
    init,
    createDiceRoll,
    calculateRollTotals,
    getDiceRollTitle,
    getDiceRollDetails,
    getDiceModeLabel,
    getDiceBoxNotation,
    getDiceBoxThemeColor,
    normalizeDiceSide,
    normalizeDicePool,
    hasMixedDiceTypes,
    getMixedDiceParts,
    playDiceRollAnimation,
    playMixedDiceBoxRollAnimation,
    loadDiceBoxModule,
    applyDiceBoxResultsToRoll,
    collectDiceBoxNumbers,
    storeDiceRoll,
    renderDiceHistory,
    getDiceHistory,
    clearDiceHistory,
    addQuickDie,
    clearQuickDicePool,
    renderQuickDicePool,
    getQuickPoolText,
    rollQuickDicePool,
    rollDiceFromUi,
    setupDiceControls,
    receiveDiceRoll,
    formatModifier,
    normalizeModifier,
    _state: state
  };

  global.MesaRpgDice = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit, { once: true });
  } else {
    autoInit();
  }
})(window);
