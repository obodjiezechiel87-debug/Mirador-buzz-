import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, signInWithRedirect, GoogleAuthProvider, sendPasswordResetEmail, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

var box = document.getElementById("auth");
function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt !== undefined) e.textContent = txt; return e; }

var ERR = {
  "auth/invalid-email": "Adresse e-mail invalide.",
  "auth/missing-password": "Entrez votre mot de passe.",
  "auth/weak-password": "Mot de passe trop court (6 caractères minimum).",
  "auth/email-already-in-use": "Cette adresse e-mail a déjà un compte. Connectez-vous.",
  "auth/user-not-found": "Aucun compte avec cette adresse.",
  "auth/wrong-password": "Mot de passe incorrect.",
  "auth/invalid-credential": "E-mail ou mot de passe incorrect.",
  "auth/too-many-requests": "Trop d'essais. Réessayez dans quelques minutes.",
  "auth/network-request-failed": "Pas de connexion internet.",
  "auth/popup-closed-by-user": "Connexion Google annulée.",
  "auth/unauthorized-domain": "Ce site n'est pas encore autorisé dans Firebase (voir le README)."
};
function msg(e) { return ERR[e && e.code] || "Une erreur est survenue. Réessayez."; }

function configOk() { return firebaseConfig.apiKey && firebaseConfig.apiKey.indexOf("COLLEZ") === -1; }

function logo() {
  var d = el("div", "ah");
  d.innerHTML = '<svg viewBox="0 0 64 64" width="72" height="72"><defs><linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00c2ff"/><stop offset="1" stop-color="#1e5bff"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="#000" stroke="#1e90ff" stroke-width="2"/><path d="M13 28 C13 12 51 12 51 28" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><rect x="9" y="26" width="8" height="14" rx="3.5" fill="url(#lg2)"/><rect x="47" y="26" width="8" height="14" rx="3.5" fill="url(#lg2)"/><path d="M20 54 V30 L32 43 L44 30 V54" fill="none" stroke="url(#lg2)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg><h1>MIRADOR <i>BUZZ</i></h1><p>Créez un compte pour accéder à l\'actu de vos artistes.</p>';
  return d;
}

function showForm(auth) {
  box.innerHTML = "";
  var mode = "signup";
  var wrap = el("div", "ac");
  wrap.appendChild(logo());

  var tabs = el("div", "at");
  var tS = el("button", "on", "Créer un compte"), tL = el("button", "", "Se connecter");
  tabs.appendChild(tS); tabs.appendChild(tL); wrap.appendChild(tabs);

  var email = document.createElement("input"); email.type = "email"; email.placeholder = "Adresse e-mail"; email.autocomplete = "email";
  var pass = document.createElement("input"); pass.type = "password"; pass.placeholder = "Mot de passe (6 caractères minimum)"; pass.autocomplete = "current-password";
  var err = el("div", "ae"); var ok = el("div", "ao");
  var go = el("button", "ag", "Créer mon compte");
  var forgot = el("a", "af", "Mot de passe oublié ?"); forgot.href = "#"; forgot.style.display = "none";
  var sep = el("div", "as", "ou");
  var gg = el("button", "agg", "Continuer avec Google");

  function setMode(m) {
    mode = m; err.textContent = ""; ok.textContent = "";
    tS.className = m === "signup" ? "on" : ""; tL.className = m === "login" ? "on" : "";
    go.textContent = m === "signup" ? "Créer mon compte" : "Se connecter";
    forgot.style.display = m === "login" ? "block" : "none";
    pass.autocomplete = m === "signup" ? "new-password" : "current-password";
  }
  tS.onclick = function () { setMode("signup"); };
  tL.onclick = function () { setMode("login"); };

  function busy(b) { go.disabled = gg.disabled = b; }
  function submit() {
    err.textContent = ""; ok.textContent = "";
    var e = email.value.trim(), p = pass.value;
    if (!e) { err.textContent = "Entrez votre adresse e-mail."; return; }
    busy(true);
    var p1 = mode === "signup" ? createUserWithEmailAndPassword(auth, e, p) : signInWithEmailAndPassword(auth, e, p);
    p1.catch(function (x) { err.textContent = msg(x); }).then(function () { busy(false); });
  }
  go.onclick = submit;
  pass.addEventListener("keydown", function (k) { if (k.key === "Enter") submit(); });
  forgot.onclick = function (ev) {
    ev.preventDefault(); err.textContent = ""; ok.textContent = "";
    var e = email.value.trim();
    if (!e) { err.textContent = "Entrez d'abord votre adresse e-mail ci-dessus."; return; }
    sendPasswordResetEmail(auth, e).then(function () { ok.textContent = "E-mail envoyé. Vérifiez votre boîte de réception (et les spams)."; })
      .catch(function (x) { err.textContent = msg(x); });
  };
  gg.onclick = function () {
    err.textContent = ""; busy(true);
    var prov = new GoogleAuthProvider();
    signInWithPopup(auth, prov).catch(function (x) {
      if (x && (x.code === "auth/popup-blocked" || x.code === "auth/operation-not-supported-in-this-environment")) { return signInWithRedirect(auth, prov); }
      err.textContent = msg(x);
    }).then(function () { busy(false); });
  };

  [email, pass, err, ok, go, forgot, sep, gg].forEach(function (n) { wrap.appendChild(n); });
  wrap.appendChild(el("p", "an", "En créant un compte, vous acceptez que votre e-mail serve uniquement à vous identifier sur Mirador Buzz."));
  box.appendChild(wrap);
}

if (!configOk()) {
  box.innerHTML = "";
  var w = el("div", "ac"); w.appendChild(logo());
  w.appendChild(el("div", "ae", "Configuration Firebase manquante : remplissez le fichier firebase-config.js (voir README)."));
  box.appendChild(w);
} else {
  var app = initializeApp(firebaseConfig);
  var auth = getAuth(app);
  window.mbLogout = function () { if (window.stopApp) window.stopApp(); signOut(auth); };
  showForm(auth);
  onAuthStateChanged(auth, function (user) {
    if (user) {
      window.mbEmail = user.email || "";
      document.body.classList.remove("out");
      window.startApp(user.uid);
    } else {
      document.body.classList.add("out");
      showForm(auth);
    }
  });
}
