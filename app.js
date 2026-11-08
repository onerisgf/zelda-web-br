'use strict';

/**
 * Zelda Web - A Link to the Past (PT-BR)
 * Interface com shaders, capítulos, cheats e saves.
 */

const el = (id) => document.getElementById(id);
const canvas = el('canvas');
const screenFilter = el('screen-filter');
const progressBar = el('loading-bar');
const statusText = el('status-text');
const startOverlay = el('start-overlay');
const btnPlay = el('btn-play');
const gameMenu = el('game-menu');

let zeldaModule = null;
let audioContextUnlocked = false;
let currentSpeed = 1;
let isTurboActive = false;
let chaptersData = [];
let toastTimer = null;

function showToast(message) {
  const toast = el('game-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 2200);
}

// Configuração do zelda3.ini com suporte a PT-BR, Widescreen 16:9, HD Mode 7 e Cheats
function generateIni() {
  return [
    '[General]',
    'Autosave = 1',
    'ExtendedAspectRatio = 16:9',
    'DisableFrameDelay = 0',
    'Language = pt',
    '',
    '[Graphics]',
    'OutputMethod = SDL',
    'NewRenderer = 1',
    'EnhancedMode7 = 1',
    'WindowScale = 1',
    'NoSpriteLimits = 1',
    'LinearFiltering = 0',
    'DimFlashes = 0',
    '',
    '[Sound]',
    'EnableAudio = 1',
    'AudioFreq = 44100',
    'AudioChannels = 2',
    'AudioSamples = 512',
    'EnableMSU = false',
    '',
    '[Features]',
    'ItemSwitchLR = 1',
    'TurnWhileDashing = 1',
    'MirrorToDarkworld = 0',
    'CollectItemsWithSword = 1',
    'BreakPotsWithSword = 1',
    'DisableLowHealthBeep = 0',
    'SkipIntroOnKeypress = 1',
    'ShowMaxItemsInYellow = 1',
    'MoreActiveBombs = 1',
    'CarryMoreRupees = 1',
    'MiscBugFixes = 1',
    'CancelBirdTravel = 1',
    '',
    '[KeyMap]',
    'Controls = w, s, a, d, Right Shift, Return, l, k, i, j, q, o',
    'CheatLife = F6',
    'CheatKeys = F7',
    'CheatWalkThroughWalls = Ctrl+e',
    'ClearKeyLog =',
    'StopReplay =',
    'Turbo = Tab',
    'ReplayTurbo = t',
    'Fullscreen = Alt+Return',
    'Reset = Ctrl+Shift+F12',
    'Pause = Shift+p',
    'Load = F1, F3, F4, F5',
    'Save = F2, Shift+F1, Shift+F2, Shift+F3',
    'LoadRef = 1,2,3,4,5,6,7,8,9,0,-,=,Backspace',
    ''
  ].join('\n');
}

// Mapeamento de Teclas (WASD para Movimento | X=I, Y=J, B=K, A=L, L=Q, R=O)
const KEY_MAP = {
  // Movimento
  'w':          { key: 'w',          code: 'KeyW',       keyCode: 87 }, // Cima
  'W':          { key: 'w',          code: 'KeyW',       keyCode: 87 },
  's':          { key: 's',          code: 'KeyS',       keyCode: 83 }, // Baixo
  'S':          { key: 's',          code: 'KeyS',       keyCode: 83 },
  'a':          { key: 'a',          code: 'KeyA',       keyCode: 65 }, // Esquerda
  'A':          { key: 'a',          code: 'KeyA',       keyCode: 65 },
  'd':          { key: 'd',          code: 'KeyD',       keyCode: 68 }, // Direita
  'D':          { key: 'd',          code: 'KeyD',       keyCode: 68 },
  'ArrowUp':    { key: 'w',          code: 'KeyW',       keyCode: 87 },
  'ArrowDown':  { key: 's',          code: 'KeyS',       keyCode: 83 },
  'ArrowLeft':  { key: 'a',          code: 'KeyA',       keyCode: 65 },
  'ArrowRight': { key: 'd',          code: 'KeyD',       keyCode: 68 },

  // Ações do SNES
  'i':          { key: 'i',          code: 'KeyI',       keyCode: 73 }, // Botão X (SNES - Mapa)
  'I':          { key: 'i',          code: 'KeyI',       keyCode: 73 },
  'j':          { key: 'j',          code: 'KeyJ',       keyCode: 74 }, // Botão Y (SNES - Correr)
  'J':          { key: 'j',          code: 'KeyJ',       keyCode: 74 },
  'k':          { key: 'k',          code: 'KeyK',       keyCode: 75 }, // Botão B (SNES - Espada/Atacar)
  'K':          { key: 'k',          code: 'KeyK',       keyCode: 75 },
  'l':          { key: 'l',          code: 'KeyL',       keyCode: 76 }, // Botão A (SNES - Pegar/Ação)
  'L':          { key: 'l',          code: 'KeyL',       keyCode: 76 },
  'q':          { key: 'q',          code: 'KeyQ',       keyCode: 81 }, // Botão L (SNES)
  'Q':          { key: 'q',          code: 'KeyQ',       keyCode: 81 },
  'o':          { key: 'o',          code: 'KeyO',       keyCode: 79 }, // Botão R (SNES)
  'O':          { key: 'o',          code: 'KeyO',       keyCode: 79 },
  'r':          { key: 'o',          code: 'KeyO',       keyCode: 79 }, // Tecla R física -> Botão R (SNES)
  'R':          { key: 'o',          code: 'KeyO',       keyCode: 79 },

  // Sistema / Menus
  'Shift':      { key: 'Shift',      code: 'ShiftRight', keyCode: 16 }, // Select
  'ShiftLeft':  { key: 'Shift',      code: 'ShiftLeft',  keyCode: 16 },
  'ShiftRight': { key: 'Shift',      code: 'ShiftRight', keyCode: 16 },
  'Enter':      { key: 'Enter',      code: 'Enter',      keyCode: 13 }, // Start
  'Tab':        { key: 'Tab',        code: 'Tab',        keyCode: 9 },  // Turbo / Acelerar
  'F6':         { key: 'F6',         code: 'F6',         keyCode: 117 }, // Cheat: Vida
  'F7':         { key: 'F7',         code: 'F7',         keyCode: 118 }, // Cheat: Chaves
  'F1':         { key: 'F1',         code: 'F1',         keyCode: 112 },
  'F2':         { key: 'F2',         code: 'F2',         keyCode: 113 },
  'F3':         { key: 'F3',         code: 'F3',         keyCode: 114 },
  'F4':         { key: 'F4',         code: 'F4',         keyCode: 115 },
  'F5':         { key: 'F5',         code: 'F5',         keyCode: 116 },
  'F8':         { key: 'F8',         code: 'F8',         keyCode: 119 },
  '1':          { key: '1',          code: 'Digit1',     keyCode: 49 },
  '2':          { key: '2',          code: 'Digit2',     keyCode: 50 },
  '3':          { key: '3',          code: 'Digit3',     keyCode: 51 },
  '4':          { key: '4',          code: 'Digit4',     keyCode: 52 },
  '5':          { key: '5',          code: 'Digit5',     keyCode: 53 },
  '6':          { key: '6',          code: 'Digit6',     keyCode: 54 },
  '7':          { key: '7',          code: 'Digit7',     keyCode: 55 },
  '8':          { key: '8',          code: 'Digit8',     keyCode: 56 },
  '9':          { key: '9',          code: 'Digit9',     keyCode: 57 },
  '0':          { key: '0',          code: 'Digit0',     keyCode: 48 },
  '-':          { key: '-',          code: 'Minus',      keyCode: 189 },
  '=':          { key: '=',          code: 'Equal',      keyCode: 187 },
  'Backspace':  { key: 'Backspace',  code: 'Backspace',  keyCode: 8 }
};

// =========================================================================
// Sistema de Salvamento Robusto e Redundante (IndexedDB + LocalStorage)
// Garante 100% de persistência em celulares Android, iOS, PWA e PCs
// =========================================================================

function uint8ToBase64(bytes) {
  let binary = '';
  const chunkSize = 8192;
  const len = bytes.length;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

function persistAllSaves(toastMessage = null) {
  if (!zeldaModule || !zeldaModule.FS) return;
  try {
    // 1. Sincroniza assincronamente com o banco IndexedDB (/saves)
    zeldaModule.FS.syncfs(false, (err) => {
      if (err) console.warn('[Save] Aviso no syncfs IDBFS:', err);
      else console.log('[Save] Saves sincronizados no IndexedDB com sucesso.');
    });

    // 2. Backup síncrono e imediato no localStorage (à prova de fechamento súbito no Android)
    const filesToBackup = ['/saves/sram.dat', '/saves/save0.sav', '/saves/save1.sav'];
    for (const filePath of filesToBackup) {
      try {
        if (zeldaModule.FS.analyzePath(filePath).exists) {
          const bytes = zeldaModule.FS.readFile(filePath);
          if (bytes && bytes.length > 0) {
            const key = 'zelda_backup_' + filePath.replace('/saves/', '');
            localStorage.setItem(key, uint8ToBase64(bytes));
          }
        }
      } catch (innerErr) {
        console.warn('[Save] Erro ao gravar no localStorage:', filePath, innerErr);
      }
    }
    if (toastMessage) showToast(toastMessage);
  } catch (e) {
    console.warn('[Save] Exceção ao persistir dados:', e);
    if (toastMessage) showToast(toastMessage);
  }
}

function executeQuickSave() {
  if (!zeldaModule || !zeldaModule.FS) return;

  if (canvas) {
    try { canvas.focus(); } catch (e) {}
  }

  // Dispara APENAS F2 (Slot 0 de Save) sem modificadores conflitantes
  simulateKeyEvent('keydown', 'F2');
  setTimeout(() => {
    simulateKeyEvent('keyup', 'F2');
  }, 120);

  // Aguarda o motor gravar o estado e sincroniza no IndexedDB + LocalStorage
  setTimeout(() => {
    persistAllSaves('💾 Estado Rápido Salvo com Sucesso!');
  }, 350);
}

function executeQuickLoad() {
  if (!zeldaModule || !zeldaModule.FS) return;

  // Garante que se o save0.sav estiver no localStorage e não no FS, seja restaurado
  try {
    const localData = localStorage.getItem('zelda_backup_save0.sav');
    if (localData && !zeldaModule.FS.analyzePath('/saves/save0.sav').exists) {
      const binary = atob(localData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      zeldaModule.FS.writeFile('/saves/save0.sav', bytes);
      console.log('[Load] save0.sav restaurado do backup do localStorage antes de carregar.');
    }
  } catch (e) {
    console.warn('[Load] Erro ao restaurar save0.sav do localStorage:', e);
  }

  const saveExists = zeldaModule.FS.analyzePath('/saves/save0.sav').exists;
  if (!saveExists) {
    showToast('⚠️ Nenhum estado rápido salvo ainda!');
    return;
  }

  if (canvas) {
    try { canvas.focus(); } catch (e) {}
  }

  // Dispara APENAS F1 (Slot 0 de Load)
  simulateKeyEvent('keydown', 'F1');
  setTimeout(() => {
    simulateKeyEvent('keyup', 'F1');
    showToast('📂 Estado Rápido Carregado com Sucesso!');
  }, 120);
}

// Redireciona teclas físicas com captura global (Hotkeys F1/F2, Botão R e WASD)
window.addEventListener('keydown', (e) => {
  // CRUCIAL: Ignora eventos sintéticos disparados por simulateKeyEvent
  // Permite que o motor WebAssembly receba F1, F2 e Shift sem que sejam bloqueados!
  if (!e.isTrusted) return;

  // Salvar Estado Rápido físico: F2 ou Shift+F1
  if (e.code === 'F2' || (e.code === 'F1' && e.shiftKey)) {
    e.preventDefault();
    e.stopPropagation();
    executeQuickSave();
    return;
  }

  // Carregar Estado Rápido físico: F1 (sem Shift)
  if (e.code === 'F1' && !e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();
    executeQuickLoad();
    return;
  }

  // Intercepta a tecla R física para Botão R do SNES (Tecla O no motor)
  // Evita que o motor mude para 4:3 ou dê reset acidental
  if (e.code === 'KeyR' && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    simulateKeyEvent('keydown', 'o');
    return;
  }

  // Redireciona setas do teclado do PC para WASD
  const arrowMap = { 'ArrowUp': 'w', 'ArrowDown': 's', 'ArrowLeft': 'a', 'ArrowRight': 'd' };
  if (arrowMap[e.code]) {
    simulateKeyEvent('keydown', arrowMap[e.code]);
  }
}, true);

window.addEventListener('keyup', (e) => {
  if (!e.isTrusted) return;

  if (e.code === 'F1' || e.code === 'F2') {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if (e.code === 'KeyR' && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    simulateKeyEvent('keyup', 'o');
    return;
  }

  const arrowMap = { 'ArrowUp': 'w', 'ArrowDown': 's', 'ArrowLeft': 'a', 'ArrowRight': 'd' };
  if (arrowMap[e.code]) {
    simulateKeyEvent('keyup', arrowMap[e.code]);
  }
}, true);

function simulateKeyEvent(type, keyName, modifiers = {}) {
  const info = KEY_MAP[keyName] || { key: keyName, code: keyName, keyCode: 0 };

  const eventInit = {
    key: info.key,
    code: info.code,
    keyCode: info.keyCode,
    which: info.keyCode,
    charCode: type === 'keypress' ? info.keyCode : 0,
    bubbles: false,
    cancelable: true,
    composed: true,
    ctrlKey: !!modifiers.ctrlKey,
    shiftKey: !!modifiers.shiftKey,
    altKey: !!modifiers.altKey,
    metaKey: false
  };

  const evt = new KeyboardEvent(type, eventInit);
  try {
    Object.defineProperty(evt, 'keyCode', { get: () => info.keyCode, configurable: true });
    Object.defineProperty(evt, 'which', { get: () => info.keyCode, configurable: true });
    Object.defineProperty(evt, 'charCode', { get: () => (type === 'keypress' ? info.keyCode : 0), configurable: true });
  } catch (e) {}

  window.dispatchEvent(evt);
  document.dispatchEvent(evt);
  if (canvas) canvas.dispatchEvent(evt);
}

// =========================================================================
// Inicialização do Motor e Carregamento de Recursos
// =========================================================================

// Preservação de dados e saves locais do jogador
// O banco IndexedDB '/saves' mantém o progresso salvo de forma permanente.

async function loadAssets() {
  statusText.textContent = 'Carregando dados em Português...';
  progressBar.style.width = '25%';

  try {
    try {
      const capRes = await fetch('chapters.json?v=' + Date.now());
      if (capRes.ok) chaptersData = await capRes.json();
    } catch (e) {
      console.warn('Não foi possível carregar chapters.json:', e);
    }

    const response = await fetch('assets.dat?v=' + Date.now());
    if (!response.ok) {
      throw new Error(`Falha ao obter assets.dat (HTTP ${response.status})`);
    }

    const contentLength = response.headers.get('content-length');
    let loaded = 0;
    const total = contentLength ? parseInt(contentLength, 10) : 698716;
    const reader = response.body.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      const pct = Math.min(95, Math.round((loaded / total) * 70) + 25);
      progressBar.style.width = `${pct}%`;
      statusText.textContent = `Carregando recursos em PT-BR: ${Math.round((loaded / 1024))} KB...`;
    }

    const allBytes = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) {
      allBytes.set(chunk, offset);
      offset += chunk.length;
    }

    progressBar.style.width = '100%';
    statusText.textContent = 'Pronto para jogar!';
    btnPlay.style.display = 'inline-block';

    btnPlay.addEventListener('click', () => {
      startOverlay.style.display = 'none';
      unlockAudio();
      bootGame(allBytes);
    }, { once: true });

  } catch (err) {
    statusText.textContent = `Erro ao carregar: ${err.message}`;
    statusText.style.color = '#ff6b6b';
    console.error(err);
  }
}

function unlockAudio() {
  if (audioContextUnlocked) return;
  audioContextUnlocked = true;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (AudioCtx) {
    const dummyCtx = new AudioCtx();
    dummyCtx.resume().then(() => dummyCtx.close()).catch(() => {});
  }
}

async function bootGame(assetBytes) {
  try {
    const createFn = window.createZeldaWeb || window.createZelda3 || (typeof createZeldaWeb !== 'undefined' ? createZeldaWeb : (typeof createZelda3 !== 'undefined' ? createZelda3 : null));
    if (!createFn) {
      throw new Error('Função de inicialização do motor WebAssembly não encontrada.');
    }

    const mod = await createFn({
      canvas: canvas,
      noInitialRun: true,
      locateFile: (path) => path.replace('zelda3.wasm', 'zelda.wasm'),
      print: (text) => console.log('[Zelda Web]', text),
      printErr: (text) => console.error('[Zelda Web]', text),
    });

    zeldaModule = mod;

    // Arquivos virtuais necessários para o motor em RAM
    mod.FS.writeFile('/zelda3.ini', generateIni());
    try { mod.FS.writeFile('zelda3.ini', generateIni()); } catch (e) {}
    try { mod.FS.writeFile('/zelda.ini', generateIni()); } catch (e) {}
    try { mod.FS.writeFile('zelda.ini', generateIni()); } catch (e) {}

    mod.FS.writeFile('/zelda3_assets.dat', assetBytes);
    try { mod.FS.writeFile('zelda3_assets.dat', assetBytes); } catch (e) {}
    try { mod.FS.writeFile('/zelda_assets.dat', assetBytes); } catch (e) {}
    try { mod.FS.writeFile('/assets.dat', assetBytes); } catch (e) {}
    try { mod.FS.writeFile('assets.dat', assetBytes); } catch (e) {}

    mod.FS.mkdir('/saves');
    try { mod.FS.mkdir('/saves/ref'); } catch (e) {}
    mod.FS.mount(mod.IDBFS, {}, '/saves');

    await new Promise((res) => {
      mod.FS.syncfs(true, (err) => {
        if (err) console.warn('Aviso ao carregar saves do IDBFS:', err);
        res();
      });
    });

    // Restauração de redundância do localStorage (se o IndexedDB estiver vazio no celular)
    try {
      const backupKeys = ['sram.dat', 'save0.sav', 'save1.sav'];
      for (const filename of backupKeys) {
        const filePath = `/saves/${filename}`;
        const existsInFS = mod.FS.analyzePath(filePath).exists;
        const localData = localStorage.getItem('zelda_backup_' + filename);
        if (!existsInFS && localData) {
          const binary = atob(localData);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          mod.FS.writeFile(filePath, bytes);
          console.log('[Save] Restaurado do backup do localStorage:', filePath, bytes.length, 'bytes');
        }
      }
    } catch (e) {
      console.warn('[Save] Aviso ao restaurar backup do localStorage:', e);
    }

    preloadChapters(mod);

    // Auto-sync suave periódico a cada 3s no IndexedDB e backup imediato de sram.dat
    setInterval(() => {
      if (!mod || !mod.FS) return;
      try {
        mod.FS.syncfs(false, () => {});
        const sramPath = '/saves/sram.dat';
        if (mod.FS.analyzePath(sramPath).exists) {
          const bytes = mod.FS.readFile(sramPath);
          if (bytes && bytes.length > 0) {
            localStorage.setItem('zelda_backup_sram.dat', uint8ToBase64(bytes));
          }
        }
      } catch (e) {}
    }, 3000);

    // Sincronizar imediatamente ao alternar aba, minimizar app no celular ou fechar
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') persistAllSaves();
    });
    window.addEventListener('pagehide', () => persistAllSaves());
    window.addEventListener('beforeunload', () => persistAllSaves());
    window.addEventListener('blur', () => persistAllSaves());

    mod.callMain(['--config', '/zelda3.ini']);
    canvas.focus();

    initTouchControls();
    initGamepadLoop();
    initGameMenu();
    renderChapters();

  } catch (e) {
    alert('Erro ao inicializar o motor WebAssembly: ' + e.message);
    console.error(e);
  }
}

