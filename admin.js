/* =========================================================
ACESSO ADMINISTRADOR
========================================================= */

const CHAVE_SECRETA_ADM="NANDOADM";

const SENHA_ADMIN="NANDO2026";

const VIDEO_TESTE=
"https://github.com/nandosarcondicionado-gif/Music-Nando-/raw/refs/heads/main/midia/videos/20260807_092150486.mp4_play_BR.mp4";

let bgVideos=[];
let adminLogado=false;

/* =========================================================
MENSAGENS
========================================================= */

function mostrarMensagem(id,text,tipo){

const el=document.getElementById(id);

if(!el)return;

el.innerText=text;

if(!text){

el.className="message";

return;

}

el.className="message "+(tipo||"");

}

/* =========================================================
ADMIN MENU
========================================================= */

function ativarMenuAdmin(){

document.getElementById(
"menuButton"
).classList.add("visible");

}

function desativarMenuAdmin(){

document.getElementById(
"menuButton"
).classList.remove("visible");

}

function abrirMenu(){

if(!adminLogado)return;

document.getElementById(
"sideMenu"
).classList.add("active");

}

function fecharMenu(){

document.getElementById(
"sideMenu"
).classList.remove("active");

}

function fecharMenuFora(event){

if(event.target.id==="sideMenu"){

fecharMenu();

}

}

/* =========================================================
ABRIR PAINEL
========================================================= */

function abrirAdminPainel(){

if(!adminLogado)return;

fecharMenu();

document.getElementById(
"adminModal"
).classList.add("active");

carregarCodigosAdmin();
carregarListaAdmin();
renderizarAdminPlayer();
renderizarFundosAdmin();
iniciarVideoAdmin();

}

/* =========================================================
FECHAR PAINEL
========================================================= */

function fecharAdminPainel(){

document.getElementById(
"adminModal"
).classList.remove("active");

}

/* =========================================================
LOGIN ADMIN
========================================================= */

async function entrarAdmin(){

const senha=
document.getElementById(
"adminPassword"
).value;

if(!senha){

mostrarMensagem(
"adminLoginMessage",
"Digite a senha do administrador.",
"error"
);

return;

}

mostrarMensagem(
"adminLoginMessage",
"Verificando senha...",
"success"
);

if(senha!==SENHA_ADMIN){

mostrarMensagem(
"adminLoginMessage",
"Senha administrativa incorreta.",
"error"
);

document.getElementById(
"adminPassword"
).value="";

document.getElementById(
"adminPassword"
).focus();

return;

}

adminLogado=true;

document.getElementById(
"adminPassword"
).value="";

document.getElementById(
"adminLoginModal"
).classList.remove("active");

mostrarMensagem(
"adminLoginMessage",
"",
""
);

ativarMenuAdmin();

mostrarApp();

if(typeof mostrarBotaoInstalar==="function"){
mostrarBotaoInstalar();
}

if(typeof iniciarVideoCliente==="function"){
iniciarVideoCliente();
}

}

/* =========================================================
FECHAR LOGIN ADMIN
========================================================= */

function fecharLoginAdmin(){

document.getElementById(
"adminLoginModal"
).classList.remove("active");

document.getElementById(
"adminPassword"
).value="";

mostrarMensagem(
"adminLoginMessage",
"",
""
);

if(adminLogado){

mostrarApp();

return;

}

const codigo=
localStorage.getItem(
"nando_codigo"
);

if(codigo){

verificarAcessoInicial();

}else{

document.getElementById(
"authModal"
).classList.add("active");

}

}

/* =========================================================
SAIR ADMIN
========================================================= */

function sairAdministrador(){

adminLogado=false;

desativarMenuAdmin();

fecharMenu();

fecharAdminPainel();

document.getElementById(
"adminLoginModal"
).classList.remove("active");

const codigo=
localStorage.getItem(
"nando_codigo"
);

if(codigo){

verificarAcessoInicial();

}else{

bloquearAplicativo(
"Digite o código de acesso fornecido pelo administrador."
);

}

}

/* =========================================================
ABAS ADMIN
========================================================= */

document.querySelectorAll(
"[data-admin-tab]"
).forEach(button=>{

button.addEventListener(
"click",
()=>{

const nome=
button.dataset.adminTab;

document.querySelectorAll(
".admin-section"
).forEach(el=>{
el.classList.remove("active");
});

const aba=
document.getElementById(
"aba-"+nome
);

if(aba){
aba.classList.add("active");
}

document.querySelectorAll(
"[data-admin-tab]"
).forEach(el=>{
el.classList.remove("active");
});

button.classList.add("active");

if(nome==="codigos"){
carregarCodigosAdmin();
}

if(nome==="player"){
renderizarAdminPlayer();
iniciarVideoAdmin();
}

if(nome==="fundos"){
renderizarFundosAdmin();
}

});

});

/* =========================================================
GERAR CÓDIGO
========================================================= */

