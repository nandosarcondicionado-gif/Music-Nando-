/* =========================================================
   NANDO'S MUSIC
   PLAYER + VÍDEO DE FUNDO
========================================================= */


/* =========================================================
   VARIÁVEIS DO PLAYER
========================================================= */

let allSongs=[];
let currentSongIndex=-1;
let currentCategory="Todas";
let shuffleMode=false;


/* =========================================================
   VARIÁVEIS DO VÍDEO DE FUNDO
========================================================= */

let allBackgroundVideos=[];
let currentBackgroundIndex=-1;
let backgroundVideosLoaded=false;


/* =========================================================
   ELEMENTOS
========================================================= */

const musicPlayer=
document.getElementById("musicPlayer");

const miniPlayer=
document.getElementById("miniPlayer");

const fullPlayer=
document.getElementById("fullPlayer");

const lyricsModal=
document.getElementById("lyricsModal");

const backgroundVideo=
document.getElementById(
"musicBackgroundVideo"
);

const backgroundOverlay=
document.getElementById(
"musicBackgroundOverlay"
);


/* =========================================================
   CARREGAR MÚSICAS
========================================================= */

db.ref("musicas").on(
"value",
snapshot=>{

allSongs=[];

const dados=
snapshot.val()||{};

Object.keys(dados).forEach(id=>{

const musica=
dados[id]||{};

allSongs.push({
id:id,
...musica
});

});

renderizarMusicas(
filtrarListaAtual()
);

if(typeof renderizarAdminPlayer==="function"){

renderizarAdminPlayer();

}

if(typeof carregarListaAdmin==="function"){

carregarListaAdmin();

}

});


/* =========================================================
   CARREGAR VÍDEOS DE FUNDO
========================================================= */

function carregarVideosDeFundo(){

if(!backgroundVideo){

console.warn(
"Nando's Music: elemento de vídeo de fundo não encontrado."
);

return;

}

db.ref("fundos").on(
"value",
snapshot=>{

allBackgroundVideos=[];

const dados=
snapshot.val()||{};

Object.keys(dados).forEach(id=>{

const fundo=
dados[id]||{};

/*
   Aceita a estrutura normal:
   { url: "https://..." }

   Também aceita:
   { videoUrl: "https://..." }
*/

const url=
fundo.url||
fundo.videoUrl||
fundo.src||
"";

if(!url)return;

allBackgroundVideos.push({
id:id,
url:url,
...fundo
});

});

backgroundVideosLoaded=true;

console.log(
"Nando's Music: vídeos de fundo carregados:",
allBackgroundVideos.length
);

/*
   Se já houver música tocando,
   garante que o vídeo seja iniciado.
*/

if(
!musicPlayer.paused &&
musicPlayer.src
){

iniciarVideoDeFundo();

}

},
error=>{

console.error(
"Erro ao carregar vídeos de fundo:",
error
);

backgroundVideosLoaded=false;

}
);

}


/* =========================================================
   ESCOLHER VÍDEO ALEATÓRIO
========================================================= */

function escolherVideoAleatorio(){

if(!allBackgroundVideos.length){

return null;

}

let index=
Math.floor(
Math.random()*
allBackgroundVideos.length
);

/*
   Evita repetir o mesmo vídeo quando
   existem dois ou mais vídeos.
*/

if(allBackgroundVideos.length>1){

let tentativas=0;

while(
index===currentBackgroundIndex &&
tentativas<20
){

index=
Math.floor(
Math.random()*
allBackgroundVideos.length
);

tentativas++;

}

}

currentBackgroundIndex=index;

return allBackgroundVideos[index];

}


/* =========================================================
   INICIAR VÍDEO DE FUNDO
========================================================= */

function iniciarVideoDeFundo(){

if(!backgroundVideo){

return;

}

if(!allBackgroundVideos.length){

backgroundVideo.classList.remove(
"playing"
);

if(backgroundOverlay){

backgroundOverlay.classList.remove(
"active"
);

}

return;

}

const video=
escolherVideoAleatorio();

if(!video||!video.url){

return;

}

/*
   Mostra o vídeo.
*/

backgroundVideo.classList.add(
"playing"
);

if(backgroundOverlay){

backgroundOverlay.classList.add(
"active"
);

}

/*
   Evita manter o vídeo anterior.
*/

try{

backgroundVideo.pause();

}catch(error){

console.warn(error);

}

backgroundVideo.src=
video.url;

backgroundVideo.load();

/*
   O vídeo precisa ser MUTED para
   autoplay funcionar nos celulares.
*/

backgroundVideo.muted=true;

const promessa=
backgroundVideo.play();

if(promessa&&typeof promessa.catch==="function"){

promessa.catch(error=>{

console.warn(
"Nando's Music: reprodução automática do vídeo aguardando interação.",
error
);

});

}

}


