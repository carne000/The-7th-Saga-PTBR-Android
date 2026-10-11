(()=>{'use strict';
const $=id=>document.getElementById(id), che=window.SAGA_CHEATS||[];
const defaults={opacity:75,size:100,layout:'normal',showLR:true,leftX:0,leftY:0,rightX:0,rightY:0,centerX:0,centerY:0,shader:'disabled',scale:'pixel',showCodes:true,active:[]};
let prefs={...defaults},started=false,ready=false,current='settings',tab='video',editing=false,drag=null;
try{const saved=JSON.parse(localStorage.getItem('saga7-app-v4')||'{}');prefs={...defaults,...saved};if(!Array.isArray(prefs.active))prefs.active=[];}catch(e){}
const safeSave=()=>{try{localStorage.setItem('saga7-app-v4',JSON.stringify(prefs))}catch(e){}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const startedEm=()=>window.EJS_emulator&&window.EJS_emulator.gameManager&&window.EJS_emulator.started?window.EJS_emulator:null;
let toastHandle=0;function toast(msg){$('toast').textContent=msg;$('toast').style.display='block';clearTimeout(toastHandle);toastHandle=setTimeout(()=>$('toast').style.display='none',2800)}
function open(which,section){current=which;tab=section|| (which==='settings'?'video':'all');$('modal').classList.add('show');render();}
function close(){$('modal').classList.remove('show')}
const cats=['Todas',...new Set(che.map(c=>c.cat))];
function render(){ $('modal-title').textContent=current==='settings'?'CONFIGURAÇÕES':current==='cheats'?'TRAPAÇAS':'SOBRE O JOGO';
 $('tabs').innerHTML='';
 if(current==='settings'){
 const tabs=[['video','Vídeo e shaders'],['controls','Controles'],['layout','Posição'],['general','Geral']];
 $('tabs').innerHTML=tabs.map(([id,label])=>`<button class="tab ${tab===id?'active':''}" data-tab="${id}">${label}</button>`).join('');
 const b=$('modal-body');
 if(tab==='video')b.innerHTML=`<h3 class="section-title">Filtros de imagem e shaders</h3><p class="hint">Os shaders usam recursos gráficos do celular. Se a imagem travar, volte para Desligado.</p><div class="choices" id="shaderChoices"></div><div class="setting"><label>Suavização da imagem</label><select id="scale"><option value="pixel">Pixels nítidos</option><option value="smooth">Imagem suavizada</option></select></div><p class="hint">CRT: efeito de televisão antiga. HQ2x: contornos suavizados. Scanlines: linhas horizontais clássicas.</p>`;
 else if(tab==='controls')b.innerHTML=`<h3 class="section-title">Aparência dos controles</h3>${ranger('opacity','Transparência / visibilidade','%',30,100,5)}${ranger('size','Tamanho dos botões','%',65,145,5)}<div class="setting"><label>Exibir botões L e R</label><input type="checkbox" id="showLR"></div><div class="setting"><label>Perfil dos controles</label><select id="layout"><option value="normal">Clássico</option><option value="compact">Compacto</option><option value="lefty">Canhoto</option></select></div><p class="hint">Você pode alterar as posições na aba Posição ou arrastar diretamente os grupos de botões na tela.</p>`;
 else if(tab==='layout')b.innerHTML=`<h3 class="section-title">Posição dos grupos de botões</h3><div class="choices"><button id="editLayout" class="primary">✥ ARRASTAR CONTROLES</button><button id="resetLayout" class="secondary">RESTAURAR POSIÇÕES</button></div>${ranger('leftX','Direcional ↔','px',-160,180,5)}${ranger('leftY','Direcional ↕','px',-120,130,5)}${ranger('rightX','A / B / X / Y ↔','px',-180,160,5)}${ranger('rightY','A / B / X / Y ↕','px',-120,130,5)}${ranger('centerX','Start / Select ↔','px',-160,160,5)}${ranger('centerY','Start / Select ↕','px',-100,120,5)}<p class="hint">Os ajustes são aplicados sem sair do jogo e são lembrados após fechar o aplicativo.</p>`;
 else b.innerHTML=`<h3 class="section-title">The 7th Saga · PT-BR</h3><p>Jogo integrado e emulação offline com Snes9x. A tradução da ROM é a versão autoral 7, ainda parcial.</p><p>Use o menu do emulador (ícone de três linhas) para salvar e carregar estados.</p><p class="warn">Antes de ativar trapaças, faça uma cópia da sua partida. Alguns códigos alteram dados permanentemente.</p><button class="secondary" id="openNative">ABRIR MENU DO EMULADOR</button>`;
 if(tab==='video'){
 const modes=[['disabled','Original'],['crt-easymode.glslp','CRT suave'],['crt-geom.glslp','CRT curvo'],['crt-aperture.glslp','CRT arcade'],['2xScaleHQ.glslp','HQ 2x'],['4xScaleHQ.glslp','HQ 4x'],['scanlines','Scanlines'],['mono','Preto e branco']];
 $('shaderChoices').innerHTML=modes.map(([id,n])=>`<button class="${prefs.shader===id?'active':''}" data-shader="${id}">${n}</button>`).join('');$('scale').value=prefs.scale;
 }
 if(tab==='controls'||tab==='layout'){
 b.querySelectorAll('input[type=range]').forEach(x=>{x.value=prefs[x.id]; const out=$(x.id+'Output');if(out)out.value=prefs[x.id]+(x.dataset.unit||'')});
 if(tab==='controls'){$('layout').value=prefs.layout;$('showLR').checked=prefs.showLR;}
 }
 }else if(current==='cheats'){
 $('tabs').innerHTML='<span class="hint">Códigos para ROM americana · Nenhum é ativado automaticamente</span>';
 $('modal-body').innerHTML=`<div class="cheat-filters"><input id="cheatSearch" placeholder="Buscar trapaça…"/><select id="cheatCategory">${cats.map(x=>`<option>${esc(x)}</option>`).join('')}</select></div><div class="setting"><label>Mostrar códigos completos</label><input type="checkbox" id="showCodes" ${prefs.showCodes?'checked':''}></div><p class="warn">Game Genie (GG) que muda atributos iniciais geralmente requer uma nova partida. PAR atua em memória. Salve antes de usar.</p><div id="cheatRows"></div>`;
 $('cheatCategory').value=cats.includes(tab)?tab:'Todas';populateCheats();
 }else{$('tabs').innerHTML='';$('modal-body').innerHTML='<h3 class="section-title">Créditos</h3><p>Jogo: The 7th Saga (SNES). Emulação offline: Snes9x via EmulatorJS 4.2.3. Interface em português brasileiro.</p><p>Códigos organizados a partir de guias de Game Genie e Pro Action Replay da comunidade. Ative por sua conta e risco.</p><p>Tradução incluída: projeto PT-BR v7 (parcial).</p>'}
 }
 function ranger(id,label,unit,min,max,step){return `<div class="setting"><label for="${id}">${label}</label><input data-unit="${unit}" id="${id}" type="range" min="${min}" max="${max}" step="${step}"><output id="${id}Output"></output></div>`}
 function populateCheats(){let cat=$('cheatCategory').value.toLowerCase(),search=$('cheatSearch').value.toLowerCase().trim();
 $('cheatRows').innerHTML=che.map((c,i)=>({c,i})).filter(({c})=>(cat==='todas'||c.cat.toLowerCase()===cat)&&(!search||(c.name+' '+c.code+' '+c.cat).toLowerCase().includes(search))).map(({c,i})=>`<div class="cheat-row"><input type="checkbox" data-cheat="${i}" ${prefs.active.includes(i)?'checked':''}><div class="cheatmain"><div class="cn">${esc(c.name)}</div><div class="meta">${esc(c.cat)} · ${c.format==='GG'?'Game Genie':'Pro Action Replay'}</div>${prefs.showCodes?`<code>${esc(c.code)}</code>`:''}${c.note?`<div class="meta">${esc(c.note)}</div>`:''}</div></div>`).join('')||'<p class="hint">Nenhum código encontrado.</p>';
 }
 function configureControls(){const e=window.EJS_emulator;if(!e||!e.virtualGamepad)return;
 const root=e.virtualGamepad;root.style.opacity=String(prefs.opacity/100);const ratio=prefs.size/100*(prefs.layout==='compact'?.83:1);
 let left=root.querySelector('.ejs_virtualGamepad_left'),right=root.querySelector('.ejs_virtualGamepad_right'),center=root.querySelector('.ejs_virtualGamepad_bottom');
 if(!center)center=root.querySelector('.ejs_virtualGamepad_middle');
 const group=(node,x,y,origin)=>{if(node){node.style.transform=`translate(${x}px,${y}px) scale(${ratio})`;node.style.transformOrigin=origin;}};
 if(prefs.layout==='lefty'){
 group(left,parseInt(prefs.leftX)+95,parseInt(prefs.leftY),'left bottom');group(right,parseInt(prefs.rightX)-95,parseInt(prefs.rightY),'right bottom');
 }else {group(left,prefs.leftX,prefs.leftY,'left bottom');group(right,prefs.rightX,prefs.rightY,'right bottom')}
 group(center,prefs.centerX,prefs.centerY,'center bottom');
 root.querySelectorAll('.ejs_virtualGamepad_button').forEach(b=>{const tx=(b.textContent||'').trim().toUpperCase();if(tx==='L'||tx==='R')b.style.visibility=prefs.showLR?'':'hidden'});
 }
 function setShader(){const e=startedEm();const effect=$('videoeffect');effect.style.display=prefs.shader==='scanlines'?'block':'none';
 if(e&&e.canvas){e.canvas.style.filter=prefs.shader==='mono'?'grayscale(1) contrast(1.1)':'';e.canvas.style.imageRendering=prefs.scale==='pixel'?'pixelated':'auto'}
 if(e&&typeof e.enableShader==='function')try{e.enableShader(prefs.shader==='mono'||prefs.shader==='scanlines'?'disabled':prefs.shader)}catch(ex){toast('Shader indisponível neste dispositivo.');prefs.shader='disabled';safeSave()}
 }
 function syncCheats(){const e=startedEm();if(!e)return;for(let i=0;i<che.length;i++){
 const c=che[i];let target=e.cheats.find(x=>x.desc===c.name&&x.code===c.code);
 if(!target){e.cheats.push({desc:c.name,code:c.code,checked:false,is_permanent:true});target=e.cheats[e.cheats.length-1];}
 target.checked=prefs.active.includes(i);
 }
 try{e.updateCheatUI();e.saveSettings()}catch(ex){console.warn('Falha ao atualizar lista de cheats',ex)}
 }
 function launch(){if(started)return;if(!window.SAGA_OFFLINE_READY){toast('Arquivos offline indisponíveis.');return}started=true;
 $('play').disabled=true;$('play').textContent='INICIANDO…';window.EJS_player='#game';window.EJS_core='snes';window.EJS_gameName='The 7th Saga PT-BR v7.sfc';
 window.EJS_gameID='the-7th-saga-ptbr-v7';window.EJS_gameUrl=window.SAGA_OFFLINE_ROM;
 window.EJS_pathtodata='file:///android_asset/data/';window.EJS_controlScheme='snes';window.EJS_browserMode='mobile';window.EJS_language='pt-BR';window.EJS_disableAutoLang=true;
 window.EJS_startOnLoaded=true;window.EJS_volume=.7;window.EJS_threads=false;window.EJS_color='#a5483a';window.EJS_backgroundColor='#050609';
 window.EJS_cheats=che.map(c=>[c.name,c.code]);
 window.EJS_onGameStart=()=>{$('home').style.display='none';$('hud').style.display='flex';ready=true;setTimeout(()=>{configureControls();setShader();syncCheats()},450)};
 window.EJS_ready=()=>{$('play').textContent='PREPARANDO JOGO…'};
 const script=document.createElement('script');script.src='file:///android_asset/data/loader.js';script.onerror=()=>{started=false;$('play').disabled=false;$('play').textContent='TENTAR NOVAMENTE';toast('Falha ao carregar o núcleo offline.')};document.head.appendChild(script);
 }
 document.addEventListener('click',e=>{
 let t=e.target;
 if(t.id==='play')launch();
 if(t.id==='homeCheats'||t.id==='hudCheats')open('cheats','Todas');
 if(t.id==='homeSettings'||t.id==='hudSettings')open('settings','video');
 if(t.id==='homeAbout')open('about');
 if(t.id==='modal-close'||t.id==='modal')close();
 if(t.matches('[data-tab]')){tab=t.dataset.tab;render()}
 if(t.matches('[data-shader]')){prefs.shader=t.dataset.shader;safeSave();setShader();render()}
 if(t.id==='resetLayout'){for(const x of ['leftX','leftY','rightX','rightY','centerX','centerY'])prefs[x]=0;safeSave();configureControls();render();toast('Posições restauradas')}
 if(t.id==='editLayout'){if(!ready){toast('Inicie o jogo para arrastar os controles.');return}close();startEditing()}
 if(t.id==='editbar')stopEditing();
 if(t.id==='openNative'){close();if(startedEm())try{startedEm().menu.open()}catch(e){toast('Use o botão do menu do emulador')};}
 });
 document.addEventListener('input',e=>{let t=e.target;if(t.matches('input[type=range]')&&t.id in prefs){prefs[t.id]=Number(t.value);let out=$(t.id+'Output');if(out)out.value=t.value+(t.dataset.unit||'');safeSave();configureControls()}
 if(t.id==='cheatSearch'||t.id==='cheatCategory'){if(t.id==='cheatCategory')tab=t.value;populateCheats()}
 });
 document.addEventListener('change',e=>{const t=e.target;if(t.id==='scale'){prefs.scale=t.value;safeSave();setShader()}
 if(t.id==='layout'){prefs.layout=t.value;safeSave();configureControls()}
 if(t.id==='showLR'){prefs.showLR=t.checked;safeSave();configureControls()}
 if(t.id==='showCodes'){prefs.showCodes=t.checked;safeSave();populateCheats()}
 if(t.matches('[data-cheat]')){let i=Number(t.dataset.cheat);prefs.active=prefs.active.filter(n=>n!==i);if(t.checked)prefs.active.push(i);safeSave();if(ready)syncCheats();else toast('A trapaça será aplicada quando iniciar o jogo.');}
 });
 window.addEventListener('error',e=>{if(started&&!ready){toast('Erro: '+(e.message||'falha no carregamento'));$('play').disabled=false}});
 window.addEventListener('unhandledrejection',e=>{if(started&&!ready)toast('Falha: '+String(e.reason||'erro desconhecido').slice(0,130))});
 function startEditing(){editing=true;document.documentElement.classList.add('layout-edit');$('editbar').style.display='block';configureControls();toast('Arraste direcional, botões ou Start/Select')}
 function stopEditing(){editing=false;drag=null;document.documentElement.classList.remove('layout-edit');$('editbar').style.display='none';safeSave();configureControls();toast('Layout salvo')}
 document.addEventListener('pointerdown',e=>{if(!editing)return;const gamepad=window.EJS_emulator?.virtualGamepad;if(!gamepad)return;
 let group=e.target.closest?.('.ejs_virtualGamepad_left, .ejs_virtualGamepad_right, .ejs_virtualGamepad_bottom');if(!group||!gamepad.contains(group))return;
 let part=group.classList.contains('ejs_virtualGamepad_left')?'left':group.classList.contains('ejs_virtualGamepad_right')?'right':'center';drag={part,x:e.clientX,y:e.clientY,sx:prefs[part+'X'],sy:prefs[part+'Y']};e.preventDefault();e.stopImmediatePropagation();},true);
 document.addEventListener('pointermove',e=>{if(!editing||!drag)return;prefs[drag.part+'X']=Math.max(-190,Math.min(190,drag.sx+e.clientX-drag.x));prefs[drag.part+'Y']=Math.max(-140,Math.min(140,drag.sy+e.clientY-drag.y));configureControls();e.preventDefault();e.stopImmediatePropagation()},true);
 document.addEventListener('pointerup',e=>{if(!editing||!drag)return;drag=null;safeSave();e.preventDefault();e.stopImmediatePropagation()},true);
 window.addEventListener('pagehide',safeSave);
 window.SAGA_APP={launch,configureControls,setShader,syncCheats,open};
})();