async function gerarCodigoCliente(){

if(!adminLogado){

alert(
"Faça login como administrador."
);

return;

}

const chars=
"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

let codigo="ND-";

for(let i=0;i<6;i++){

codigo+=chars.charAt(
Math.floor(
Math.random()*chars.length
)
);

}

try{

const existe=
await db.ref(
"codigos_gerados/"+codigo
).once("value");

if(existe.exists()){

return gerarCodigoCliente();

}

await db.ref(
"codigos_gerados/"+codigo
).set({

usado:false,
deviceId:null,
criadoEm:Date.now()

});

document.getElementById(
"generatedCode"
).innerText=codigo;

document.getElementById(
"generatedCodeBox"
).style.display="block";

document.getElementById(
"copyMessage"
).innerText=
"✓ Código salvo com sucesso.";

carregarCodigosAdmin();

}catch(error){

console.error(error);

alert(
"Erro ao gerar código:\n"+
(error.message||error)
);

}

}

/* =========================================================
COPIAR
========================================================= */

async function copiarCodigo(){

const codigo=
document.getElementById(
"generatedCode"
).innerText;

if(!codigo)return;

try{

await navigator.clipboard.writeText(
codigo
);

document.getElementById(
"copyMessage"
).innerText=
"✓ Código copiado!";

}catch(error){

prompt(
"Copie o código:",
codigo
);

}

}

async function copiarDireto(codigo){

try{

await navigator.clipboard.writeText(
codigo
);

alert(
"Código "+codigo+" copiado!"
);

}catch(error){

prompt(
"Copie o código:",
codigo
);

}

}

/* =========================================================
CÓDIGOS ADMIN
========================================================= */

async function carregarCodigosAdmin(){

const container=
document.getElementById(
"codesAdminList"
);

if(!container)return;

if(!adminLogado){

container.innerHTML=
'<div class="empty">Administrador não conectado.</div>';

return;

}

try{

const snap=
await db.ref(
"codigos_gerados"
).once("value");

const dados=
snap.val()||{};

const ids=
Object.keys(dados).reverse();

if(!ids.length){

container.innerHTML=
'<div class="empty">Nenhum código cadastrado.</div>';

return;

}

let html="";

ids.forEach(id=>{

const item=dados[id]||{};

const usado=
item.usado===true;

html+=`

<div class="admin-row">

<div>

<strong>${escapar(id)}</strong><br>

<span class="status ${usado?"used":"available"}">

${usado?"USADO":"DISPONÍVEL"}

</span>

${
usado&&item.deviceId
?
`
<div class="small">
Aparelho: ${escapar(item.deviceId)}
</div>
`
:""
}

</div>

<div style="
display:flex;
gap:5px;">

<button
style="background:#334155"
data-copy-code="${escapar(id)}">

<i class="fa-solid fa-copy"></i>

</button>

<button
style="background:#ef4444"
data-delete-code="${escapar(id)}">

<i class="fa-solid fa-trash"></i>

</button>

</div>

</div>

`;

});

container.innerHTML=html;

container
.querySelectorAll("[data-copy-code]")
.forEach(btn=>{

btn.onclick=()=>{
copiarDireto(
btn.dataset.copyCode
);
};

});

container
.querySelectorAll("[data-delete-code]")
.forEach(btn=>{

btn.onclick=()=>{
excluirCodigo(
btn.dataset.deleteCode
);
};

});

}catch(error){

console.error(error);

container.innerHTML=
'<div class="empty">Erro ao carregar códigos.</div>';

}

}

/* =========================================================
EXCLUIR CÓDIGO
========================================================= */

async function excluirCodigo(codigo){

if(!adminLogado)return;

if(!confirm(
"Excluir o código "+codigo+"?\n\n"+
"Se ele estiver sendo usado, o aparelho perderá o acesso imediatamente."
)){

return;

}

try{

await db.ref(
"dispositivos_autorizados/"+codigo
).remove();

await db.ref(
"codigos_gerados/"+codigo
).remove();

carregarCodigosAdmin();

}catch(error){

console.error(error);

alert(
"Erro ao excluir:\n"+
(error.message||error)
);

}

}

/* =========================================================
SALVAR MÚSICA
========================================================= */

async function salvarMusica(){

if(!adminLogado){

alert(
"Faça login como administrador."
);

return;

}

const title=
document.getElementById(
"songTitle"
).value.trim();

const url=
document.getElementById(
"songUrl"
).value.trim();

const lyrics=
document.getElementById(
"songLyrics"
).value.trim();

const category=
document.getElementById(
"songCategory"
).value;

if(!title||!url){

alert(
"Preencha o título e o link."
);

return;

}

try{

await db.ref("musicas").push({

title:title,
url:url,
lyrics:lyrics,
category:category,
criadoEm:Date.now()

});

document.getElementById(
"songTitle"
).value="";

document.getElementById(
"songUrl"
).value="";

document.getElementById(
"songLyrics"
).value="";

alert(
"Música adicionada com sucesso!"
);

}catch(error){

console.error(error);

alert(
"Erro:\n"+(error.message||error)
);

}

}

/* =========================================================
EXCLUIR MÚSICA
========================================================= */

