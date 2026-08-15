const CACHE_NAME = "nandos-music-v2";

const ARQUIVOS_PRINCIPAIS = [
  "./",
  "./index.html",
  "./manifest.json"
];

/*
=====================================================
INSTALAÇÃO
=====================================================
*/

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)

      .then(cache => {

        return cache.addAll(ARQUIVOS_PRINCIPAIS);

      })

      .then(() => {

        return self.skipWaiting();

      })

  );

});


/*
=====================================================
ATIVAÇÃO
=====================================================
*/

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys()

      .then(chaves => {

        return Promise.all(

          chaves

            .filter(chave => chave !== CACHE_NAME)

            .map(chave => caches.delete(chave))

        );

      })

      .then(() => {

        return self.clients.claim();

      })

  );

});


/*
=====================================================
ATUALIZAÇÃO DO SERVICE WORKER
=====================================================
*/

self.addEventListener("message", event => {

  if (event.data === "ATUALIZAR_APP") {

    self.skipWaiting();

  }

});


/*
=====================================================
REQUISIÇÕES
=====================================================
*/

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {

    return;

  }


  const url = new URL(event.request.url);


  /*
  Não armazenar requisições do Firebase
  no cache do aplicativo.
  */

  if (

    url.hostname.includes("firebaseio.com") ||

    url.hostname.includes("googleapis.com") ||

    url.hostname.includes("gstatic.com")

  ) {

    return;

  }


  /*
  Arquivos principais:
  tenta buscar a versão nova na internet.
  Se estiver sem internet, usa o cache.
  */

  if (

    url.pathname.endsWith("/index.html") ||

    url.pathname.endsWith("/") ||

    url.pathname.endsWith("/manifest.json")

  ) {

    event.respondWith(

      fetch(event.request)

        .then(resposta => {

          if (resposta && resposta.ok) {

            const copia = resposta.clone();

            caches.open(CACHE_NAME)

              .then(cache => {

                cache.put(event.request, copia);

              });

          }

          return resposta;

        })

        .catch(() => {

          return caches.match(event.request);

        })

    );

    return;

  }


  /*
  Outros arquivos:
  primeiro tenta internet.
  Se não conseguir, usa cache.
  */

  event.respondWith(

    fetch(event.request)

      .then(resposta => {

        if (resposta && resposta.ok) {

          const copia = resposta.clone();

          caches.open(CACHE_NAME)

            .then(cache => {

              cache.put(event.request, copia);

            });

        }

        return resposta;

      })

      .catch(() => {

        return caches.match(event.request);

      })

  );

});
