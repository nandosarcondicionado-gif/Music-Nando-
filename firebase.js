/* =========================================================
FIREBASE
========================================================= */

const firebaseConfig={
apiKey:"AIzaSyDnIdV6Y9l4Fw9lhW_i5iZEP0nnxVEjNoqo",
authDomain:"nandomusic-c77a3.firebaseapp.com",
databaseURL:"https://nandomusic-c77a3-default-rtdb.firebaseio.com",
projectId:"nandomusic-c77a3",
storageBucket:"nandomusic-c77a3.firebasestorage.app",
messagingSenderId:"509221491611",
appId:"1:509221491611:web:e9b7ffc4cde7ee9477473e",
measurementId:"G-K6WVWHTVP7"
};

if(!firebase.apps.length){
firebase.initializeApp(firebaseConfig);
}

const db=firebase.database();

/* =========================================================
CONEXÃO FIREBASE
========================================================= */

db.ref(".info/connected").on(
"value",
snap=>{

const status=
document.getElementById(
"connectionStatus"
);

if(!status)return;

if(snap.val()===true){

status.innerText="● Conectado";
status.style.color="#4ade80";

}else{

status.innerText="● Sem conexão com o servidor";
status.style.color="#f87171";

}

});
