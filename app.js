/* =========================================================
   NANDO'S MUSIC
   APP.JS
   ACESSO + VÍDEO DE FUNDO + PWA
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
let backgroundVideoLoading = false;

/* =========================================================
   DEVICE ID
========================================================= */

let deviceId =
    localStorage.getItem("nando_device_id");

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

/* =========================================================
   CRIAR VÍDEO DE FUNDO AUTOMATICAMENTE
========================================================= */

let backgroundVideo =
    document.getElementById(
        "clientBackgroundVideo"
    );

function criarVideoDeFundo() {

    if (backgroundVideo) {

        configurarVideoDeFundo();

        return backgroundVideo;

    }

    backgroundVideo =
        document.createElement("video");

    backgroundVideo.id =
        "clientBackgroundVideo";

    document.body.insertBefore(
        backgroundVideo,
        document.body.firstChild
    );

    configurarVideoDeFundo();

    return backgroundVideo;
}

/* =========================================================
   CONFIGURAR VÍDEO
========================================================= */

function configurarVideoDeFundo() {

    if (!backgroundVideo) return;

    backgroundVideo.setAttribute(
        "playsinline",
        ""
    );

    backgroundVideo.setAttribute(
        "webkit-playsinline",
        ""
    );

    backgroundVideo.muted = true;

    backgroundVideo.autoplay = false;

    backgroundVideo.loop = false;

    backgroundVideo.preload = "auto";

    backgroundVideo.controls = false;

    backgroundVideo.style.position =
        "fixed";

    backgroundVideo.style.left =
        "0";

    backgroundVideo.style.top =
        "0";

    backgroundVideo.style.width =
        "100vw";

    backgroundVideo.style.height =
        "100vh";

    backgroundVideo.style.objectFit =
        "cover";

    backgroundVideo.style.zIndex =
        "-10";

    backgroundVideo.style.pointerEvents =
        "none";

    backgroundVideo.style.display =
        "none";

    backgroundVideo.style.opacity =
        "0.25";

    backgroundVideo.style.background =
        "#000";

    /*
       Cria uma aparência escura
       para o vídeo não atrapalhar
       a leitura da interface.
    */

    if (
        !document.getElementById(
            "nandoVideoOverlay"
        )
    ) {

        const overlay =
            document.createElement("div");

        overlay.id =
            "nandoVideoOverlay";

        overlay.style.position =
            "fixed";

        overlay.style.left =
            "0";

        overlay.style.top =
            "0";

        overlay.style.width =
            "100vw";

        overlay.style.height =
            "100vh";

        overlay.style.background =
            "rgba(4,6,14,.60)";

        overlay.style.zIndex =
            "-9";

        overlay.style.pointerEvents =
            "none";

        document.body.insertBefore(
            overlay,
            document.body.children[1] || null
        );

    }

}

/* =========================================================
   MOSTRAR APP
========================================================= */

function mostrarApp() {

    authModal.classList.remove(
        "active"
    );

    appContent.classList.remove(
        "hidden"
    );

    criarVideoDeFundo();

}

/* =========================================================
   BLOQUEAR CLIENTE
========================================================= */

function bloquearAplicativo(
    mensagem
) {

    currentCode = null;

    localStorage.removeItem(
        "nando_autorizado"
    );

    localStorage.removeItem(
        "nando_codigo"
    );

    try {

        if (
            authorizationListenersStarted
        ) {

            authorizationListenersStarted =
                false;

        }

    } catch (e) {

        console.warn(e);

    }

    const musicPlayer =
        document.getElementById(
            "musicPlayer"
        );

    const miniPlayer =
        document.getElementById(
            "miniPlayer"
        );

    if (musicPlayer) {

        musicPlayer.pause();

        musicPlayer.removeAttribute(
            "src"
        );

        musicPlayer.load();

    }

    pararVideoDeFundo();

    if (miniPlayer) {

        miniPlayer.classList.remove(
            "visible"
        );

    }

    appContent.classList.add(
        "hidden"
    );

    if (
        typeof adminLogado ===
        "undefined" ||
        !adminLogado
    ) {

        const menuButton =
            document.getElementById(
                "menuButton"
            );

        if (menuButton) {

            menuButton.classList.remove(
                "visible"
            );

        }

    }

    authModal.classList.add(
        "active"
    );

    mostrarMensagem(
        "authMessage",
        mensagem ||
        "Seu acesso foi bloqueado.",
        "error"
    );

}

/* =========================================================
   PROCESSAR ACESSO
========================================================= */

