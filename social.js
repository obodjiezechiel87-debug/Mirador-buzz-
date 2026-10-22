// Abonnés par artiste (Firestore). Si Firestore n'est pas activé, l'app continue de fonctionner sans le compteur.
import { getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, deleteDoc, collection, getCountFromServer }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function ref(id) {
  var app = getApp(), u = getAuth(app).currentUser;
  if (!u || !id) return null;
  return doc(getFirestore(app), "artists", String(id), "followers", u.uid);
}
window.MB = {
  count: function (id) {
    try {
      return getCountFromServer(collection(getFirestore(getApp()), "artists", String(id), "followers"))
        .then(function (s) { return s.data().count; }).catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  },
  follow: function (a) {
    try { var r = ref(a && a.id); if (r) setDoc(r, { t: Date.now() }).catch(function () {}); } catch (e) {}
  },
  unfollow: function (a) {
    try { var r = ref(a && a.id); if (r) deleteDoc(r).catch(function () {}); } catch (e) {}
  }
};