async function preloadChapters(mod) {
  if (!chaptersData.length) return;
  for (const chap of chaptersData) {
    try {
      const res = await fetch(`saves/ref/${encodeURIComponent(chap.file)}`);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        mod.FS.writeFile(`/saves/ref/${chap.file}`, new Uint8Array(buf));
      }
    } catch (e) {}
  }
}

// =========================================================================
// Menu Zelda Web Flutuante com Opacidade (Image, Cheats, Chapters, Saves)
// =========================================================================

function applyShader(shaderName) {
  canvas.classList.remove(
    'filter-sharp',
    'filter-smooth',
    'filter-sharp-bilinear',
    'filter-xbr',
    'filter-omniscale'
  );
  screenFilter.className = '';

  if (shaderName === 'sharp') {
    canvas.classList.add('filter-sharp');
  } else if (shaderName === 'smooth') {
    canvas.classList.add('filter-smooth');
  } else if (shaderName === 'crt') {
    canvas.classList.add('filter-sharp');
    screenFilter.classList.add('filter-crt');
  } else if (shaderName === 'lcd') {
    canvas.classList.add('filter-sharp');
    screenFilter.classList.add('filter-lcd');
  } else if (shaderName === 'sharp-bilinear') {
    canvas.classList.add('filter-sharp-bilinear');
  } else if (shaderName === 'xbr') {
    canvas.classList.add('filter-xbr');
  } else if (shaderName === 'omniscale') {
    canvas.classList.add('filter-omniscale');
  }
}

