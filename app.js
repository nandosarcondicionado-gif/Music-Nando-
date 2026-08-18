/* =========================================================
ACESSO
========================================================= */

const CHAVE_ADM="NANDOADM";

let currentCode=null;
let authorizationListenersStarted=false;
let deferredPrompt=null;

/* =========================================================
DEVICE ID
========================================================= */

let deviceId=
localStorage.getItem("nando_device_id");

if(!deviceId){

deviceId=
"DEV-"+
Math.random()
.toString(36)
.substring(2,10)
.toUpperCase();

localStorage.setItem(
"nando_device_id",
deviceId
);

}

/* =========================================================
ELEMENTOS
========================================================= */

const authModal=
document.getElementById("authModal");

const appContent=
document.getElementById("appContent");

/* =========================================================
MOSTRAR APP
========================================================= */

function mostrarApp(){

authModal.classList.remove("active");

appContent.classList.remove("hidden");

}

/* =========================================================
BLOQUEAR CLIENTE
========================================================= */

function bloquearAplicativo(mensagem){

currentCode=null;

localStorage.removeItem("nando_autorizado");
localStorage.removeItem("nando_codigo");

try{

if(authorizationListenersStarted){

authorizationListenersStarted=false;

}

}catch(e){

console.warn(e);

}

const musicPlayer=
document.getElementById("musicPlayer");

const miniPlayer=
document.getElementById("miniPlayer");

if(musicPlayer){

musicPlayer.pause();

musicPlayer.removeAttribute("src");

musicPlayer.load();

}

if(miniPlayer){

miniPlayer.classList.remove("visible");

}

appContent.classList.add("hidden");

if(!adminLogado){

document.getElementById(
"menuButton"
).classList.remove("visible");

}

authModal.classList.add("active");

mostrarMensagem(
"authMessage",
mensagem||
"Seu acesso foi bloqueado.",
"error"
);

}

/* =========================================================
PROCESSAR ACESSO
========================================================= */

async function processarAcesso(){

const input=
document.getElementById(
"userAccessCode"
);

const valor=
input.value
.trim()
.toUpperCase();

if(!valor){

mostrarMensagem(
"authMessage",
"Digite o código de acesso.",
"error"
);

return;

}

/*
NANDOADM abre a tela administrativa.
Não utiliza Firebase Authentication.
*/

if(valor===CHAVE_ADM){

input.value="";

authModal.classList.remove("active");

document.getElementById(
"adminLoginModal"
).classList.add("active");

mostrarMensagem(
"adminLoginMessage",
"",
""
);

document.getElementById(
"adminPassword"
).value="";

setTimeout(()=>{

document.getElementById(
"adminPassword"
).focus();

},150);

return;

}

await validarCodigoUsuario(valor);

}

/* =========================================================
VALIDAR CÓDIGO CLIENTE
========================================================= */

async function validarCodigoUsuario(codigo){

if(!/^ND-[A-Z0-9]{6}$/.test(codigo)){

mostrarMensagem(
"authMessage",
"Digite um código válido no formato ND-XXXXXX.",
"error"
);

return;

}

mostrarMensagem(
"authMessage",
"Verificando código...",
"success"
);

try{

const ref=
db.ref(
"codigos_gerados/"+codigo
);

const snap=
await ref.once("value");

const dados=snap.val();

if(!dados){

throw new Error(
"Este código não existe ou foi removido."
);

}

if(
dados.usado===true &&
dados.deviceId &&
dados.deviceId!==deviceId
){

throw new Error(
"Este código já está vinculado a outro aparelho."
);

}

await ref.update({

usado:true,
deviceId:deviceId,
ultimoAcesso:Date.now()

});

await db.ref(
"dispositivos_autorizados/"+codigo
).set({

codigo:codigo,
deviceId:deviceId,
data:Date.now()

});

currentCode=codigo;

localStorage.setItem(
"nando_autorizado",
"true"
);

localStorage.setItem(
"nando_codigo",
codigo
);

document.getElementById(
"userAccessCode"
).value="";

mostrarMensagem(
"authMessage",
"",
""
);

mostrarApp();

mostrarBotaoInstalar();

iniciarMonitoramentoAutorizacao(codigo);

iniciarVideoCliente();

}catch(error){

console.error(
"Erro ao validar cliente:",
error
);

let mensagem=
"Não foi possível validar o código.";

if(error&&error.message){

mensagem=error.message;

}

mostrarMensagem(
"authMessage",
mensagem,
"error"
);

}

}

/* =========================================================
MONITORAMENTO
========================================================= */

