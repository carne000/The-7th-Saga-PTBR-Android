# The 7th Saga — Tradução PT-BR + Android (projeto comunitário)

Projeto de tradução brasileira **não oficial** de *The 7th Saga* (SNES) e interface experimental para Android com controles virtuais, filtros de imagem, trapaças e execução offline.

## Estado atual
- **Tradução:** v7, **parcial**, sem acentos; diálogos e interfaces ainda precisam de revisão e testes completos.
- **Android:** interface v4 personalizada, testada pelo usuário no celular. Usa o emulador [EmulatorJS](https://github.com/EmulatorJS/EmulatorJS) / Snes9x.
- **Distribuição pública:** este repositório não inclui a ROM comercial nem um APK que contenha a ROM.

## Como jogar com sua própria cópia
1. Tenha uma ROM americana obtida legalmente de *The 7th Saga* (SNES), sem cabeçalho, de 1.572.864 bytes. CRC32 esperado: `B3ABDDE6`.
2. Aplique o patch IPS da pasta `patches/` usando um aplicador IPS de sua escolha.
3. Abra a ROM resultante em um emulador SNES compatível, como o Snes9x EX+ no Android.
4. A tradução ainda é parcial. Faça backup dos salvamentos.

## Aplicativo Android
A versão personalizada roda com uma ROM integrada ao APK, mas **o APK completo não é redistribuído publicamente aqui** porque contém material do jogo comercial. Os arquivos próprios da interface serão incluídos na pasta `android/`, sem ROM ou núcleo comercial.

## Trapaças
Podem modificar valores ou eventos e corromper progressos. Ative apenas após salvar. Alguns códigos do Game Genie exigem começar uma partida nova. Nem todos foram validados com a ROM traduzida.

## Créditos e direitos
- *The 7th Saga* e todos os recursos originais do jogo pertencem aos respectivos detentores dos direitos.
- Projeto independente de tradução PT-BR.
- EmulatorJS e Snes9x são projetos de terceiros, cada qual com suas próprias licenças. Consulte os repositórios oficiais antes de redistribuir esses componentes.

**Não envie ROMs comerciais para este repositório.** Compartilhe somente patches e arquivos próprios.

## Como contribuir
Abra uma *issue* descrevendo o trecho a revisar, a versão usada e, se possível, capturas de tela. Não publique trechos extensos do roteiro original.


## Downloads públicos

- **[Baixar patch IPS v7](https://github.com/carne000/The-7th-Saga-PTBR-Android/raw/refs/heads/main/patches/the-7th-saga-ptbr-v7.ips)** (92.606 bytes)
- [Planilha da tradução em português, sem textos ingleses originais](traducao/textos-ptbr-v7.csv)
- [Gerador do IPS em Python](traducao/build_ips_public.py)
- [Interface Android v4: menus, controles, cheats e artes](android/README.md)

### Recriar o patch sem baixar o IPS

O gerador Python usa a planilha pública e uma cópia original da ROM americana. Exemplo, na raiz do repositório:

```sh
python3 traducao/build_ips_public.py "7th Saga, The (USA).sfc" traducao/textos-ptbr-v7.csv traducao-ptbr-v7.ips
```

Validado localmente: o patch gerado é **idêntico byte a byte** ao IPS v7 disponível para download.
SHA-256 do IPS: `6beefdc58f4d9840773f18583fffb7bb092f4308040e7621a6ebe0c2ec4e70d2`.

### Limitações

A interface Android publicada **não é um APK completo**: os arquivos próprios foram preservados, mas faltam o contêiner nativo Android e as dependências externas de emulação. O APK instalado pelo criador do projeto contém uma ROM comercial e, por isso, não é publicado neste repositório público. Cada pessoa deve utilizar sua própria ROM.
