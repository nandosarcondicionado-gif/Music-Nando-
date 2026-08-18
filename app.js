/* =========================================================
   NANDO'S MUSIC
   APP.JS
   ACESSO + VÍDEO DE FUNDO + DOWNLOAD + PWA
========================================================= */

const CHAVE_ADM = "NANDOADM";

let currentCode = null;
let authorizationListenersStarted = false;
let deferredPrompt = null;

/* =========================================================
   VÍDEO DE FUNDO
========================================================= */

let backgroundVideos = [];
let currentBackgroundVideo = "";
let backgroundVideoInitialized = false;
let backgroundVideoEventsInitialized = false;

/* =========================================================
   DEVICE ID
========================================================= */

let deviceId = localStorage.getItem("nando_device_id");

if (!deviceId) {

    deviceId =
        "DEV-" +
        Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase();

    localStorage.setItem(
        "nando_device_id",
        deviceId
    );
}

/* =========================================================
   ELEMENTOS
========================================================= */

const authModal =
    document.getElementById("authModal");

const appContent =
    document.getElementById("appContent");

const backgroundVideo =
    document.getElementById(
        "clientBackgroundVideo"
    );

/* =========================================================
   MOSTRAR APP
========================================================= */

function mostrarApp() {

    if (authModal) {
        authModal.classList.remove("active");
    }

    if (appContent) {
        appContent.classList.remove("hidden");
    }

}

/* =========================================================
   BLOQUEAR CLIENTE
========================================================= */

function bloquearAplicativo(mensagem) {

    currentCode = null;

    localStorage.removeItem("nando_autorizado");
    localStorage.removeItem("nando_codigo");

    authorizationListenersStarted = false;

    const musicPlayer =
        document.getElementById("musicPlayer");

    const miniPlayer =
        document.getElementById("miniPlayer");

    if (musicPlayer) {

        musicPlayer.pause();

        musicPlayer.removeAttribute("src");

        musicPlayer.load();

    }

    pararVideoDeFundo();

    if (miniPlayer) {

        miniPlayer.classList.remove("visible");

    }

    if (appContent) {

        appContent.classList.add("hidden");

    }

    if (
        typeof adminLogado === "undefined" ||
        !adminLogado
    ) {

        const menuButton =
            document.getElementById("menuButton");

        if (menuButton) {

            menuButton.classList.remove(
                "visible"
            );

        }

    }

    if (authModal) {

        authModal.classList.add("active");

    }

    if (typeof mostrarMensagem === "function") {

        mostrarMensagem(
            "authMessage",
            mensagem ||
                "Seu acesso foi bloqueado.",
            "error"
        );

    }

}

/* =========================================================
   PROCESSAR ACESSO
========================================================= */