function iniciarMonitoramentoAutorizacao(codigo){

if(!codigo)return;

currentCode=codigo;

authorizationListenersStarted=true;

const autorizacaoRef=
db.ref(
"dispositivos_autorizados/"+codigo
);

const codigoRef=
db.ref(
"codigos_gerados/"+codigo
);

autorizacaoRef.off();

codigoRef.off();

autorizacaoRef.on(
"value",
snap=>{

if(currentCode!==codigo)return;

if(!snap.exists()){

bloquearAplicativo(
"Seu acesso foi revogado pelo administrador."
);

return;

}

const dados=snap.val();

if(
dados.deviceId &&
dados.deviceId!==deviceId
){

bloquearAplicativo(
"Este código foi transferido para outro aparelho."
);

}

});

codigoRef.on(
"value",
snap=>{

if(currentCode!==codigo)return;

if(!snap.exists()){

bloquearAplicativo(
"Seu código de acesso foi removido pelo administrador."
);

return;

}

const dados=snap.val();

if(
dados.deviceId &&
dados.deviceId!==deviceId
){

bloquearAplicativo(
"Este código foi transferido para outro aparelho."
);

}

});

}

/* =========================================================
VERIFICAÇÃO INICIAL
========================================================= */

async function verificarAcessoInicial(){

const codigoSalvo=
localStorage.getItem(
"nando_codigo"
);

if(!codigoSalvo){

bloquearAplicativo(
"Digite o código de acesso fornecido pelo administrador."
);

return;

}

try{

const snap=
await db.ref(
"codigos_gerados/"+codigoSalvo
).once("value");

if(!snap.exists()){

bloquearAplicativo(
"Seu código não existe ou foi removido."
);

return;

}

const dados=snap.val();

if(
dados.deviceId &&
dados.deviceId!==deviceId
){

bloquearAplicativo(
"Este código está vinculado a outro aparelho."
);

return;

}

const authSnap=
await db.ref(
"dispositivos_autorizados/"+codigoSalvo
).once("value");

if(!authSnap.exists()){

bloquearAplicativo(
"Seu acesso não está autorizado."
);

return;

}

const authData=
authSnap.val();

if(
authData.deviceId!==deviceId
){

bloquearAplicativo(
"Este código está vinculado a outro aparelho."
);

return;

}

currentCode=codigoSalvo;

localStorage.setItem(
"nando_autorizado",
"true"
);

mostrarApp();

mostrarBotaoInstalar();

iniciarMonitoramentoAutorizacao(
codigoSalvo
);

iniciarVideoCliente();

}catch(error){

console.error(
"Erro na verificação inicial:",
error
);

bloquearAplicativo(
"Não foi possível verificar seu acesso. Verifique sua conexão com o Firebase."
);

}

}

/* =========================================================
VIDEO CLIENTE
========================================================= */

function iniciarVideoCliente(){

/*
O vídeo de fundo do cliente continua opcional,
como na versão anterior.
*/

}

/* =========================================================
PWA
========================================================= */

window.addEventListener(
"beforeinstallprompt",
event=>{

event.preventDefault();

deferredPrompt=event;

if(
localStorage.getItem(
"nando_autorizado"
)==="true"||
adminLogado
){

mostrarBotaoInstalar();

}

});

function mostrarBotaoInstalar(){

const container=
document.getElementById(
"installContainer"
);

if(
deferredPrompt&&
container
){

container.style.display="block";

}

}

document.getElementById(
"installButton"
).addEventListener(
"click",
async()=>{

if(!deferredPrompt){

alert(
"Abra o menu do navegador e procure por "+
"'Instalar aplicativo' ou "+
"'Adicionar à tela inicial'."
);

return;

}

deferredPrompt.prompt();

try{

await deferredPrompt.userChoice;

}catch(error){

console.warn(error);

}

deferredPrompt=null;

document.getElementById(
"installContainer"
).style.display=
"none";

});

window.addEventListener(
"appinstalled",
()=>{

deferredPrompt=null;

document.getElementById(
"installContainer"
).style.display=
"none";

});

/* =========================================================
ENTER CÓDIGO
========================================================= */

document.getElementById(
"userAccessCode"
).addEventListener(
"keydown",
event=>{

if(event.key==="Enter"){

processarAcesso();

}

});

/* =========================================================
ENTER ADMIN
========================================================= */

document.getElementById(
"adminPassword"
).addEventListener(
"keydown",
event=>{

if(event.key==="Enter"){

entrarAdmin();

}

});

/* =========================================================
INICIALIZAÇÃO
========================================================= */

window.addEventListener(
"load",
()=>{

appContent.classList.add("hidden");

const codigo=
localStorage.getItem(
"nando_codigo"
);

if(codigo){

verificarAcessoInicial();

}else{

authModal.classList.add("active");

}

});

/* =========================================================
SERVICE WORKER
========================================================= */

if(
"serviceWorker" in navigator
){

window.addEventListener(
"load",
()=>{

navigator.serviceWorker
.register("./service-worker.js")
.then(reg=>{

console.log(
"Nando's Music PWA ativo:",
reg.scope
);

})
.catch(error=>{

console.warn(
"Service Worker:",
error
);

});

});

}