/* =========================================================
   TROCAR VÍDEO
========================================================= */

function trocarVideoDeFundo(){

if(!backgroundVideo){

return;

}

if(!allBackgroundVideos.length){

return;

}

const video=
escolherVideoAleatorio();

if(!video||!video.url){

return;

}

try{

backgroundVideo.pause();

}catch(error){

console.warn(error);

}

backgroundVideo.src=
video.url;

backgroundVideo.load();

backgroundVideo.muted=true;

backgroundVideo.classList.add(
"playing"
);

if(backgroundOverlay){

backgroundOverlay.classList.add(
"active"
);

}

const promessa=
backgroundVideo.play();

if(promessa&&typeof promessa.catch==="function"){

promessa.catch(error=>{

console.warn(
"Nando's Music: não foi possível iniciar o próximo vídeo.",
error
);

});

}

}


/* =========================================================
   PARAR VÍDEO DE FUNDO
========================================================= */

function pararVideoDeFundo(){

if(!backgroundVideo){

return;

}

try{

backgroundVideo.pause();

}catch(error){

console.warn(error);

}

backgroundVideo.classList.remove(
"playing"
);

if(backgroundOverlay){

backgroundOverlay.classList.remove(
"active"
);

}

}


/* =========================================================
   EVENTO: VÍDEO TERMINOU
========================================================= */

if(backgroundVideo){

backgroundVideo.addEventListener(
"ended",
()=>{

/*
   Se ainda existe música tocando,
   escolhe outro vídeo.
*/

if(
!musicPlayer.paused &&
!musicPlayer.ended
){

trocarVideoDeFundo();

}

});

}


/* =========================================================
   EVENTO: VÍDEO COM ERRO
========================================================= */

if(backgroundVideo){

backgroundVideo.addEventListener(
"error",
()=>{

console.warn(
"Nando's Music: erro ao reproduzir vídeo de fundo."
);

/*
   Tenta outro vídeo automaticamente.
*/

if(
!musicPlayer.paused &&
allBackgroundVideos.length>1
){

trocarVideoDeFundo();

}

});

}


/* =========================================================
   INICIALIZAR VÍDEOS
========================================================= */

carregarVideosDeFundo();


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escapar(texto){

if(
texto===undefined||
texto===null
){

return "";

}

return String(texto)
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");

}


/* =========================================================
   LISTA ATUAL
========================================================= */

function filtrarListaAtual(){

let lista=
allSongs.slice();

if(currentCategory!=="Todas"){

lista=
lista.filter(
song=>
song.category===currentCategory
);

}

const busca=
document.getElementById(
"searchInput"
).value
.trim()
.toLowerCase();

if(busca){

lista=
lista.filter(song=>

String(song.title||"")
.toLowerCase()
.includes(busca)

);

}

return lista;

}


/* =========================================================
   RENDER MÚSICAS
========================================================= */

function renderizarMusicas(lista){

const container=
document.getElementById(
"playlistContainer"
);

const counter=
document.getElementById(
"musicCounter"
);

if(counter){

counter.innerText=
lista.length+
(lista.length===1?
" música":
" músicas");

}

if(!lista.length){

container.innerHTML=
'<div class="empty">Nenhuma música encontrada.</div>';

return;

}

container.innerHTML="";

lista.forEach(song=>{

const item=
document.createElement("div");

item.className="song-item";

item.innerHTML=`

<div class="song-cover">
<i class="fa-solid fa-music"></i>
</div>

<div class="song-info">

<div class="song-title">
${escapar(song.title)}
</div>

<div class="song-category">
${escapar(song.category||"Música")}
</div>

</div>

<div class="song-actions">

<a
href="${escapar(song.url)}"
target="_blank"
rel="noopener noreferrer"
class="icon"
title="Abrir arquivo">

<i class="fa-solid fa-download"></i>

</a>

<button
class="icon play-song"
type="button">

<i class="fa-solid fa-play"></i>

</button>

</div>

`;

item
.querySelector(".song-info")
.onclick=()=>{
tocar(song);
};

item
.querySelector(".play-song")
.onclick=()=>{
tocar(song);
};

container.appendChild(item);

});

}


/* =========================================================
   TOCAR MÚSICA
========================================================= */