async function processarAcesso() {

    const input =
        document.getElementById(
            "userAccessCode"
        );

    if (!input) return;

    const valor =
        input.value
            .trim()
            .toUpperCase();

    if (!valor) {

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

    if (valor === CHAVE_ADM) {

        input.value = "";

        if (authModal) {
            authModal.classList.remove("active");
        }

        const adminModal =
            document.getElementById(
                "adminLoginModal"
            );

        if (adminModal) {

            adminModal.classList.add("active");

        }

        mostrarMensagem(
            "adminLoginMessage",
            "",
            ""
        );

        const password =
            document.getElementById(
                "adminPassword"
            );

        if (password) {

            password.value = "";

            setTimeout(() => {

                password.focus();

            }, 150);

        }

        return;

    }

    await validarCodigoUsuario(valor);

}

/* =========================================================
   VALIDAR CÓDIGO CLIENTE
========================================================= */

async function validarCodigoUsuario(codigo) {

    if (
        !/^ND-[A-Z0-9]{6}$/.test(codigo)
    ) {

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

    try {

        const ref =
            db.ref(
                "codigos_gerados/" +
                codigo
            );

        const snap =
            await ref.once("value");

        const dados =
            snap.val();

        if (!dados) {

            throw new Error(
                "Este código não existe ou foi removido."
            );

        }

        if (
            dados.usado === true &&
            dados.deviceId &&
            dados.deviceId !== deviceId
        ) {

            throw new Error(
                "Este código já está vinculado a outro aparelho."
            );

        }

        await ref.update({

            usado: true,
            deviceId: deviceId,
            ultimoAcesso: Date.now()

        });

        await db.ref(
            "dispositivos_autorizados/" +
            codigo
        ).set({

            codigo: codigo,
            deviceId: deviceId,
            data: Date.now()

        });

        currentCode = codigo;

        localStorage.setItem(
            "nando_autorizado",
            "true"
        );

        localStorage.setItem(
            "nando_codigo",
            codigo
        );

        const accessInput =
            document.getElementById(
                "userAccessCode"
            );

        if (accessInput) {
            accessInput.value = "";
        }

        mostrarMensagem(
            "authMessage",
            "",
            ""
        );

        mostrarApp();

        mostrarBotaoInstalar();

        iniciarMonitoramentoAutorizacao(
            codigo
        );

        iniciarVideoCliente();

    } catch (error) {

        console.error(
            "Erro ao validar cliente:",
            error
        );

        mostrarMensagem(
            "authMessage",
            error && error.message
                ? error.message
                : "Não foi possível validar o código.",
            "error"
        );

    }

}

/* =========================================================
   MONITORAMENTO
========================================================= */

function iniciarMonitoramentoAutorizacao(
    codigo
) {

    if (!codigo) return;

    currentCode = codigo;

    authorizationListenersStarted = true;

    const autorizacaoRef =
        db.ref(
            "dispositivos_autorizados/" +
            codigo
        );

    const codigoRef =
        db.ref(
            "codigos_gerados/" +
            codigo
        );

    autorizacaoRef.off();
    codigoRef.off();

    autorizacaoRef.on(
        "value",
        snap => {

            if (
                currentCode !== codigo
            ) return;

            if (!snap.exists()) {

                bloquearAplicativo(
                    "Seu acesso foi revogado pelo administrador."
                );

                return;

            }

            const dados =
                snap.val();

            if (
                dados.deviceId &&
                dados.deviceId !== deviceId
            ) {

                bloquearAplicativo(
                    "Este código foi transferido para outro aparelho."
                );

            }

        }
    );

    codigoRef.on(
        "value",
        snap => {

            if (
                currentCode !== codigo
            ) return;

            if (!snap.exists()) {

                bloquearAplicativo(
                    "Seu código de acesso foi removido pelo administrador."
                );

                return;

            }

            const dados =
                snap.val();

            if (
                dados.deviceId &&
                dados.deviceId !== deviceId
            ) {

                bloquearAplicativo(
                    "Este código foi transferido para outro aparelho."
                );

            }

        }
    );

}

/* =========================================================
   VERIFICAÇÃO INICIAL
========================================================= */

async function verificarAcessoInicial() {

    const codigoSalvo =
        localStorage.getItem(
            "nando_codigo"
        );

    if (!codigoSalvo) {

        bloquearAplicativo(
            "Digite o código de acesso fornecido pelo administrador."
        );

        return;

    }

    try {

        const snap =
            await db.ref(
                "codigos_gerados/" +
                codigoSalvo
            ).once("value");

        if (!snap.exists()) {

            bloquearAplicativo(
                "Seu código não existe ou foi removido."
            );

            return;

        }

        const dados =
            snap.val();

        if (
            dados.deviceId &&
            dados.deviceId !== deviceId
        ) {

            bloquearAplicativo(
                "Este código está vinculado a outro aparelho."
            );

            return;

        }

        const authSnap =
            await db.ref(
                "dispositivos_autorizados/" +
                codigoSalvo
            ).once("value");

        if (!authSnap.exists()) {

            bloquearAplicativo(
                "Seu acesso não está autorizado."
            );

            return;

        }

        const authData =
            authSnap.val();

        if (
            authData.deviceId !== deviceId
        ) {

            bloquearAplicativo(
                "Este código está vinculado a outro aparelho."
            );

            return;

        }

        currentCode =
            codigoSalvo;

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

    } catch (error) {

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
   CARREGAR VÍDEOS DO ADM
========================================================= */

async function carregarVideosDeFundo() {

    try {

        const snapshot =
            await db.ref("fundos")
                .once("value");

        const dados =
            snapshot.val();

        backgroundVideos = [];

        if (!dados) {

            console.log(
                "Nando's Music: nenhum vídeo de fundo cadastrado."
            );

            return;

        }

        Object.keys(dados).forEach(
            chave => {

                const item =
                    dados[chave];

                let url = "";

                if (
                    typeof item === "string"
                ) {

                    url = item;

                } else if (
                    item &&
                    typeof item === "object"
                ) {

                    url =
                        item.url ||
                        item.link ||
                        item.videoUrl ||
                        item.backgroundUrl ||
                        item.src ||
                        "";

                }

                if (
                    typeof url === "string" &&
                    url.trim() !== ""
                ) {

                    backgroundVideos.push(
                        url.trim()
                    );

                }

            }
        );

        backgroundVideos =
            [...new Set(backgroundVideos)];

        console.log(
            "Nando's Music: vídeos encontrados:",
            backgroundVideos.length
        );

    } catch (error) {

        console.error(
            "Erro ao carregar vídeos de fundo:",
            error
        );

        backgroundVideos = [];

    }

}

/* =========================================================
   ESCOLHER VÍDEO ALEATÓRIO
========================================================= */

function escolherVideoAleatorio() {

    if (
        !backgroundVideos ||
        backgroundVideos.length === 0
    ) {

        return null;

    }

    if (
        backgroundVideos.length === 1
    ) {

        return backgroundVideos[0];

    }

    const disponiveis =
        backgroundVideos.filter(
            url =>
                url !==
                currentBackgroundVideo
        );

    const lista =
        disponiveis.length
            ? disponiveis
            : backgroundVideos;

    const indice =
        Math.floor(
            Math.random() *
            lista.length
        );

    return lista[indice];

}

/* =========================================================
   REPRODUZIR NOVO VÍDEO
========================================================= */

async function reproduzirNovoVideoDeFundo(
    iniciarAutomaticamente = true
) {

    if (!backgroundVideo) {

        return;

    }

    const novoVideo =
        escolherVideoAleatorio();

    if (!novoVideo) {

        backgroundVideo.style.display =
            "none";

        return;

    }

    currentBackgroundVideo =
        novoVideo;

    backgroundVideo.style.display =
        "block";

    backgroundVideo.pause();

    backgroundVideo.removeAttribute(
        "src"
    );

    backgroundVideo.load();

    backgroundVideo.src =
        novoVideo;

    backgroundVideo.muted = true;
    backgroundVideo.autoplay = false;
    backgroundVideo.playsInline = true;
    backgroundVideo.loop = false;

    /*
       O evento ENDED é registrado somente uma vez.
       Quando terminar, outro vídeo será escolhido.
    */

    if (
        !backgroundVideoInitialized
    ) {

        backgroundVideo.addEventListener(
            "ended",
            async () => {

                const musicPlayer =
                    document.getElementById(
                        "musicPlayer"
                    );

                /*
                   Só troca o vídeo automaticamente
                   se houver música tocando.
                */

                if (
                    musicPlayer &&
                    !musicPlayer.paused &&
                    !musicPlayer.ended
                ) {

                    await reproduzirNovoVideoDeFundo(
                        true
                    );

                }

            }
        );

        backgroundVideoInitialized = true;

    }

    if (!iniciarAutomaticamente) {

        return;

    }

    try {

        await backgroundVideo.play();

    } catch (error) {

        console.warn(
            "Vídeo aguardando reprodução:",
            error
        );

    }

}

/* =========================================================
   INICIAR VÍDEO DO CLIENTE
========================================================= */

async function iniciarVideoCliente() {

    if (!backgroundVideo) {

        console.warn(
            "Elemento clientBackgroundVideo não encontrado."
        );

        return;

    }

    await carregarVideosDeFundo();

    if (
        backgroundVideos.length === 0
    ) {

        backgroundVideo.style.display =
            "none";

        return;

    }

    backgroundVideo.style.display =
        "block";

    /*
       Não inicia vídeo sozinho se não houver
       música tocando.
    */

    const musicPlayer =
        document.getElementById(
            "musicPlayer"
        );

    if (
        musicPlayer &&
        !musicPlayer.paused &&
        !musicPlayer.ended
    ) {

        await reproduzirNovoVideoDeFundo(
            true
        );

    }

}

/* =========================================================
   PARAR VÍDEO DE FUNDO
========================================================= */

function pararVideoDeFundo() {

    if (!backgroundVideo) return;

    try {

        backgroundVideo.pause();

        backgroundVideo.removeAttribute(
            "src"
        );

        backgroundVideo.load();

        backgroundVideo.style.display =
            "none";

        currentBackgroundVideo = "";

    } catch (error) {

        console.warn(
            "Erro ao parar vídeo de fundo:",
            error
        );

    }

}

/* =========================================================
   SINCRONIZAR VÍDEO COM MÚSICA
========================================================= */

function sincronizarVideoComMusica() {

    const musicPlayer =
        document.getElementById(
            "musicPlayer"
        );

    if (
        !musicPlayer ||
        !backgroundVideo
    ) {

        return;

    }

    /*
       Impede que os eventos sejam registrados
       várias vezes.
    */

    if (backgroundVideoEventsInitialized) {

        return;

    }

    backgroundVideoEventsInitialized = true;

    /* -------------------------------------------------------
       MÚSICA COMEÇOU
    ------------------------------------------------------- */

    musicPlayer.addEventListener(
        "play",
        async () => {

            try {

                if (
                    backgroundVideos.length === 0
                ) {

                    await carregarVideosDeFundo();

                }

                if (
                    backgroundVideos.length === 0
                ) {

                    return;

                }

                /*
                   Se não existe vídeo,
                   ou se o vídeo terminou,
                   escolhe um novo.
                */

                if (
                    !backgroundVideo.src ||
                    backgroundVideo.ended
                ) {

                    await reproduzirNovoVideoDeFundo(
                        true
                    );

                    return;

                }

                /*
                   Se existe vídeo pausado,
                   continua o vídeo atual.
                */

                await backgroundVideo.play();

            } catch (error) {

                console.warn(
                    "Erro ao sincronizar vídeo com música:",
                    error
                );

            }

        }
    );

    /* -------------------------------------------------------
       MÚSICA PAUSOU
    ------------------------------------------------------- */

    musicPlayer.addEventListener(
        "pause",
        () => {

            if (
                backgroundVideo &&
                !backgroundVideo.paused
            ) {

                backgroundVideo.pause();

            }

        }
    );

    /* -------------------------------------------------------
       MÚSICA TERMINOU
    ------------------------------------------------------- */

    musicPlayer.addEventListener(
        "ended",
        () => {

            if (backgroundVideo) {

                backgroundVideo.pause();

            }

        }
    );

}

/* =========================================================
   DOWNLOAD DA MÚSICA
========================================================= */

async function baixarMusica(url, nomeArquivo) {

    if (!url) {

        alert(
            "Arquivo da música não encontrado."
        );

        return;

    }

    /*
       Primeiro tenta baixar diretamente.
       Isso funciona quando o servidor permite
       download via navegador.
    */

    try {

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            nomeArquivo ||
            "musica";

        link.target = "_blank";

        link.rel =
            "noopener noreferrer";

        document.body.appendChild(link);

        link.click();

        link.remove();

        return;

    } catch (error) {

        console.warn(
            "Download direto não disponível:",
            error
        );

    }

    /*
       Se o navegador não permitir download direto,
       abre o arquivo para o usuário salvar.
    */

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}

/* =========================================================
   ENTER CÓDIGO
========================================================= */

const userAccessCode =
    document.getElementById(
        "userAccessCode"
    );

if (userAccessCode) {

    userAccessCode.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                processarAcesso();

            }

        }
    );

}

/* =========================================================
   ENTER ADMIN
========================================================= */

const adminPassword =
    document.getElementById(
        "adminPassword"
    );

if (adminPassword) {

    adminPassword.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                if (
                    typeof entrarAdmin ===
                    "function"
                ) {

                    entrarAdmin();

                }

            }

        }
    );

}

