let page = "inicio";
let currentProfile = "presidencia";
let stack = [];
let deferredPrompt = null;

const app = document.getElementById("app");
const topTitle = document.getElementById("topTitle");
const backBtn = document.getElementById("backBtn");
const navs = document.querySelectorAll(".nav");
const installBanner = document.getElementById("installBanner");

const save = (k,v)=>localStorage.setItem(k,JSON.stringify(v));
const load = (k,f)=>{try{return JSON.parse(localStorage.getItem(k)) ?? f}catch{return f}};
const wa = (n,msg)=>`https://wa.me/51${n}?text=${encodeURIComponent(msg)}`;
const photoSrc = (m)=>`assets/${m.foto}.jpg?v=4`;

window.addEventListener("beforeinstallprompt", (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  installBanner.classList.remove("hidden");
});
document.getElementById("installNow").onclick = async ()=>{
  if(deferredPrompt){deferredPrompt.prompt(); deferredPrompt = null; installBanner.classList.add("hidden");}
  else alert("En Android/Chrome: menú ⋮ > Instalar app o Agregar a pantalla principal. En iPhone/Safari: Compartir > Agregar a pantalla de inicio.");
};
document.getElementById("closeBanner").onclick=()=>installBanner.classList.add("hidden");
document.getElementById("bellBtn").onclick=async()=>{
  if(!("Notification" in window)){alert("Este navegador no soporta notificaciones.");return}
  const p = await Notification.requestPermission();
  if(p==="granted") new Notification("Club Rotary Huaraz Colonial",{body:"Notificaciones activadas para reuniones y publicaciones.", icon:"assets/icon-192.png"});
};

function go(p, opts={}){
  if(!opts.noStack && page!==p) stack.push({page,currentProfile});
  page=p;
  if(opts.profile) currentProfile = opts.profile;
  render();
}
function back(){ const last = stack.pop(); if(last){ page=last.page; currentProfile=last.currentProfile; render(); } }
backBtn.onclick = back;
navs.forEach(n=>n.onclick=()=>{stack=[]; page=n.dataset.page; render();});

function home(){
  return `
  <section class="hero">
    <div class="logo-box"><img src="assets/logo_rotary_huaraz_colonial.png?v=4" alt="Club Rotary Huaraz Colonial"></div>
    <h1>Club Rotary Huaraz Colonial</h1>
    <p>Directiva conectada <span class="gold">2026–2027</span></p>
  </section>
  <section class="grid">
    ${tile("👥","Directiva","directiva")}
    ${tile("📅","Reuniones","reuniones",true)}
    ${tile("📣","Publicaciones","comunidad")}
    ${tile("💬","Comentarios","comentarios")}
    ${tile("🎯","Metas 2026–2027","metas")}
    ${tile("⬇️","Instalar app","instalar")}
  </section>
  <h3 class="section-title">Accesos oficiales</h3>
  <section class="quick-links">
    <a class="small-link" href="${LINKS.web}" target="_blank"><span class="ico">🌐</span>Web oficial</a>
    <a class="small-link" href="${LINKS.facebook}" target="_blank"><span class="ico">f</span>Facebook</a>
    <a class="small-link" href="${LINKS.tiktok}" target="_blank"><span class="ico">🎵</span>TikTok</a>
    <a class="small-link" href="${LINKS.myrotary}" target="_blank"><span class="ico">⚙️</span>MyRotary</a>
  </section>
  <a class="whatsapp" href="${LINKS.whatsapp}" target="_blank">🟢 WhatsApp del club</a>
  <div class="info-strip"><span>ℹ️</span><span>Comparte información entre socios y recibe recordatorios importantes.</span></div>`;
}
function tile(icon,label,target,gold=false){
  return `<button class="tile ${gold?'gold-tile':''}" onclick="${target==='instalar'?'installApp()':`go('${target}')`}"><span class="ico">${icon}</span>${label}</button>`;
}
function installApp(){
  if(deferredPrompt){ document.getElementById("installNow").click(); }
  else alert("Para instalar: Android/Chrome > menú ⋮ > Instalar app. iPhone/Safari > Compartir > Agregar a pantalla de inicio.");
}

