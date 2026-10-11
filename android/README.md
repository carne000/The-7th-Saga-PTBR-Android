# Interface Android v4 — arquivos públicos

Esta pasta contém **apenas os arquivos próprios da interface** extraídos do APK Android offline v4 personalizado.

## Arquivos
- `index.html`: menu de entrada, diálogos de configurações e estrutura da interface.
- `saga-app.js`: controle das preferências, transparência e posição dos controles, seleção de shaders e menus.
- `saga-cheats.js`: catálogo de trapaças para The 7th Saga (códigos desativados por padrão).
- `saga-theme.css`: tema visual clássico.
- `assets/cover.webp` e `assets/icon.webp`: arte e ícone do projeto.

## O que **não** está incluído
- ROM do jogo (arquivo `.sfc`);
- núcleo, arquivos binários ou bibliotecas do emulador;
- APK completo;
- projeto Android Gradle ou o código nativo do contêiner WebView.

Esses arquivos são uma **base de interface**, não um projeto Android completo pronto para compilar. As referências `file:///android_asset/` foram usadas no APK original e devem ser adaptadas ao contêiner Android escolhido.

Para emulação, consulte o [EmulatorJS](https://github.com/EmulatorJS/EmulatorJS) e o Snes9x, respeitando suas licenças. Não adicione ROMs comerciais ou materiais com direitos de terceiros ao repositório.

### Trapaças e shaders
Os códigos são específicos de versões do jogo, podem ser incompatíveis com outras revisões e não são garantidos. Faça backup da partida antes de ativar qualquer modificação.