function tocar(song){

if(!song||!song.url)return;

const index=
allSongs.findIndex(
item=>item.id===song.id
);

currentSongIndex=index;

musicPlayer.src=song.url;

musicPlayer.dataset.songId=
song.id;

document.getElementById(
"miniTitle"
).innerText=
song.title||"Música";

document.getElementById(
"miniCategory"
).innerText=
song.category||"Nando's Music";

document.getElementById(
"fullTitle"
).innerText=
song.title||"Música";

document.getElementById(
"fullCategory"
).innerText=
song.category||"Nando's Music";

document.getElementById(
"lyricsSongTitle"
).innerText=
song.title||"Música";

document.getElementById(
"lyricsHeaderTitle"
).innerText=
song.title||"Nando's Music";

document.getElementById(
"lyricsText"
).innerText=
song.lyrics||
"A letra desta música ainda não foi cadastrada.";

miniPlayer.classList.add("visible");


/*
   Limpa o vídeo anterior.
   O novo vídeo será escolhido quando
   a música realmente começar.
*/

if(backgroundVideo){

try{

backgroundVideo.pause();

}catch(error){

console.warn(error);

}

}


/*
   Inicia música.
*/

musicPlayer.play()
.then(()=>{

atualizarBotoesPlayer();

iniciarVideoDeFundo();

})
.catch(error=>{

console.warn(
"Reprodução aguardando interação:",
error
);

atualizarBotoesPlayer();

});

}


/* =========================================================
   PLAYER
========================================================= */

function togglePlay(){

if(!musicPlayer.src){

if(allSongs.length){

tocar(allSongs[0]);

}

return;

}

if(musicPlayer.paused){

musicPlayer.play()
.then(()=>{

iniciarVideoDeFundo();

})
.catch(console.warn);

}else{

musicPlayer.pause();

}

atualizarBotoesPlayer();

}


/* =========================================================
   ATUALIZAR BOTÕES
========================================================= */

function atualizarBotoesPlayer(){

const tocando=
!musicPlayer.paused&&
!musicPlayer.ended;

const miniIcon=
document.querySelector(
"#miniPlay i"
);

const fullIcon=
document.querySelector(
"#fullPlay i"
);

if(miniIcon){

miniIcon.className=
tocando
?
"fa-solid fa-pause"
:
"fa-solid fa-play";

}

if(fullIcon){

fullIcon.className=
tocando
?
"fa-solid fa-pause"
:
"fa-solid fa-play";

}

}


/* =========================================================
   EVENTO AUDIO - PLAY
========================================================= */

musicPlayer.addEventListener(
"play",
()=>{

miniPlayer.classList.add("visible");

atualizarBotoesPlayer();

iniciarVideoDeFundo();

});


/* =========================================================
   EVENTO AUDIO - PAUSE
========================================================= */

musicPlayer.addEventListener(
"pause",
()=>{

atualizarBotoesPlayer();

pararVideoDeFundo();

});


/* =========================================================
   EVENTO AUDIO - TIMEUPDATE
========================================================= */

musicPlayer.addEventListener(
"timeupdate",
()=>{

if(!musicPlayer.duration)return;

const percent=
(musicPlayer.currentTime/
musicPlayer.duration)*100;

document.getElementById(
"progressFill"
).style.width=
percent+"%";

document.getElementById(
"miniProgressFill"
).style.width=
percent+"%";

document.getElementById(
"currentTime"
).innerText=
formatarTempo(
musicPlayer.currentTime
);

document.getElementById(
"duration"
).innerText=
formatarTempo(
musicPlayer.duration
);

});


/* =========================================================
   EVENTO AUDIO - ENDED
========================================================= */

musicPlayer.addEventListener(
"ended",
()=>{

/*
   A música terminou.
   O próximo comando tocará a próxima música
   e automaticamente escolherá um novo vídeo.
*/

pararVideoDeFundo();

if(shuffleMode){

tocarAleatoria();

return;

}

avancar();

});


/* =========================================================
   TEMPO
========================================================= */

function formatarTempo(segundos){

if(!isFinite(segundos))return "0:00";

const minutos=
Math.floor(segundos/60);

const segundosRestantes=
Math.floor(segundos%60)
.toString()
.padStart(2,"0");

return minutos+":"+segundosRestantes;

}


/* =========================================================
   BARRA DE PROGRESSO
========================================================= */

document.getElementById(
"progressBar"
).addEventListener(
"click",
event=>{

if(!musicPlayer.duration)return;

const rect=
event.currentTarget.getBoundingClientRect();

const pos=
(event.clientX-rect.left)/
rect.width;

musicPlayer.currentTime=
pos*musicPlayer.duration;

});


/* =========================================================
   CONTROLES
========================================================= */

function retroceder(){

if(!musicPlayer.duration)return;

musicPlayer.currentTime=
Math.max(
0,
musicPlayer.currentTime-10
);

}