function directivaPage(){
  return `<section class="page"><h2>Directiva 2026–2027</h2><p class="subtitle">Ingrese a cada cargo para ver reseña, funciones, metas, agenda y WhatsApp.</p><div class="list">
  ${DIRECTIVA.map(m=>`<button class="role-card ${m.id==='presidencia'?'active':''}" onclick="go('perfil',{profile:'${m.id}'})">
    <div class="mini-photo"><img src="${photoSrc(m)}" alt="${m.nombre}" onerror="this.remove(); this.parentElement.textContent='${m.item}'"></div>
    <div class="role"><h3>${m.cargo}</h3><p>${m.nombre}</p></div><div class="chev">›</div>
  </button>`).join("")}
  </div></section>`;
}

function perfilPage(){
  const m = DIRECTIVA.find(x=>x.id===currentProfile) || DIRECTIVA[0];
  return `<section class="page">
    <div class="profile-card">
      <div class="photo"><img src="${photoSrc(m)}" alt="${m.nombre}" onerror="this.remove(); this.parentElement.textContent='${m.foto}'"></div>
      <h2>${m.nombre}</h2><p>${m.cargo}</p><div class="rotary-mini"></div>
    </div>
    <div class="actions">
      <a class="btn green" href="${wa(m.celular,'Hola ' + m.nombre + ', soy socio del Club Rotary Huaraz Colonial.')}" target="_blank">🟢 WhatsApp</a>
      <button class="btn blue" onclick="go('reuniones')">📅 Ver agenda</button>
    </div>
    <div class="panel"><h3>Reseña</h3><p>${m.resena}</p></div>
    <div class="panel"><h3>Funciones</h3><ul>${m.funciones.map(x=>`<li>${x}</li>`).join("")}</ul></div>
    <div class="panel"><h3>Metas</h3><ul>${m.metas.map(x=>`<li>${x}</li>`).join("")}</ul></div>
    <div class="panel"><h3>Agenda</h3><p>Supervisa reuniones, actividades y eventos clave del club para el periodo 2026–2027.</p></div>
  </section>`;
}