function applyAspect(ratio) {
  canvas.classList.remove('aspect-16-9', 'aspect-4-3', 'aspect-16-10', 'aspect-fill', 'aspect-18-9');
  if (ratio === '16:9') {
    canvas.classList.add('aspect-16-9');
    showToast('📐 Proporção: Widescreen 16:9');
  } else if (ratio === '4:3') {
    canvas.classList.add('aspect-4-3');
    showToast('📐 Proporção: Clássica 4:3');
  } else if (ratio === '16:10') {
    canvas.classList.add('aspect-16-10');
    showToast('📐 Proporção: 16:10');
  } else if (ratio === 'fill') {
    canvas.classList.add('aspect-fill');
    showToast('📐 Proporção: Preencher Tela Cheia');
  }
}

function setSpeed(multiplier) {
  currentSpeed = multiplier;
  document.querySelectorAll('[data-speed]').forEach(opt => {
    opt.classList.toggle('active', parseInt(opt.dataset.speed, 10) === multiplier);
  });

  if (multiplier > 1) {
    simulateKeyEvent('keydown', 'Tab');
  } else {
    simulateKeyEvent('keyup', 'Tab');
  }
}

function initGameMenu() {
  const btnToggle = el('btn-menu-toggle');

  // Alternar visibilidade do menu flutuante ao tocar no botão de Menu
  btnToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    gameMenu.classList.toggle('menu-hidden');
  });

  // Impedir que cliques dentro do painel do menu o fechem
  gameMenu?.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Fechar o menu ao tocar fora no canvas do jogo
  canvas?.addEventListener('click', () => {
    if (!gameMenu.classList.contains('menu-hidden')) {
      gameMenu.classList.add('menu-hidden');
    }
  });

  // Fechar ao clicar/tocar em qualquer lugar da tela fora do menu
  document.addEventListener('click', (e) => {
    if (!gameMenu.classList.contains('menu-hidden') && !gameMenu.contains(e.target) && e.target !== btnToggle) {
      gameMenu.classList.add('menu-hidden');
    }
  });

  // Alternar abas do menu (Cheats, Image, Chapters, Saves)
  document.querySelectorAll('.game-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.game-tab').forEach(b => {
        b.classList.remove('active');
        b.textContent = b.textContent.replace(/^✓\s*/, '');
      });
      document.querySelectorAll('.game-tab-content').forEach(c => c.classList.remove('active'));

      tabBtn.classList.add('active');
      tabBtn.textContent = '✓ ' + tabBtn.textContent.trim();

      const targetId = tabBtn.dataset.tab;
      el(targetId)?.classList.add('active');
    });
  });

  // Seleção dos 7 Shaders de Imagem (Idênticos ao print do APK)
  document.querySelectorAll('[data-shader]').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('[data-shader]').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      applyShader(opt.dataset.shader);
      if (navigator.vibrate) navigator.vibrate(8);
    });
  });

  // Seleção de Aspect Ratio
  document.querySelectorAll('[data-aspect]').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('[data-aspect]').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      applyAspect(opt.dataset.aspect);
    });
  });

  // Seleção de Velocidade
  document.querySelectorAll('[data-speed]').forEach(opt => {
    opt.addEventListener('click', () => {
      setSpeed(parseInt(opt.dataset.speed, 10));
    });
  });

  // Botão Turbo Touch
  el('btn-touch-turbo')?.addEventListener('click', () => {
    isTurboActive = !isTurboActive;
    setSpeed(isTurboActive ? 2 : 1);
    el('btn-touch-turbo').classList.toggle('active', isTurboActive);
  });

  // Cheats
  el('opt-cheat-life')?.addEventListener('click', () => {
    simulateKeyEvent('keydown', 'F6');
    setTimeout(() => simulateKeyEvent('keyup', 'F6'), 100);
    showToast('❤️ Vida e magia restauradas!');
  });

  el('opt-cheat-keys')?.addEventListener('click', () => {
    simulateKeyEvent('keydown', 'F7');
    setTimeout(() => simulateKeyEvent('keyup', 'F7'), 100);
    showToast('🔑 Chaves, bombas e rupees no máximo!');
  });

  el('opt-cheat-walls')?.addEventListener('click', () => {
    simulateKeyEvent('keydown', 'e', { ctrlKey: true });
    setTimeout(() => simulateKeyEvent('keyup', 'e', { ctrlKey: true }), 100);
    showToast('🧱 Modo atravessar paredes alternado!');
  });

  // Saves - Salvar Estado Rápido
  el('opt-save-quick')?.addEventListener('click', () => {
    executeQuickSave();
  });

  // Saves - Carregar Estado Rápido
  el('opt-load-quick')?.addEventListener('click', () => {
    executeQuickLoad();
  });

  el('opt-download-srm')?.addEventListener('click', () => {
    if (!zeldaModule) return;
    try {
      const savePath = '/saves/sram.dat';
      if (!zeldaModule.FS.analyzePath(savePath).exists) {
        alert('Nenhum progresso gravado ainda dentro do jogo.');
        return;
      }
      const data = zeldaModule.FS.readFile(savePath);
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'zelda-web-br.sav';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erro ao exportar save: ' + e.message);
    }
  });

  const fileSaveInput = el('file-save-input');
  el('opt-upload-srm')?.addEventListener('click', () => fileSaveInput?.click());
  fileSaveInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !zeldaModule) return;
    try {
      const buffer = await file.arrayBuffer();
      zeldaModule.FS.writeFile('/saves/sram.dat', new Uint8Array(buffer));
      zeldaModule.FS.syncfs(false, (err) => {
        if (err) {
          alert('Erro ao persistir save no navegador: ' + err.message);
        } else {
          alert('Save (.sav) restaurado com sucesso! A página será recarregada.');
          location.reload();
        }
      });
    } catch (err) {
      alert('Erro ao carregar save: ' + err.message);
    }
  });

  el('opt-clean-reset')?.addEventListener('click', () => {
    if (confirm('Deseja iniciar um novo jogo limpo em Português? Isso apagará o save anterior salvo no navegador.')) {
      try {
        if (zeldaModule) {
          try { zeldaModule.FS.unlink('/saves/sram.dat'); } catch (e) {}
          try {
            localStorage.removeItem('zelda_backup_sram.dat');
            localStorage.removeItem('zelda_backup_save0.sav');
            localStorage.removeItem('zelda_backup_save1.sav');
          } catch (e) {}
          zeldaModule.FS.syncfs(false, () => {
            indexedDB.deleteDatabase('/saves');
            location.reload();
          });
        } else {
          indexedDB.deleteDatabase('/saves');
          location.reload();
        }
      } catch (e) {
        location.reload();
      }
    }
  });

  // Tela Cheia
  el('btn-fullscreen')?.addEventListener('click', () => {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) docEl.requestFullscreen();
      else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  });

  // Alternar Controles
  const touchControls = el('touch-controls');
  el('btn-toggle-controls')?.addEventListener('click', () => {
    touchControls.style.display = touchControls.style.display === 'none' ? 'block' : 'none';
  });
}