async function excluirMusica(id){

if(!adminLogado)return;

if(!confirm(
"Excluir esta música?"
))return;

try{

await db.ref(
"musicas/"+id
).remove();

}catch(error){

console.error(error);

alert(
"Erro:\n"+(error.message||error)
);

}

}

/* =========================================================
SALVAR FUNDO
========================================================= */

async function salvarFundo(){

if(!adminLogado){

alert(
"Faça login como administrador."
);

return;

}

const url=
document.getElementById(
"backgroundUrl"
).value.trim();

if(!url){

alert(
"Digite o link do vídeo."
);

return;

}

try{

await db.ref("background_videos").push({

url:url,
criadoEm:Date.now()

});

document.getElementById(
"backgroundUrl"
).value="";

alert(
"Vídeo adicionado com sucesso!"
);

}catch(error){

console.error(error);

alert(
"Erro:\n"+(error.message||error)
);

}

}

/* =========================================================
EXCLUIR FUNDO
========================================================= */

async function excluirFundo(id){

if(!adminLogado)return;

if(!confirm(
"Excluir este vídeo?"
))return;

try{

await db.ref(
"background_videos/"+id
).remove();

}catch(error){

console.error(error);

alert(
"Erro:\n"+(error.message||error)
);

}

}

/* =========================================================
CARREGAR FUNDOS
========================================================= */

db.ref("background_videos").on(
"value",
snapshot=>{

bgVideos=[];

const dados=
snapshot.val()||{};

Object.keys(dados).forEach(id=>{

const item=
dados[id]||{};

if(item.url){

bgVideos.push({

id:id,
url:item.url

});

}

});

renderizarFundosAdmin();

});

/* =========================================================
PLAYER ADMIN
========================================================= */

function renderizarAdminPlayer(){

const container=
document.getElementById(
"adminPlayerList"
);

if(!container)return;

let html="";

allSongs.forEach(song=>{

html+=`

<div class="admin-row">

<span>
${escapar(song.title)}
</span>

<button
style="background:#7467ff"
data-admin-song="${escapar(song.id)}">

<i class="fa-solid fa-play"></i>

</button>

</div>

`;

});

container.innerHTML=
html||
'<div class="empty">Nenhuma música cadastrada.</div>';

container
.querySelectorAll("[data-admin-song]")
.forEach(btn=>{

btn.onclick=()=>{

const song=
allSongs.find(
item=>item.id===
btn.dataset.adminSong
);

if(song){

tocarAdmin(song);

}

};

});

}

function tocarAdmin(song){

if(!adminLogado||!song)return;

const player=
document.getElementById(
"adminMusicPlayer"
);

player.src=song.url;

document.getElementById(
"adminNowPlaying"
).innerText=
song.title||"Música";

player.play()
.catch(console.warn);

}

function pararPlayer(){

const player=
document.getElementById(
"adminMusicPlayer"
);

player.pause();

player.removeAttribute("src");

player.load();

document.getElementById(
"adminNowPlaying"
).innerText=
"Nenhuma música reproduzindo";

}

/* =========================================================
LISTA ADMIN
========================================================= */

function carregarListaAdmin(){

const container=
document.getElementById(
"musicAdminList"
);

if(!container)return;

let html="";

allSongs.forEach(song=>{

html+=`

<div class="admin-row">

<div>

<strong>
${escapar(song.title)}
</strong>

<div class="small">
${escapar(song.category||"")}
</div>

</div>

<button
style="background:#ef4444"
data-delete-song="${escapar(song.id)}">

<i class="fa-solid fa-trash"></i>

</button>

</div>

`;

});

container.innerHTML=
html||
'<div class="empty">Nenhuma música.</div>';

container
.querySelectorAll("[data-delete-song]")
.forEach(btn=>{

btn.onclick=()=>{
excluirMusica(
btn.dataset.deleteSong
);
};

});

}

/* =========================================================
FUNDOS ADMIN
========================================================= */

function renderizarFundosAdmin(){

const container=
document.getElementById(
"backgroundAdminList"
);

if(!container)return;

let html="";

bgVideos.forEach(video=>{

html+=`

<div class="admin-row">

<span>
Vídeo ${escapar(
video.id.substring(0,6)
)}
</span>

<button
style="background:#ef4444"
data-delete-bg="${escapar(video.id)}">

<i class="fa-solid fa-trash"></i>

</button>

</div>

`;

});

container.innerHTML=
html||
'<div class="empty">Nenhum vídeo cadastrado.</div>';

container
.querySelectorAll("[data-delete-bg]")
.forEach(btn=>{

btn.onclick=()=>{
excluirFundo(
btn.dataset.deleteBg
);
};

});

}

/* =========================================================
VIDEO ADMIN
========================================================= */

function iniciarVideoAdmin(){

const player=
document.getElementById(
"adminBackgroundPlayer"
);

if(!player)return;

let url=VIDEO_TESTE;

if(bgVideos.length){

const escolhido=
bgVideos[
Math.floor(
Math.random()*bgVideos.length
)];

if(
escolhido&&
escolhido.url
){

url=escolhido.url;

}

}

player.src=url;
player.muted=true;
player.loop=true;

player.play()
.catch(console.warn);

}