function avancar(){

if(!allSongs.length)return;

if(currentSongIndex<0){

tocar(allSongs[0]);

return;

}

let index=
currentSongIndex+1;

if(index>=allSongs.length){

index=0;

}

tocar(allSongs[index]);

}


function voltarMusica(){

if(!allSongs.length)return;

if(musicPlayer.currentTime>5){

musicPlayer.currentTime=0;

return;

}

let index=
currentSongIndex-1;

if(index<0){

index=allSongs.length-1;

}

tocar(allSongs[index]);

}


function ativarAleatorio(){

shuffleMode=!shuffleMode;

const icon=
document.querySelector(
"#shuffleButton i"
);

if(icon){

icon.style.color=
shuffleMode
?
"#a89cff"
:
"white";

}

}


function tocarAleatoria(){

if(!allSongs.length)return;

let index=
Math.floor(
Math.random()*allSongs.length
);

if(allSongs.length>1){

while(index===currentSongIndex){

index=
Math.floor(
Math.random()*allSongs.length
);

}

}

tocar(allSongs[index]);

}


/* =========================================================
   PLAYER COMPLETO
========================================================= */

function abrirPlayerCompleto(){

if(!musicPlayer.src){

if(allSongs.length){

tocar(allSongs[0]);

}

return;

}

fullPlayer.classList.add("active");

document.body.classList.add("no-scroll");

}


function fecharPlayerCompleto(){

fullPlayer.classList.remove("active");

document.body.classList.remove("no-scroll");

}


/* =========================================================
   LETRAS
========================================================= */

function abrirLetras(){

if(!musicPlayer.src){

return;

}

lyricsModal.classList.add("active");

document.body.classList.add("no-scroll");

}


function fecharLetras(){

lyricsModal.classList.remove("active");

document.body.classList.remove("no-scroll");

}


/* =========================================================
   BUSCA
========================================================= */

const searchInput=
document.getElementById(
"searchInput"
);

searchInput.addEventListener(
"input",
()=>{

const valor=
searchInput.value.trim();

const clear=
document.getElementById(
"clearSearch"
);

clear.style.display=
valor
?
"block"
:
"none";

const lista=
filtrarListaAtual();

renderizarMusicas(lista);

if(valor){

mostrarResultados(lista);

}else{

document.getElementById(
"searchResults"
).classList.remove("active");

}

});


function mostrarResultados(lista){

const box=
document.getElementById(
"searchResults"
);

const container=
document.getElementById(
"searchResultList"
);

box.classList.add("active");

if(!lista.length){

container.innerHTML=
'<div class="search-empty">Nenhuma música encontrada.</div>';

return;

}

container.innerHTML="";

lista.slice(0,5).forEach(song=>{

const div=
document.createElement("div");

div.className="song-item";

div.innerHTML=`

<div class="song-cover">
<i class="fa-solid fa-music"></i>
</div>

<div class="song-info">

<div class="song-title">
${escapar(song.title)}
</div>

<div class="song-category">
${escapar(song.category||"Música")}
</div>

</div>

<button class="icon">
<i class="fa-solid fa-play"></i>
</button>

`;

div.onclick=()=>{
tocar(song);
};

container.appendChild(div);

});

}


function limparBusca(){

searchInput.value="";

document.getElementById(
"clearSearch"
).style.display="none";

document.getElementById(
"searchResults"
).classList.remove("active");

renderizarMusicas(
filtrarListaAtual()
);

}


/* =========================================================
   FILTROS
========================================================= */

document.querySelectorAll(
".filter-bar .filter-btn"
).forEach(btn=>{

btn.addEventListener(
"click",
()=>{

document.querySelectorAll(
".filter-bar .filter-btn"
).forEach(el=>{
el.classList.remove("active");
});

btn.classList.add("active");

currentCategory=
btn.dataset.category;

renderizarMusicas(
filtrarListaAtual()
);

});

});


/* =========================================================
   NAVEGAÇÃO
========================================================= */

function definirNav(index){

document.querySelectorAll(
".nav-btn"
).forEach(
(btn,i)=>{
btn.classList.toggle(
"active",
i===index
);
});

}


function irInicio(){

definirNav(0);

window.scrollTo({
top:0,
behavior:"smooth"
});

}


function abrirBusca(){

definirNav(1);

searchInput.focus();

window.scrollTo({
top:120,
behavior:"smooth"
});

}


function irMusicas(){

definirNav(2);

const titulo=
document.querySelector(
".section-title"
);

if(titulo){

titulo.scrollIntoView({
behavior:"smooth",
block:"start"
});

}

}
