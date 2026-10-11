"""Gera IPS PT-BR v7 a partir de ROM original (USA), sem distribuir o jogo."""
import csv, re, sys, unicodedata, zlib, hashlib
from pathlib import Path

T = {0x0d:' ',0x56:'?',0x5a:':',0x5b:';',0x66:"'",0x67:'“',0x68:'-',0x69:',',0x6a:'.',0x82:'<B>',0x85:'!',0xf9:'<BR>',0xfa:'<BD>',0xef:' <B>',0xc9:'  ',0xca:'er',0xcb:'ar',0xcc:'an',0xcd:'be',0xce:'re',0xcf:'de',0xd0:'me',0xd1:'is',0xd2:'if ',0xd3:'ll',0xd4:'se',0xd5:'es',0xd6:'n’t',0xd7:'you ',0xd8:' the',0xd9:'The ',0xda:'it ',0xdb:'It ',0xdc:'to ',0xdd:'We ',0xde:'We ',0xdf:'ty',0xe0:"I'm ",0xe1:'have',0xe2:'ble',0xe3:'do',0xe4:'my',0xe5:'oo',0xe6:'st',0xe7:'ed',0xe8:'on',0xe9:'fa',0xea:'y ',0xeb:'d ',0xec:'n ',0xed:'wh',0xee:'in'}
T.update({i:chr(65+i-0x20) for i in range(0x20,0x3a)})
T.update({i:chr(97+i-0x3a) for i in range(0x3a,0x54)})
T.update({i:str(i) for i in range(10)})
for c,v in {'6b':'<HT>','6c':'<SB>','6d':'<CR>','6e':'<MK>','6f':'<HA>','70':'<AX>','71':'<SW>','72':'<KN>','73':'<ST>','74':'<AR>','75':'<SH>','76':'<CK>','7a':'<AM>','7d':'<RD>','7e':'<ML>','7f':'<RB>','88':'<MC>','8b':'<IT>','8c':'<GD>'}.items():T[int(c,16)]=v
G={k:v for k,v in T.items() if k not in (0xf7,0xf9,0xfa) and v and not v.startswith('<') and not v.startswith('*') and not v.startswith('(')}
G.update({0x82:'<B>',0xf9:'<BR>',0xfa:'<BD>',0x88:'<MC>',0x8b:'<IT>',0x8c:'<GD>',0x0d:' ',0x57:'<1>',0x58:'<2>',0x59:'<3>'})
for key,val in T.items():
    if val.startswith('<') and val.endswith('>') and val not in ('<END>', '<f1>', '<f3>', '<f5>', '<8f>'):
        G[key]=val
TOKENS=sorted(((v,k) for k,v in G.items()),key=lambda x:len(x[0]),reverse=True)
TOKENS_MISC=[(v,k) for v,k in TOKENS if k<0xc9]
CONTROL={0xf6:1,0xfb:5,0xfc:5,0xfd:2,0xfe:2,0xff:3}

def encode(s,mte):
    s=unicodedata.normalize('NFKD',s)
    s=''.join(c for c in s if not unicodedata.combining(c)).replace('’',"'")
    out=bytearray();pos=0
    tokens=TOKENS if mte else TOKENS_MISC
    while pos<len(s):
        m=re.match(r'\{(f6|fb|fc|fd|fe|ff):([0-9a-f]+)\}',s[pos:])
        if m:
            b=int(m.group(1),16);data=bytes.fromhex(m.group(2))
            assert len(data)==CONTROL[b]
            out.append(b);out.extend(data);pos+=len(m.group());continue
        if s.startswith('<f3>',pos):out.append(0xf3);pos+=4;continue
        if s.startswith('<f5>',pos):out.append(0xf5);pos+=4;continue
        if s.startswith('<f1>',pos):out.append(0xf1);pos+=4;continue
        if s.startswith('<8f>',pos):out.append(0x8f);pos+=4;continue
        for token,value in tokens:
            if s.startswith(token,pos):out.append(value);pos+=len(token);break
        else:raise ValueError('Símbolo não suportado: '+repr(s[pos:pos+50]))
    return bytes(out)

def make_ips(old,new):
    data=bytearray(b'PATCH');i=0
    while i<len(old):
        if old[i]==new[i]:i+=1;continue
        j=i
        while j<len(old) and old[j]!=new[j] and j-i<65535:j+=1
        data+=i.to_bytes(3,'big')+(j-i).to_bytes(2,'big')+new[i:j]
        i=j
    return bytes(data+b'EOF')

def main():
    if len(sys.argv)!=4:
        sys.exit('Uso: python build_ips_public.py "7th Saga, The (USA).sfc" traducao/textos-ptbr-v7.csv patch.ips')
    rom_path,csv_path,patch_path=map(Path,sys.argv[1:])
    original=rom_path.read_bytes()
    assert len(original)==1572864,'ROM com tamanho incorreto'
    assert zlib.crc32(original)==0xB3ABDDE6,'ROM não reconhecida (CRC32 diferente)'
    rom=bytearray(original);count=0
    with csv_path.open(encoding='utf-8-sig',newline='') as f:
        for item in csv.DictReader(f):
            if item['Estado']!='TRADUZIDO' or not item['Traducao brasileira']:continue
            start=int(item['Offset hexadecimal'],16)
            budget=int(item['Bytes disponiveis'])
            new=encode(item['Traducao brasileira'],item['Secao']!='misc1')
            assert len(new)<=budget,(start,len(new),budget)
            assert original[start+budget]==0xf7,(hex(start),'Terminador original ausente')
            rom[start:start+budget]=new+bytes([0xf7])*(budget-len(new))
            count+=1
    checksum=(sum(rom)+sum(rom[0x100000:]))&0xffff
    rom[0xffdc:0xffde]=(checksum^0xffff).to_bytes(2,'little')
    rom[0xffde:0xffe0]=checksum.to_bytes(2,'little')
    patch=make_ips(original,rom)
    patch_path.write_bytes(patch)
    print(f'Gerado {patch_path}, {count} registros; {len(patch)} bytes')
    print('ROM resultante SHA256:',hashlib.sha256(rom).hexdigest())

if __name__=='__main__':main()
