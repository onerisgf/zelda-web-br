# 🗡️ Zelda Web - A Link to the Past (PT-BR)

Versão nativa em **WebAssembly** de *The Legend of Zelda: A Link to the Past*, totalmente em **Português (PT-BR)**, com suporte a **Widescreen 16:9**, gráficos em alta definição (**HD Mode 7 / Shaders**) e jogável direto pelo navegador no PC ou no celular (iOS / Android).

---

## ✨ Recursos

- 🇧🇷 **100% em Português do Brasil**: diálogos, menus, introdução e itens totalmente traduzidos.
- 🖥️ **Widescreen 16:9 Nativo**: sem esticar imagem, exibindo mais visão de campo do mapa.
- 🎨 **Shaders e Filtros Visuais**:
  - *Sharp pixels* (pixel art nítido)
  - *Smooth*
  - *CRT Lottes* (efeito de tubo de TV retrô)
  - *LCD grid* (grade de tela portátil)
  - *Sharp bilinear*
  - *xBR*
  - *OmniScale*
- ⚡ **Turbo & Cheats Integrados**: acelerador de jogo (1x, 2x, 4x), recuperação de vida e recursos.
- 📖 **Seletor de Capítulos**: escolha qualquer capítulo da aventura para pular diretamente até lá.
- 💾 **Salvamento no Navegador**: gravação automática no IndexedDB, com suporte a exportação e importação de saves `.srm`.
- 🎮 **Controles Customizados e Suporte a Gamepad**:
  - Teclado: `W, A, S, D` para movimentação.
  - Ações: `K` (Espada/B), `L` (Ação/A), `J` (Correr/Y), `I` (Mapa/X), `Q` (L), `O` (R), `Enter` (Start), `Shift` (Select).
  - Celular / Tablet: botões virtuais na tela com D-Pad analógico/arrasto.
  - Suporte nativo a gamepads Bluetooth e USB (Xbox, PlayStation, etc.).

---

## 🚀 Como Jogar Localmente

1. Execute o arquivo `iniciar_servidor.bat` (ou inicie um servidor HTTP local: `python -m http.server 8080`).
2. Abra no navegador:
   - No PC: [http://localhost:8080](http://localhost:8080)
   - No Celular / iPad: `http://<IP-DO-SEU-PC>:8080` (no mesmo Wi-Fi).

---

## 🌐 Publicação no GitHub Pages

Este projeto é 100% estático (HTML5 + WebAssembly). Ao enviar para o GitHub, você pode ativar o **GitHub Pages** nas configurações do repositório (`Settings > Pages > Branch: main`) para ter o jogo online 24/7 de graça para qualquer pessoa jogar!
