# Rastreamento de movimento — experimentos do porte nativo

Ferramenta: `tools/analisar_movimento_frz.py`.

O sistema registra **candidatos**, não coordenadas do mundo confirmadas. Compara a
WRAM entre save states Snes9x e busca valores de 16 bits que acompanhem a
rolagem da câmera com deslocamento relativo constante.

## Evidência já documentada

Na fase 26, duas capturas feitas pelo usuário na mesma área registraram BG1HOFS
de 208 para 368 (+160), com o candidato a sprite do jogador próximo de
(112,94). Os endereços da WRAM `$7E:0030` e `$7E:1D11` coincidiram com essa
rolagem. Na fase 27, outros endereços foram investigados e sete mantiveram
deslocamentos relativos constantes em três capturas.

A correlação **não** prova posição lógica do protagonista, colisão,
velocidade, tile de mapa ou direção do passo. Uma captura de personagem parado
após tentar atravessar uma parede ainda será necessária para investigar
bloqueio; mais de dois frames em momentos conhecidos ajudam muito.

## Executar localmente

```sh
python3 native-port/tools/analisar_movimento_frz.py --self-test
python3 native-port/tools/analisar_movimento_frz.py \
  "antes.frz" "depois.frz" "terceiro.frz" \
  --out candidatos.json
```

O relatório traz apenas nomes, hashes, valores e endereços selecionados, não
inclui os bytes de RAM dos save states. **Não publique** os save states ou uma
ROM em um repositório público. Se os espelhos da câmera discordarem, a análise
para com erro para impedir conclusões enganosas.

A ferramenta aceita snapshots Snes9x com cabeçalho e blocos nomeados
`RAM` de 128 KiB; não suporta automaticamente todos os outros formatos,
versões de emulador e programas. As versões testadas devem ser registradas.

## Critério para incorporar ao Godot

1. Confirmar o candidato em pelo menos três capturas **do mesmo local**,
   com deslocamentos conhecidos.
2. Verificar que o candidato não é apenas uma cópia de BG1HOFS.
3. Confirmar posição do objeto controlado com OAM em frames adjacentes.
4. Usar ensaios direcionais/colisões para distinguir câmera, posição e
   bloqueios.
5. Só depois substituir os controles provisórios pela mecânica observada.

A tradução PT-BR v7 ainda é parcial. O porte ainda não é um jogo nativo
jogável e não há APK nativo verificado.

Este diretório contém somente código e documentação próprios, sem materiais
comerciais da ROM.