function reunionesPage(){
  return `<section class="page"><h2>Reuniones</h2><p class="subtitle">Reuniones programadas</p><div class="list">
    ${REUNIONES.map((r,i)=>`<div class="meeting-card"><div class="micon">${i==0?'📅':i==1?'👥':'📣'}</div><div class="meeting"><h3>${r.titulo}</h3><p>${r.descripcion}</p><p class="time">${r.dia} ${r.hora}</p><p>📍 ${r.lugar}</p></div><div class="chev">›</div></div>`).join("")}
  </div>
  <div class="field"><button class="btn blue" style="width:100%" onclick="confirmar('Confirmado')">✓ Confirmar asistencia</button></div>
  <div class="field"><button class="btn red" style="width:100%" onclick="confirmar('No asistirá')">✕ No asistiré</button></div>
  <div class="field"><button class="btn light" style="width:100%" onclick="alert('En la versión publicada se podrá integrar con Google Calendar.')">📅 Agregar a calendario</button></div>
  <div class="panel"><h3>Comentarios</h3><textarea id="comentarioReunion" maxlength="300" placeholder="Escribe un comentario (opcional)..."></textarea><div class="counter">0/300</div><button class="btn gold" style="width:100%;margin-top:10px" onclick="guardarComentarioReunion()">Enviar comentario</button></div>
  <div class="reminder"><span>🔔</span><span>Te enviaremos recordatorios antes de cada reunión programada.</span></div>
  </section>`;
}
function confirmar(estado){
  const data = load("asistencias", []);
  data.push({estado, reunion:REUNIONES[0].titulo, fecha:new Date().toLocaleString("es-PE")});
  save("asistencias", data);
  alert("Registro guardado: " + estado);
}
function guardarComentarioReunion(){
  const t = document.getElementById("comentarioReunion").value.trim();
  if(!t){alert("Escriba un comentario.");return}
  const c = load("comentarios", []);
  c.push({tipo:"Reunión", texto:t, fecha:new Date().toLocaleString("es-PE")});
  save("comentarios", c);
  alert("Comentario registrado.");
}
function comunidadPage(){
  return `<section class="page"><h2>Comunidad</h2>
    <div class="post-card">
      <div class="post-head"><div class="avatar"><img src="assets/foto_i.jpg?v=4" onerror="this.remove(); this.parentElement.textContent='LF'"></div><div><h3>Lourdes M. Foronda Valverde</h3><p>Comité de Imagen Pública · Hace 2 horas</p></div></div>
      <p class="post-text">¡Gracias a todos los socios por su apoyo incondicional en nuestras últimas actividades! Seguimos trabajando juntos por una comunidad más solidaria. 💙💛</p>
      <img class="official-photo" src="assets/foto_oficial.jpg?v=4" alt="Foto oficial del club">
      <div class="reactions"><span>👍 24</span><span>💬 8 comentarios</span></div>
    </div>
    <h3 class="section-title" style="margin:16px 0 10px">Accesos y conexiones</h3>
    <div class="list">
      ${linkCard("⬇️","Instalar aplicación","Descarga la app en tu dispositivo","javascript:installApp()")}
      ${linkCard("🌐","Web oficial","energeticos2023.github.io/CLUBROTARYHUARAZCOLONIAL",LINKS.web)}
      ${linkCard("f","Facebook","facebook.com/profile.php?id=61578558107674",LINKS.facebook)}
      ${linkCard("🎵","TikTok","@club.rotary.huara",LINKS.tiktok)}
      ${linkCard("⚙️","MyRotary","my.rotary.org/es",LINKS.myrotary)}
    </div>
    <div class="reminder" style="margin:14px 0 0"><span>🔔</span><span>Recordatorios automáticos de reuniones. Activa notificaciones y mantente al día.</span></div>
  </section>`;
}
function linkCard(icon,title,sub,url){
  const target = url.startsWith("javascript") ? "" : ' target="_blank"';
  return `<a class="link-card" href="${url}"${target}><div class="licon">${icon}</div><div><h3>${title}</h3><p>${sub}</p></div><div class="chev">›</div></a>`;
}
function comentariosPage(){
  const comments = load("comentarios", []);
  return `<section class="page"><h2>Comentarios</h2><p class="subtitle">Opiniones, sugerencias y mensajes entre socios.</p>
    <div class="panel"><textarea id="nuevoComentario" placeholder="Escriba su comentario para el club..."></textarea><button class="btn blue" style="width:100%;margin-top:10px" onclick="guardarComentarioGeneral()">Publicar comentario</button></div>
    <div class="list" style="margin-top:12px">${comments.length ? comments.slice().reverse().map(c=>`<div class="post-card"><strong>${c.tipo || 'Socio'}</strong><p>${c.texto}</p><small>${c.fecha}</small></div>`).join("") : '<div class="panel"><p>Aún no hay comentarios registrados.</p></div>'}</div>
  </section>`;
}
function guardarComentarioGeneral(){
  const t = document.getElementById("nuevoComentario").value.trim();
  if(!t){alert("Escriba un comentario.");return}
  const c = load("comentarios", []);
  c.push({tipo:"Comentario de socio", texto:t, fecha:new Date().toLocaleString("es-PE")});
  save("comentarios", c);
  render();
}
function metasPage(){
  return `<section class="page"><h2>Metas 2026–2027</h2><p class="subtitle">Objetivos generales del año rotario.</p><div class="list">${METAS.map((m,i)=>`<div class="goal-card"><div class="num">${i+1}</div><p>${m}</p></div>`).join("")}</div></section>`;
}
function updateUI(){
  const titles = {inicio:"Club Rotary Huaraz Colonial",directiva:"Directiva 2026–2027",perfil:"Perfil de directivo",reuniones:"Reuniones",comunidad:"Comunidad",comentarios:"Comentarios",metas:"Metas 2026–2027"};
  topTitle.textContent = titles[page] || "Club Rotary Huaraz Colonial";
  backBtn.classList.toggle("hidden", stack.length===0 || page==="inicio");
  navs.forEach(n=>n.classList.toggle("active", n.dataset.page===page || (page==="perfil" && n.dataset.page==="directiva") || (page==="comentarios" && n.dataset.page==="comunidad") || (page==="metas" && n.dataset.page==="comunidad")));
}
function render(){
  updateUI();
  const pages = {inicio:home, directiva:directivaPage, perfil:perfilPage, reuniones:reunionesPage, comunidad:comunidadPage, comentarios:comentariosPage, metas:metasPage};
  app.innerHTML = (pages[page] || home)();
}
render();
if("serviceWorker" in navigator){navigator.serviceWorker.register("./sw.js?v=4").catch(()=>{});}
