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
    'Reset = Ctrl+r',
    'Pause = Shift+p',
    'Load = F1, F2, F3, F4, F5',
    'Save = Shift+F1, Shift+F2, Shift+F3, Shift+F4, Shift+F5',
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

  // Sistema / Menus
  'Shift':      { key: 'Shift',      code: 'ShiftRight', keyCode: 16 }, // Select
  'Enter':      { key: 'Enter',      code: 'Enter',      keyCode: 13 }, // Start
  'Tab':        { key: 'Tab',        code: 'Tab',        keyCode: 9 },  // Turbo / Acelerar
  'F6':         { key: 'F6',         code: 'F6',         keyCode: 117 }, // Cheat: Vida
  'F7':         { key: 'F7',         code: 'F7',         keyCode: 118 }, // Cheat: Chaves
  'F1':         { key: 'F1',         code: 'F1',         keyCode: 112 },
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

// Redireciona fisicamente as setas do teclado do PC para WASD
window.addEventListener('keydown', (e) => {
  const arrowMap = { 'ArrowUp': 'w', 'ArrowDown': 's', 'ArrowLeft': 'a', 'ArrowRight': 'd' };
  if (arrowMap[e.code]) {
    simulateKeyEvent('keydown', arrowMap[e.code]);
  }
});
window.addEventListener('keyup', (e) => {
  const arrowMap = { 'ArrowUp': 'w', 'ArrowDown': 's', 'ArrowLeft': 'a', 'ArrowRight': 'd' };
  if (arrowMap[e.code]) {
    simulateKeyEvent('keyup', arrowMap[e.code]);
  }
});

function simulateKeyEvent(type, keyName, modifiers = {}) {
  const info = KEY_MAP[keyName] || { key: keyName, code: keyName, keyCode: 0 };

  const eventInit = {
    key: info.key,
    code: info.code,
    keyCode: info.keyCode,
    which: info.keyCode,
    bubbles: true,
    cancelable: true,
    ctrlKey: !!modifiers.ctrlKey,
    shiftKey: !!modifiers.shiftKey,
    altKey: !!modifiers.altKey
  };

  const evt = new KeyboardEvent(type, eventInit);
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
        if (err) console.warn('Aviso ao carregar saves:', err);
        res();
      });
    });

    preloadChapters(mod);

        // Sincronização Periódica e Automática com o IndexedDB do Navegador
    let lastSaveMtime = 0;
    let isSyncing = false;

    const syncSaveToIndexedDB = (force = false) => {
      if (!mod || !mod.FS || isSyncing) return;
      try {
        const savePath = '/saves/sram.dat';
        if (mod.FS.analyzePath(savePath).exists) {
          const st = mod.FS.stat(savePath);
          const mtime = st.mtime instanceof Date ? st.mtime.getTime() : Number(st.mtime);
          if (force || mtime > lastSaveMtime) {
            lastSaveMtime = mtime;
            isSyncing = true;
            mod.FS.syncfs(false, (err) => {
              isSyncing = false;
              if (err) console.warn('[Zelda Web] Erro ao sincronizar save no navegador:', err);
              else console.log('[Zelda Web] Progresso sincronizado no navegador com sucesso.');
            });
          }
        }
      } catch (e) {
        isSyncing = false;
      }
    };

    // Auto-sync suave a cada 2 segundos se o motor do jogo tiver modificado o save
    setInterval(() => syncSaveToIndexedDB(false), 2000);

    // Sincronizar imediatamente ao ocultar a aba, alternar app no Android ou fechar
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') syncSaveToIndexedDB(true);
    });
    window.addEventListener('pagehide', () => syncSaveToIndexedDB(true));
    window.addEventListener('beforeunload', () => syncSaveToIndexedDB(true));
    window.addEventListener('blur', () => syncSaveToIndexedDB(false));

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
  canvas.className = canvas.className.replace(/\baspect-[a-z0-9-]+\b/g, '');
  if (ratio === '16:9') canvas.classList.add('aspect-16-9');
  else if (ratio === '4:3') canvas.classList.add('aspect-4-3');
  else if (ratio === '16:10') canvas.classList.add('aspect-16-10');
  else if (ratio === '18:9') canvas.classList.add('aspect-18-9');
  else if (ratio === 'fill') canvas.classList.add('aspect-fill');
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
    alert('❤️ Vida e magia restauradas!');
  });

  el('opt-cheat-keys')?.addEventListener('click', () => {
    simulateKeyEvent('keydown', 'F7');
    setTimeout(() => simulateKeyEvent('keyup', 'F7'), 100);
    alert('🔑 Chaves, bombas e rupees no máximo!');
  });

  el('opt-cheat-walls')?.addEventListener('click', () => {
    simulateKeyEvent('keydown', 'e', { ctrlKey: true });
    setTimeout(() => simulateKeyEvent('keyup', 'e', { ctrlKey: true }), 100);
    alert('🧱 Modo atravessar paredes alternado!');
  });

  // Saves
  el('opt-save-quick')?.addEventListener('click', () => {
    simulateKeyEvent('keydown', 'F1', { shiftKey: true });
    setTimeout(() => simulateKeyEvent('keyup', 'F1', { shiftKey: true }), 100);
    alert('💾 Estado rápido salvo!');
  });

  el('opt-load-quick')?.addEventListener('click', () => {
    simulateKeyEvent('keydown', 'F1');
    setTimeout(() => simulateKeyEvent('keyup', 'F1'), 100);
  });

  el('opt-download-srm')?.addEventListener('click', () => {
    if (!zeldaModule) return;
    try {
      const savePath = '/saves/sram.dat';
      if (!zeldaModule.FS.analyzePath(savePath).exists) {
        alert('Nenhum progresso gravado ainda dentro do jogo. Comece um jogo e salve primeiro!');
        return;
      }
      // Garante sincronização antes de exportar
      zeldaModule.FS.syncfs(false, () => {});

      const data = zeldaModule.FS.readFile(savePath);
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'zelda-web-br.sav';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erro ao exportar save: ' + e.message);
    }
  });

  const fileSaveInput = el('file-save-input');
  el('opt-upload-srm')?.addEventListener('click', () => {
    if (fileSaveInput) {
      fileSaveInput.value = '';
      fileSaveInput.click();
    }
  });

  fileSaveInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !zeldaModule) return;
    try {
      const buffer = await file.arrayBuffer();
      const saveBytes = new Uint8Array(buffer);
      if (saveBytes.length < 512) {
        alert('O arquivo selecionado é inválido ou está vazio.');
        return;
      }
      zeldaModule.FS.writeFile('/saves/sram.dat', saveBytes);
      zeldaModule.FS.syncfs(false, (err) => {
        if (err) {
          alert('Erro ao persistir save no navegador: ' + err.message);
        } else {
          alert('Save (.sav) restaurado com sucesso! O jogo será recarregado.');
          location.reload();
        }
      });
    } catch (err) {
      alert('Erro ao carregar save: ' + err.message);
    }
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
