// ===== Modèle (correspond au diagramme de classes UML) =====
class Produit {
  constructor(id, nom, prix, emoji) { this.id = id; this.nom = nom; this.prix = prix; this.emoji = emoji; }
}
class LignePanier {
  constructor(produit, quantite = 1) { this.produit = produit; this.quantite = quantite; }
  sousTotal() { return this.produit.prix * this.quantite; }
}
class Panier {
  constructor() { this.lignes = []; this.remise = 0; }
  ajouter(produit) {
    const l = this.lignes.find(x => x.produit.id === produit.id);
    l ? l.quantite++ : this.lignes.push(new LignePanier(produit));
  }
  changerQuantite(id, delta) {
    const l = this.lignes.find(x => x.produit.id === id);
    if (!l) return;
    l.quantite += delta;
    if (l.quantite <= 0) this.supprimer(id);
  }
  supprimer(id) { this.lignes = this.lignes.filter(x => x.produit.id !== id); }
  vider() { this.lignes = []; this.remise = 0; }
  nbArticles() { return this.lignes.reduce((s, l) => s + l.quantite, 0); }
  sousTotal() { return this.lignes.reduce((s, l) => s + l.sousTotal(), 0); }
  appliquerCode(code) {
    if (code.trim().toUpperCase() === "PROMO10") { this.remise = 0.10; return true; }
    this.remise = 0; return false;
  }
  montantRemise() { return this.sousTotal() * this.remise; }
  total() { return this.sousTotal() - this.montantRemise(); }
}
class Paiement {
  static valider({ nom, carte, exp, cvv }) {
    if (nom.trim().length < 3) return "Saisissez le nom figurant sur la carte.";
    if (!/^\d{16}$/.test(carte.replace(/\s/g, ""))) return "Le numéro de carte doit contenir 16 chiffres.";
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) return "Expiration invalide (format MM/AA).";
    if (!/^\d{3}$/.test(cvv)) return "Le CVV doit contenir 3 chiffres.";
    return null;
  }
}

// ===== Données et interface =====
const produits = [
  new Produit(1, "Casque audio", 89.9, "🎧"),
  new Produit(2, "Clavier", 45.0, "⌨️"),
  new Produit(3, "Souris", 25.5, "🖱️"),
  new Produit(4, "Webcam HD", 60.0, "📷"),
  new Produit(5, "Clé USB 64 Go", 18.0, "💾"),
  new Produit(6, "Sac à dos", 52.0, "🎒"),
];
const panier = new Panier();
const $ = id => document.getElementById(id);
const dt = n => n.toFixed(2) + " DT";

function afficherCatalogue() {
  $("products").innerHTML = produits.map(p => `
    <article class="card"><div class="emoji">${p.emoji}</div>
    <h3>${p.nom}</h3><span class="price">${dt(p.prix)}</span>
    <button class="primary" data-add="${p.id}">Ajouter au panier</button></article>`).join("");
}
function afficherPanier() {
  $("count").textContent = panier.nbArticles();
  $("lines").innerHTML = panier.lignes.length ? panier.lignes.map(l => `
    <li><span>${l.produit.emoji} ${l.produit.nom}<br><small>${dt(l.sousTotal())}</small></span>
    <span class="qty"><button data-dec="${l.produit.id}" aria-label="Diminuer">−</button> ${l.quantite}
    <button data-inc="${l.produit.id}" aria-label="Augmenter">+</button>
    <button data-del="${l.produit.id}" aria-label="Supprimer">🗑</button></span></li>`).join("")
    : "<li>Votre panier est vide. Ajoutez un produit du catalogue.</li>";
  $("subtotal").textContent = dt(panier.sousTotal());
  $("discount").textContent = "-" + dt(panier.montantRemise());
  $("total").textContent = dt(panier.total());
  $("checkout").disabled = panier.lignes.length === 0;
}

document.addEventListener("click", e => {
  const d = e.target.dataset;
  if (d.add) panier.ajouter(produits.find(p => p.id == d.add));
  if (d.inc) panier.changerQuantite(+d.inc, 1);
  if (d.dec) panier.changerQuantite(+d.dec, -1);
  if (d.del) panier.supprimer(+d.del);
  if (d.add || d.inc || d.dec || d.del) afficherPanier();
});
$("open-cart").onclick = () => { $("cart").hidden = false; };
$("close-cart").onclick = () => { $("cart").hidden = true; };
$("apply").onclick = () => {
  const ok = panier.appliquerCode($("promo").value);
  $("promo-msg").textContent = ok ? "Code appliqué : -10 %" : "Code promo invalide.";
  $("promo-msg").className = ok ? "ok" : "";
  afficherPanier();
};
$("checkout").onclick = () => { $("pay-msg").textContent = ""; $("pay").showModal(); };
$("cancel").onclick = () => $("pay").close();
$("confirm").onclick = () => {
  const err = Paiement.valider({ nom: $("name").value, carte: $("card").value, exp: $("exp").value, cvv: $("cvv").value });
  if (err) { $("pay-msg").textContent = err; return; }
  const ref = "CMD-" + Date.now().toString().slice(-6);
  $("receipt").textContent = `Merci ${$("name").value} ! Référence ${ref} – total payé : ${dt(panier.total())}.`;
  $("pay").close(); $("done").showModal();
  panier.vider(); afficherPanier();
};
$("ok").onclick = () => { $("done").close(); $("cart").hidden = true; };

afficherCatalogue(); afficherPanier();