// Renderiza a lista de 13 capítulos com o mesmo design elegante
function renderChapters() {
  const container = el('game-chapters-list');
  if (!container || !chaptersData.length) return;

  container.innerHTML = '';
  chaptersData.forEach((chap, idx) => {
    const opt = document.createElement('div');
    opt.className = `game-option ${idx === 0 ? 'active' : ''}`;
    opt.innerHTML = `
      <span class="radio-indicator"></span>
      <span class="option-label">${chap.name}</span>
    `;

    opt.addEventListener('click', () => {
      document.querySelectorAll('#game-chapters-list .game-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      loadChapter(chap);
    });

    container.appendChild(opt);
  });
}

async function loadChapter(chap) {
  if (!zeldaModule) return;
  try {
    const refPath = `/saves/ref/${chap.file}`;
    let chapterBytes = null;

    try {
      chapterBytes = zeldaModule.FS.readFile(refPath);
    } catch (e) {
      const res = await fetch(`saves/ref/${encodeURIComponent(chap.file)}`);
      if (res.ok) {
        chapterBytes = new Uint8Array(await res.arrayBuffer());
        zeldaModule.FS.writeFile(refPath, chapterBytes);
      }
    }

    if (!chapterBytes) {
      alert('Arquivo de capítulo indisponível.');
      return;
    }

    // Aciona a tecla de LoadRef correspondente ao capítulo
    simulateKeyEvent('keydown', chap.key);
    setTimeout(() => simulateKeyEvent('keyup', chap.key), 120);
    canvas.focus();
  } catch (err) {
    alert('Erro ao carregar capítulo: ' + err.message);
  }
}

// =========================================================================
// Controles de Toque (Otimizados para Celular/Tablet)
// =========================================================================

function initTouchControls() {
  const activeKeys = new Set();

  function pressKey(key) {
    if (!activeKeys.has(key)) {
      activeKeys.add(key);
      simulateKeyEvent('keydown', key);
    }
  }

  function releaseKey(key) {
    if (activeKeys.has(key)) {
      activeKeys.delete(key);
      simulateKeyEvent('keyup', key);
    }
  }

  function bindSimpleTouch(element, keyName) {
    if (!element) return;

    const onStart = (e) => {
      e.preventDefault();
      element.classList.add('active');
      pressKey(keyName);
      if (navigator.vibrate) navigator.vibrate(8);
    };

    const onEnd = (e) => {
      e.preventDefault();
      element.classList.remove('active');
      releaseKey(keyName);
    };

    element.addEventListener('touchstart', onStart, { passive: false });
    element.addEventListener('touchend', onEnd, { passive: false });
    element.addEventListener('touchcancel', onEnd, { passive: false });

    element.addEventListener('mousedown', onStart);
    element.addEventListener('mouseup', onEnd);
    element.addEventListener('mouseleave', onEnd);
  }

  document.querySelectorAll('.action-btn, .shoulder-btn, .center-btn:not(.btn-turbo)').forEach(btn => {
    bindSimpleTouch(btn, btn.dataset.key);
  });

  // D-Pad com suporte a arrasto e diagonais (WASD)
  const dpadZone = el('dpad-zone');
  const dpadButtons = {
    'w': document.querySelector('.dpad-up'),
    's': document.querySelector('.dpad-down'),
    'a': document.querySelector('.dpad-left'),
    'd': document.querySelector('.dpad-right')
  };

  function updateDpadFromCoords(x, y) {
    const rect = dpadZone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const neededKeys = new Set();
    const deadzone = 12;

    if (dist > deadzone) {
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      if (angle >= -157.5 && angle <= -112.5) {
        neededKeys.add('w'); neededKeys.add('a');
      } else if (angle > -112.5 && angle < -67.5) {
        neededKeys.add('w');
      } else if (angle >= -67.5 && angle <= -22.5) {
        neededKeys.add('w'); neededKeys.add('d');
      } else if (angle > -22.5 && angle < 22.5) {
        neededKeys.add('d');
      } else if (angle >= 22.5 && angle <= 67.5) {
        neededKeys.add('s'); neededKeys.add('d');
      } else if (angle > 67.5 && angle < 112.5) {
        neededKeys.add('s');
      } else if (angle >= 112.5 && angle <= 157.5) {
        neededKeys.add('s'); neededKeys.add('a');
      } else {
        neededKeys.add('a');
      }
    }

    ['w', 's', 'a', 'd'].forEach(k => {
      if (neededKeys.has(k)) {
        pressKey(k);
        dpadButtons[k]?.classList.add('active');
      } else {
        releaseKey(k);
        dpadButtons[k]?.classList.remove('active');
      }
    });
  }

  function clearDpad() {
    ['w', 's', 'a', 'd'].forEach(k => {
      releaseKey(k);
      dpadButtons[k]?.classList.remove('active');
    });
  }

  let dpadTouchId = null;

  dpadZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    dpadTouchId = touch.identifier;
    updateDpadFromCoords(touch.clientX, touch.clientY);
    if (navigator.vibrate) navigator.vibrate(8);
  }, { passive: false });

  dpadZone.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === dpadTouchId) {
        updateDpadFromCoords(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  }, { passive: false });

  const endDpadTouch = (e) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === dpadTouchId) {
        dpadTouchId = null;
        clearDpad();
        break;
      }
    }
  };

  dpadZone.addEventListener('touchend', endDpadTouch, { passive: false });
  dpadZone.addEventListener('touchcancel', endDpadTouch, { passive: false });
}