/* =========================================================
   PWA
========================================================= */

window.addEventListener(
    "beforeinstallprompt",
    event => {

        event.preventDefault();

        deferredPrompt = event;

        if (
            localStorage.getItem(
                "nando_autorizado"
            ) === "true" ||
            (
                typeof adminLogado !==
                "undefined" &&
                adminLogado
            )
        ) {

            mostrarBotaoInstalar();

        }

    }
);

function mostrarBotaoInstalar() {

    const container =
        document.getElementById(
            "installContainer"
        );

    if (
        deferredPrompt &&
        container
    ) {

        container.style.display =
            "block";

    }

}

const installButton =
    document.getElementById(
        "installButton"
    );

if (installButton) {

    installButton.addEventListener(
        "click",
        async () => {

            if (!deferredPrompt) {

                alert(
                    "Abra o menu do navegador e procure por " +
                    "'Instalar aplicativo' ou " +
                    "'Adicionar à tela inicial'."
                );

                return;

            }

            deferredPrompt.prompt();

            try {

                await deferredPrompt.userChoice;

            } catch (error) {

                console.warn(error);

            }

            deferredPrompt = null;

            const container =
                document.getElementById(
                    "installContainer"
                );

            if (container) {

                container.style.display =
                    "none";

            }

        }
    );

}

window.addEventListener(
    "appinstalled",
    () => {

        deferredPrompt = null;

        const container =
            document.getElementById(
                "installContainer"
            );

        if (container) {

            container.style.display =
                "none";

        }

    }
);

/* =========================================================
   INICIALIZAÇÃO
========================================================= */

window.addEventListener(
    "load",
    () => {

        if (appContent) {

            appContent.classList.add(
                "hidden"
            );

        }

        /*
           Liga uma única vez a sincronização
           entre música e vídeo.
        */

        sincronizarVideoComMusica();

        const codigo =
            localStorage.getItem(
                "nando_codigo"
            );

        if (codigo) {

            verificarAcessoInicial();

        } else {

            if (authModal) {

                authModal.classList.add(
                    "active"
                );

            }

        }

    }
);

/* =========================================================
   SERVICE WORKER
========================================================= */

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register(
                    "./service-worker.js"
                )
                .then(
                    reg => {

                        console.log(
                            "Nando's Music PWA ativo:",
                            reg.scope
                        );

                    }
                )
                .catch(
                    error => {

                        console.warn(
                            "Service Worker:",
                            error
                        );

                    }
                );

        }
    );

}
