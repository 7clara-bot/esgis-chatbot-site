// ===== CONFIG =====
const API_URL = "https://esgis-chatbot-backend.onrender.com";
const FALLBACK = "Désolé, je n'arrive pas à répondre. Contactez le secrétariat au +229 21 32 47 73 ou esgis.benin@esgis.org.";
const $ = id => document.getElementById(id);

// ===== FAQ : catégories, accordéon, recherche =====
const CATS = ["Toutes", ...new Set(FAQ.map(f => f.c))];
let cat = "Toutes";

function renderFaq() {
  const t = $("search").value.trim().toLowerCase();
  const items = FAQ.filter(f => (cat === "Toutes" || f.c === cat) && (f.q + " " + f.a).toLowerCase().includes(t));
  $("faq-list").innerHTML = "";
  items.forEach(f => {
    const item = document.createElement("div"); item.className = "item";
    const b = document.createElement("button"); b.className = "q"; b.setAttribute("aria-expanded", "false");
    const s = document.createElement("span"); s.textContent = f.q;
    const ico = document.createElement("i"); ico.textContent = "+";
    b.append(s, ico);
    const a = document.createElement("div"); a.className = "a"; a.textContent = f.a;
    b.onclick = () => {
      const open = item.classList.toggle("open");
      b.setAttribute("aria-expanded", open); ico.textContent = open ? "−" : "+";
    };
    item.append(b, a); $("faq-list").append(item);
  });
  $("no-result").hidden = items.length > 0;
}
CATS.forEach(c => {
  const b = document.createElement("button");
  b.className = "chip" + (c === cat ? " on" : ""); b.textContent = c;
  b.onclick = () => { cat = c; [...$("categories").children].forEach(x => x.classList.toggle("on", x === b)); renderFaq(); };
  $("categories").append(b);
});
$("search").oninput = renderFaq;
renderFaq();

// ===== CHAT =====
let history = [];
const toggle = open => { $("chat-window").hidden = !open; if (open) $("chat-input").focus(); };
$("chat-button").onclick = () => toggle($("chat-window").hidden);
$("open-chat").onclick = () => toggle(true);
$("chat-close").onclick = () => toggle(false);

function addMsg(text, who) {
  const m = document.createElement("div"); m.className = "m " + who; m.textContent = text; // textContent : pas d'injection HTML
  $("messages").append(m); $("messages").scrollTop = $("messages").scrollHeight; return m;
}
function welcome() {
  $("messages").innerHTML = ""; history = [];
  addMsg("Bonjour, je suis l'assistant de l'ESGIS Bénin. Comment puis-je vous aider ?", "bot");
  const box = document.createElement("div"); box.className = "sugs";
  ["Quelles filières proposez-vous ?", "Quels sont les frais de scolarité ?", "Quelles pièces fournir pour s'inscrire ?", "Où se trouve l'école ?"].forEach(t => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = t;
    b.onclick = () => { box.remove(); send(t); }; box.append(b);
  });
  $("messages").append(box);
}
$("chat-reset").onclick = welcome;

// Seul endroit qui parle au serveur
async function askBot(history) {
  const r = await fetch(API_URL + "/api/chat", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: history })
  });
  if (!r.ok) throw new Error("Erreur " + r.status);
  return (await r.json()).reply;
}

async function send(text) {
  addMsg(text, "user"); history.push({ role: "user", content: text });
  const local = FAQ.find(f => f.q === text); // question de la FAQ : réponse locale, sans appel à l'IA
  if (local) { addMsg(local.a, "bot"); history.push({ role: "assistant", content: local.a }); return; }
  const wait = addMsg("L'assistant écrit…", "bot");
  try {
    const reply = await askBot(history);
    wait.textContent = reply; history.push({ role: "assistant", content: reply });
  } catch (e) { wait.textContent = FALLBACK; }
  $("messages").scrollTop = $("messages").scrollHeight;
}
$("chat-form").onsubmit = e => { e.preventDefault(); const t = $("chat-input").value.trim(); if (t) { $("chat-input").value = ""; send(t); } };
welcome();