// Gamepad Bluetooth
function initGamepadLoop() {
  const gpButtonMapping = {
    0: 'k',          // A no Xbox/PS -> B no SNES (Espada) [Tecla K]
    1: 'l',          // B no Xbox/PS -> A no SNES (Ação) [Tecla L]
    2: 'j',          // X no Xbox/PS -> Y no SNES (Correr) [Tecla J]
    3: 'i',          // Y no Xbox/PS -> X no SNES (Mapa) [Tecla I]
    4: 'q',          // L1 / LB -> L no SNES [Tecla Q]
    5: 'o',          // R1 / RB -> R no SNES [Tecla O]
    8: 'Shift',      // Select / Back
    9: 'Enter',      // Start
    12: 'w',         // Dpad Cima [Tecla W]
    13: 's',         // Dpad Baixo [Tecla S]
    14: 'a',         // Dpad Esquerda [Tecla A]
    15: 'd'          // Dpad Direita [Tecla D]
  };

  const gpState = {};

  function pollGamepads() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
      if (!gp) continue;

      for (const [btnIdx, keyName] of Object.entries(gpButtonMapping)) {
        const isPressed = gp.buttons[btnIdx] && gp.buttons[btnIdx].pressed;
        const wasPressed = gpState[btnIdx] || false;

        if (isPressed && !wasPressed) {
          simulateKeyEvent('keydown', keyName);
        } else if (!isPressed && wasPressed) {
          simulateKeyEvent('keyup', keyName);
        }
        gpState[btnIdx] = isPressed;
      }

      const deadzone = 0.35;
      const axX = gp.axes[0] || 0;
      const axY = gp.axes[1] || 0;

      const left = axX < -deadzone;
      const right = axX > deadzone;
      const up = axY < -deadzone;
      const down = axY > deadzone;

      const checkAxis = (stateKey, isNow, keyName) => {
        if (isNow && !gpState[stateKey]) simulateKeyEvent('keydown', keyName);
        if (!isNow && gpState[stateKey]) simulateKeyEvent('keyup', keyName);
        gpState[stateKey] = isNow;
      };

      checkAxis('ax_left', left, 'ArrowLeft');
      checkAxis('ax_right', right, 'ArrowRight');
      checkAxis('ax_up', up, 'ArrowUp');
      checkAxis('ax_down', down, 'ArrowDown');

      break;
    }
    requestAnimationFrame(pollGamepads);
  }

  requestAnimationFrame(pollGamepads);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', loadAssets);
} else {
  loadAssets();
}