async function processarAcesso() {

    const input =
        document.getElementById(
            "userAccessCode"
        );

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

        authModal.classList.remove(
            "active"
        );

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
        ).value = "";

        setTimeout(() => {

            document.getElementById(
                "adminPassword"
            ).focus();

        }, 150);

        return;

    }

    await validarCodigoUsuario(
        valor
    );

}

/* =========================================================
   VALIDAR CÓDIGO CLIENTE
========================================================= */

async function validarCodigoUsuario(
    codigo
) {

    if (
        !/^ND-[A-Z0-9]{6}$/.test(
            codigo
        )
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
            await ref.once(
                "value"
            );

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

        document.getElementById(
            "userAccessCode"
        ).value = "";

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

        await iniciarVideoCliente();

    } catch (error) {

        console.error(
            "Erro ao validar cliente:",
            error
        );

        let mensagem =
            "Não foi possível validar o código.";

        if (
            error &&
            error.message
        ) {

            mensagem =
                error.message;

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

function iniciarMonitoramentoAutorizacao(
    codigo
) {

    if (!codigo) return;

    currentCode = codigo;

    authorizationListenersStarted =
        true;

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
            ).once(
                "value"
            );

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
            ).once(
                "value"
            );

        if (!authSnap.exists()) {

            bloquearAplicativo(
                "Seu acesso não está autorizado."
            );

            return;

        }

        const authData =
            authSnap.val();

        if (
            authData.deviceId !==
            deviceId
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

        await iniciarVideoCliente();

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
   CARREGAR VÍDEOS DE FUNDO
========================================================= */

async function carregarVideosDeFundo() {

    try {

        const snapshot =
            await db.ref(
                "fundos"
            ).once(
                "value"
            );

        const dados =
            snapshot.val();

        backgroundVideos = [];

        if (!dados) {

            console.log(
                "Nando's Music: nenhum vídeo de fundo cadastrado."
            );

            return;

        }

        Object.keys(
            dados
        ).forEach(
            chave => {

                const item =
                    dados[chave];

                let url = "";

                if (
                    typeof item ===
                    "string"
                ) {

                    url = item;

                } else if (
                    item &&
                    typeof item ===
                    "object"
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
                    typeof url ===
                    "string" &&
                    url.trim() !== ""
                ) {

                    backgroundVideos.push(
                        url.trim()
                    );

                }

            }
        );

        backgroundVideos =
            [
                ...new Set(
                    backgroundVideos
                )
            ];

        console.log(
            "Nando's Music: vídeos de fundo encontrados:",
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

    let disponiveis =
        backgroundVideos.filter(
            url =>
                url !==
                currentBackgroundVideo
        );

    if (
        disponiveis.length === 0
    ) {

        disponiveis =
            backgroundVideos.slice();

    }

    const indice =
        Math.floor(
            Math.random() *
            disponiveis.length
        );

    return disponiveis[indice];

}

/* =========================================================
   REPRODUZIR NOVO VÍDEO
========================================================= */

async function reproduzirNovoVideoDeFundo() {

    if (!backgroundVideo) {

        criarVideoDeFundo();

    }

    if (!backgroundVideo) {

        return;

    }

    if (backgroundVideoLoading) {

        return;

    }

    const novoVideo =
        escolherVideoAleatorio();

    if (!novoVideo) {

        backgroundVideo.style.display =
            "none";

        return;

    }

    backgroundVideoLoading =
        true;

    currentBackgroundVideo =
        novoVideo;

    try {

        backgroundVideo.pause();

        backgroundVideo.removeAttribute(
            "src"
        );

        backgroundVideo.load();

        backgroundVideo.src =
            novoVideo;

        backgroundVideo.muted =
            true;

        backgroundVideo.volume = 0;

        backgroundVideo.playsInline =
            true;

        backgroundVideo.loop =
            false;

        backgroundVideo.style.display =
            "block";

        /*
           Aguarda o navegador reconhecer
           o novo vídeo antes de reproduzir.
        */

        await new Promise(
            resolve => {

                if (
                    backgroundVideo.readyState >=
                    2
                ) {

                    resolve();

                    return;

                }

                const finalizar =
                    () => {

                        backgroundVideo.removeEventListener(
                            "loadeddata",
                            finalizar
                        );

                        backgroundVideo.removeEventListener(
                            "error",
                            finalizar
                        );

                        resolve();

                    };

                backgroundVideo.addEventListener(
                    "loadeddata",
                    finalizar,
                    {
                        once:true
                    }
                );

                backgroundVideo.addEventListener(
                    "error",
                    finalizar,
                    {
                        once:true
                    }
                );

            }
        );

        await backgroundVideo.play();

        console.log(
            "Nando's Music: vídeo de fundo reproduzindo:",
            novoVideo
        );

    } catch (error) {

        console.warn(
            "Não foi possível reproduzir o vídeo de fundo:",
            error
        );

    } finally {

        backgroundVideoLoading =
            false;

    }

}

/* =========================================================
   EVENTO: VÍDEO TERMINOU
========================================================= */

function configurarEventoVideo() {

    if (!backgroundVideo) return;

    if (
        backgroundVideoInitialized
    ) {

        return;

    }

    backgroundVideo.addEventListener(
        "ended",
        async () => {

            const musicPlayer =
                document.getElementById(
                    "musicPlayer"
                );

            /*
               Só troca para outro vídeo
               se a música estiver tocando.
            */

            if (
                !musicPlayer ||
                musicPlayer.paused ||
                musicPlayer.ended
            ) {

                return;

            }

            await reproduzirNovoVideoDeFundo();

        }
    );

    backgroundVideoInitialized =
        true;

}

/* =========================================================
   INICIAR VÍDEO DO CLIENTE
========================================================= */

async function iniciarVideoCliente() {

    criarVideoDeFundo();

    configurarEventoVideo();

    if (
        backgroundVideos.length === 0
    ) {

        await carregarVideosDeFundo();

    }

    if (
        backgroundVideos.length === 0
    ) {

        if (backgroundVideo) {

            backgroundVideo.style.display =
                "none";

        }

        return;

    }

    /*
       Não começa sozinho.
       Ele começa quando a música
       realmente tocar.
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

        if (
            !backgroundVideo.src
        ) {

            await reproduzirNovoVideoDeFundo();

        } else {

            try {

                await backgroundVideo.play();

            } catch (error) {

                console.warn(
                    error
                );

            }

        }

    }

}

/* =========================================================
   PARAR VÍDEO DE FUNDO
========================================================= */

function pararVideoDeFundo() {

    if (!backgroundVideo) {

        return;

    }

    try {

        backgroundVideo.pause();

        backgroundVideo.removeAttribute(
            "src"
        );

        backgroundVideo.load();

        backgroundVideo.style.display =
            "none";

        currentBackgroundVideo =
            "";

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

    if (!musicPlayer) {

        console.warn(
            "Player de música não encontrado."
        );

        return;

    }

    criarVideoDeFundo();

    configurarEventoVideo();

    /*
       MÚSICA COMEÇOU
    */

    musicPlayer.addEventListener(
        "play",
        async () => {

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
               Se ainda não existe vídeo,
               escolhe um aleatório.
            */

            if (
                !backgroundVideo.src
            ) {

                await reproduzirNovoVideoDeFundo();

                return;

            }

            /*
               Se já existe vídeo,
               continua de onde parou.
            */

            try {

                backgroundVideo.style.display =
                    "block";

                await backgroundVideo.play();

            } catch (error) {

                console.warn(
                    "Não foi possível continuar o vídeo:",
                    error
                );

            }

        }
    );

    /*
       MÚSICA PAUSOU
    */

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

    /*
       MÚSICA TERMINOU
    */

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
   ENTER CÓDIGO
========================================================= */

document.getElementById(
    "userAccessCode"
).addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            processarAcesso();

        }

    }
);

/* =========================================================
   ENTER ADMIN
========================================================= */

document.getElementById(
    "adminPassword"
).addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            entrarAdmin();

        }

    }
);

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

document.getElementById(
    "installButton"
).addEventListener(
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

            console.warn(
                error
            );

        }

        deferredPrompt = null;

        document.getElementById(
            "installContainer"
        ).style.display =
            "none";

    }
);

window.addEventListener(
    "appinstalled",
    () => {

        deferredPrompt = null;

        document.getElementById(
            "installContainer"
        ).style.display =
            "none";

    }
);

/* =========================================================
   INICIALIZAÇÃO
========================================================= */

window.addEventListener(
    "load",
    () => {

        appContent.classList.add(
            "hidden"
        );

        /*
           Prepara o vídeo, mas não toca.
           Ele só tocará quando a música
           começar.
        */

        criarVideoDeFundo();

        configurarEventoVideo();

        sincronizarVideoComMusica();

        const codigo =
            localStorage.getItem(
                "nando_codigo"
            );

        if (codigo) {

            verificarAcessoInicial();

        } else {

            authModal.classList.add(
                "active"
            );

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