// =========================================================================
// PWA (Progressive Web App) - Registro de Service Worker e Instalação
// =========================================================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      console.log('[PWA] Service Worker registrado com sucesso:', reg.scope);
    }).catch((err) => {
      console.warn('[PWA] Falha ao registrar Service Worker:', err);
    });
  });
}

let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btnInstall = el('btn-install-app');
  if (btnInstall) btnInstall.style.display = 'inline-flex';
  const menuInstall = el('opt-install-pwa');
  if (menuInstall) menuInstall.style.display = 'flex';
  console.log('[PWA] Pronto para instalar!');
});

async function triggerInstallPrompt() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    console.log('[PWA] Escolha do usuário:', outcome);
    deferredInstallPrompt = null;
    const btn = el('btn-install-app');
    if (btn) btn.style.display = 'none';
    const opt = el('opt-install-pwa');
    if (opt) opt.style.display = 'none';
  } else {
    alert('📱 Para instalar Zelda Web:\n\n• No Android (Google Chrome): Toque nos 3 pontinhos (⋮) no topo direito e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".\n\n• No PC (Google Chrome ou Edge): Clique no ícone de instalar (computador com seta) no canto direito da barra de endereços.\n\n• No iPhone/iPad (Safari): Toque no botão Compartilhar e selecione "Adicionar à Tela de Início".');
  }
}

el('btn-install-app')?.addEventListener('click', triggerInstallPrompt);
el('opt-install-pwa')?.addEventListener('click', triggerInstallPrompt);

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const btn = el('btn-install-app');
  if (btn) btn.style.display = 'none';
  const opt = el('opt-install-pwa');
  if (opt) opt.style.display = 'none';
  console.log('[PWA] Aplicativo instalado com sucesso na tela inicial!');
});
