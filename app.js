let page = "inicio";
let currentProfile = "director";
let stack = [];
let deferredPrompt = null;
const app = document.getElementById("app");
const navs = document.querySelectorAll(".nav");
const installBanner = document.getElementById("installBanner");
const save = (k,v)=>localStorage.setItem(k,JSON.stringify(v));
const load = (k,f)=>{try{return JSON.parse(localStorage.getItem(k)) ?? f}catch{return f}};
const wa = (n,msg)=>`https://wa.me/51${n}?text=${encodeURIComponent(msg)}`;
const photoSrc = (m)=>`assets/${m.foto}.jpg?v=15`;
const ADMIN_PIN = "2027";
function getReuniones(){
  const saved = load("reuniones_admin", null);
  return saved && Array.isArray(saved) && saved.length ? saved : REUNIONES;
}
function setReuniones(data){ save("reuniones_admin", data); }
function fechaHoraReunion(r){
  if(!r.fecha || !r.hora24) return null;
  const d = new Date(`${r.fecha}T${r.hora24}:00`);
  return isNaN(d.getTime()) ? null : d;
}
function formatFecha(r){
  const d = fechaHoraReunion(r);
  if(d) return d.toLocaleDateString("es-PE", {weekday:"long", day:"2-digit", month:"short"}) + " · " + r.hora24;
  return `${r.dia || ""} ${r.hora || ""}`.trim();
}
function requestNotifications(){
  if(!("Notification" in window)){ alert("Este navegador no permite notificaciones."); return; }
  Notification.requestPermission().then(()=>{ scheduleMeetingAlerts(); alert("Notificaciones revisadas. Si fueron aceptadas, la app podrá alertar antes de la reunión."); });
}
function scheduleMeetingAlerts(){
  if(!("Notification" in window) || Notification.permission !== "granted") return;
  const now = Date.now();
  getReuniones().forEach(r=>{
    const start = fechaHoraReunion(r);
    if(!start) return;
    [60,45,30,15].forEach(min=>{
      const when = start.getTime() - min*60*1000;
      const delay = when - now;
      const key = `alert_${r.id || r.titulo}_${min}_${r.fecha}_${r.hora24}`;
      if(delay > 0 && delay < 86400000 && !localStorage.getItem(key)){
        setTimeout(()=>{
          new Notification("Club Rotary Huaraz Colonial", {body:`${r.titulo}: inicia en ${min} minutos. ${r.lugar || ""}`, icon:"assets/icon-192.png"});
          localStorage.setItem(key,"sent");
        }, delay);
      }
    });
  });
}
window.addEventListener("beforeinstallprompt", e=>{e.preventDefault(); deferredPrompt=e; installBanner.classList.remove("hidden");});
document.getElementById("installNow").onclick = async ()=>{if(deferredPrompt){deferredPrompt.prompt(); deferredPrompt=null; installBanner.classList.add("hidden")}else alert("Android/Chrome: menú ⋮ > Instalar app. iPhone/Safari: Compartir > Agregar a pantalla de inicio.");};
document.getElementById("closeBanner").onclick = ()=>installBanner.classList.add("hidden");

function go(p, opts={}){ if(!opts.noStack && page!==p) stack.push({page,currentProfile}); page=p; if(opts.profile) currentProfile=opts.profile; render(); }
function back(){ const last=stack.pop(); if(last){ page=last.page; currentProfile=last.currentProfile; render(); } }
navs.forEach(n=>n.onclick=()=>{ stack=[]; page=n.dataset.page; render(); });

function tile(icon,label,target,gold=false){ return `<button class="tile ${gold?'gold-tile':''}" onclick="${target==='instalar'?'installApp()':`go('${target}')`}"><span class="ico">${icon}</span>${label}</button>`; }
function installApp(){ if(deferredPrompt){ document.getElementById("installNow").click(); } else { alert("Android/Chrome: menú ⋮ > Instalar app. iPhone/Safari: Compartir > Agregar a pantalla de inicio."); } }
function head(title){ return `<section class="screen-head"><div class="screen-row"><button class="back" onclick="back()">‹</button><div class="screen-title">${title}</div><div style="width:38px"></div></div></section>`; }

function home(){
  return `<section class="hero">
    <div class="hero-top"><div class="hero-time">9:41</div><div class="hero-bell">🔔</div></div>
    <div class="logo-card">
      <div class="logo-grid">
        <div class="logo-side">
          <img src="assets/logo_rotary_huaraz_colonial.png?v=15" alt="Club Rotary Huaraz Colonial">
        </div>
        <div class="president-card">
          <div class="president-badge">Presidencia</div>
          <div class="president-photo">
            <img src="assets/foto_p.jpg?v=15" alt="José Rafael Zeña Peche" onerror="this.remove(); this.parentElement.textContent='Presidente'">
          </div>
          <p class="president-name">José Rafael Zeña Peche</p>
          <p class="president-role">Presidente</p>
          <p class="president-period">Gestión 2026–2027</p>
        </div>
      </div>
      <div class="gold-wave"></div>
    </div>
    <h1>Club Rotary Huaraz Colonial</h1>
    <p>Directiva conectada <span class="gold">2026–2027</span></p>
  </section>
  <section class="grid">
    ${tile("👥","Directiva","directiva")}
    ${tile("📅","Reuniones","reuniones",true)}
    ${tile("📰","Publicaciones","comunidad")}
    ${tile("👤","Socios","socios")}
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
  <div class="info-strip"><span>ℹ️</span><span>Conecta a los socios, comparte publicaciones y recibe recordatorios.</span></div>`;
}

function directivaPage(){
  return `${head("Directiva 2026–2027")}<section class="page"><div class="list">
    ${DIRECTIVA.map(m=>`<button class="role-card ${m.id==='presidencia'?'active':''}" onclick="go('perfil',{profile:'${m.id}'})">
      <div class="mini-photo"><img src="${photoSrc(m)}" alt="${m.nombre}" onerror="this.remove(); this.parentElement.textContent='${m.item}'"></div>
      <div class="role"><p class="cargo">${m.cargo}</p><p class="nombre">${m.nombre}</p></div>
      <div class="chev">›</div>
    </button>`).join("")}
  </div></section>`;
}

function perfilPage(){
  const m = DIRECTIVA.find(x=>x.id===currentProfile) || DIRECTIVA[0];
  return `<section class="profile-hero"><div class="profile-nav"><button class="back" onclick="back()">‹</button><div class="dots">•••</div></div></section>
  <section class="profile-card">
    <div class="photo"><img src="${photoSrc(m)}" alt="${m.nombre}" onerror="this.remove(); this.parentElement.textContent='${m.foto}'"></div>
    <h2>${m.nombre}</h2>
    <p>${m.cargo}</p>
    <div class="rotary-mini"></div>
  </section>
  <div class="actions">
    <a class="btn green" href="${wa(m.celular,'Hola ' + m.nombre + ', soy socio del Club Rotary Huaraz Colonial.')}" target="_blank">🟢 WhatsApp</a>
    <button class="btn blue" onclick="go('reuniones')">📅 Ver agenda</button>
  </div>
  <section class="panel"><h3>Reseña</h3><p>${m.resena}</p></section>
  <section class="panel"><h3>Funciones</h3><ul>${m.funciones.map(x=>`<li>${x}</li>`).join("")}</ul></section>
  <section class="panel"><h3>Metas</h3><ul>${m.metas.map(x=>`<li>${x}</li>`).join("")}</ul></section>`;
}

function reunionesPage(){
  const reuniones = getReuniones();
  return `${head("Reuniones")}<section class="page"><div class="list">
    ${reuniones.map((r,i)=>`<div class="meeting-card"><div class="micon">${i===0?'📅':i===1?'👥':'📣'}</div><div class="meeting"><h3>${r.titulo}</h3><p>${r.descripcion || ""}</p><p class="time">${formatFecha(r)}</p><p>📍 ${r.lugar || ""}</p></div><div class="chev">›</div></div>`).join("")}
  </div></section>
  <div class="actions">
    <button class="btn blue" onclick="confirmar('Confirmado')">✓ Confirmar asistencia</button>
    <button class="btn red" onclick="confirmar('No asistirá')">✕ No asistiré</button>
  </div>
  <div class="field"><button class="btn light" style="width:100%" onclick="go('admin')">⚙️ Administrar reuniones</button></div>
  <div class="panel"><h3>Comentarios</h3><textarea id="comentarioReunion" maxlength="300" placeholder="Escribe un comentario (opcional)..."></textarea><button class="btn gold" style="width:100%;margin-top:10px" onclick="guardarComentarioReunion()">Enviar comentario</button></div>
  <div class="reminder"><span>🔔</span><span>Alertas: 1 hora antes y luego cada 15 minutos antes de la reunión. Deben estar activadas las notificaciones.</span></div>`;
}
function confirmar(estado){ const data=load('asistencias',[]); data.push({estado,reunion:REUNIONES[0].titulo,fecha:new Date().toLocaleString('es-PE')}); save('asistencias',data); alert('Registro guardado: '+estado); }
function guardarComentarioReunion(){ const t=document.getElementById('comentarioReunion').value.trim(); if(!t){alert('Escriba un comentario.');return} const c=load('comentarios',[]); c.push({tipo:'Reunión',texto:t,fecha:new Date().toLocaleString('es-PE')}); save('comentarios',c); alert('Comentario registrado.'); }

function comunidadPage(){
  return `${head("Comunidad")}<section class="page">
    <div class="post-card">
      <div class="post-head"><div class="avatar"><img src="assets/logo_rotary_huaraz_colonial.png?v=15" alt=""></div><div><h3>Club Rotary Huaraz Colonial</h3><p>Hoy · 10:30 a. m.</p></div></div>
      <p class="post-text"><strong>Unidos para transformar vidas</strong><br>Así vivimos nuestra jornada de servicio en beneficio de la comunidad de Huaraz.</p>
      <img class="official-photo" src="assets/foto_oficial.jpg?v=15" alt="Foto oficial">
      <div class="reactions"><span>❤️ 24</span><span>💬 5 comentarios</span></div>
    </div>
    <h3 class="section-title">Accesos y conexiones</h3>
    <div class="list">
      ${linkCard("👥","Lista de socios","Directiva y socios del club","javascript:go('socios')")}
      ${linkCard("⚙️","Administrar reuniones","Actualizar fecha, hora y lugar","javascript:go('admin')")}
      ${linkCard("⬇️","Instalar aplicación","Descarga la app en tu dispositivo","javascript:installApp()")}
      ${linkCard("🌐","Web oficial","energeticos2023.github.io/CLUBROTARYHUARAZCOLONIAL",LINKS.web)}
      ${linkCard("f","Facebook","facebook.com/profile.php?id=61578558107674",LINKS.facebook)}
      ${linkCard("🎵","TikTok","@club.rotary.huara",LINKS.tiktok)}
      ${linkCard("⚙️","MyRotary","my.rotary.org/es",LINKS.myrotary)}
    </div>
  </section>
  <div class="reminder"><span>🔔</span><span>Recordatorios de reuniones y eventos del club.</span></div>`;
}
function linkCard(icon,title,sub,url){ const target=url.startsWith('javascript')?'':' target="_blank"'; return `<a class="link-card" href="${url}"${target}><div class="licon">${icon}</div><div><h3>${title}</h3><p>${sub}</p></div><div class="chev">›</div></a>`; }

function comentariosPage(){
  const comments = load('comentarios',[]);
  return `${head("Comentarios")}<section class="page">
    <div class="panel" style="margin:0">
      <textarea id="nuevoComentario" placeholder="Escriba su comentario para el club..."></textarea>
      <button class="btn blue" style="width:100%;margin-top:10px" onclick="guardarComentarioGeneral()">Publicar comentario</button>
    </div>
    <div class="list" style="margin-top:12px">
      ${comments.length ? comments.slice().reverse().map(c=>`<div class="post-card"><strong>${c.tipo || 'Socio'}</strong><p>${c.texto}</p><small>${c.fecha}</small></div>`).join('') : '<div class="panel"><p>Aún no hay comentarios registrados.</p></div>'}
    </div>
  </section>`;
}
function guardarComentarioGeneral(){ const t=document.getElementById('nuevoComentario').value.trim(); if(!t){alert('Escriba un comentario.');return} const c=load('comentarios',[]); c.push({tipo:'Comentario de socio',texto:t,fecha:new Date().toLocaleString('es-PE')}); save('comentarios',c); render(); }

function metasPage(){
  return `${head("Metas 2026–2027")}<section class="page"><div class="list">${METAS.map((m,i)=>`<div class="goal-card"><div class="num">${i+1}</div><p>${m}</p></div>`).join('')}</div></section>`;
}


function sociosPage(){
  return `${head("Socios")}<section class="page">
    <div class="list">
      ${DIRECTIVA.map(m=>`<div class="role-card" onclick="go('perfil',{profile:'${m.id}'})">
        <div class="mini-photo"><img src="${photoSrc(m)}" alt="${m.nombre}" onerror="this.remove(); this.parentElement.textContent='${m.item}'"></div>
        <div class="role"><p class="cargo">${m.cargo}</p><p class="nombre">${m.nombre}</p><p style="margin:6px 0 0;color:#66778E;font-size:12px">Cel. ${m.celular}</p></div>
        <div class="chev">›</div>
      </div>`).join("")}
    </div>
    <div class="reminder" style="margin:14px 0 0"><span>ℹ️</span><span>Esta lista puede ampliarse con todos los socios del club cuando se carguen nombres, celulares y correos.</span></div>
  </section>`;
}

function adminPage(){
  const unlocked = sessionStorage.getItem("admin_ok") === "1";
  if(!unlocked){
    return `${head("Administrar reuniones")}<section class="page">
      <div class="panel" style="margin:0">
        <h3>Acceso del administrador</h3>
        <p>Ingrese el PIN para actualizar reuniones en este dispositivo.</p>
        <input id="adminPin" type="password" placeholder="PIN administrador" style="margin-top:12px">
        <button class="btn blue" style="width:100%;margin-top:12px" onclick="validarAdmin()">Ingresar</button>
      </div>
      <div class="reminder" style="margin:14px 0 0"><span>⚠️</span><span>Para que tus cambios se vean en todos los celulares, debemos conectar Firebase o Google Sheets.</span></div>
    </section>`;
  }
  const reuniones = getReuniones();
  return `${head("Administrar reuniones")}<section class="page">
    <div class="panel" style="margin:0">
      <h3>Nueva reunión</h3>
      <input id="admTitulo" placeholder="Título de reunión" style="margin-top:8px">
      <input id="admDesc" placeholder="Descripción" style="margin-top:8px">
      <input id="admFecha" type="date" style="margin-top:8px">
      <input id="admHora" type="time" style="margin-top:8px">
      <input id="admLugar" placeholder="Lugar" style="margin-top:8px">
      <button class="btn gold" style="width:100%;margin-top:12px" onclick="guardarReunionAdmin()">Guardar reunión</button>
    </div>
    <h3 style="margin:18px 0 12px;color:var(--blue-dark)">Reuniones cargadas</h3>
    <div class="list">${reuniones.map((r,i)=>`<div class="meeting-card"><div class="micon">📅</div><div class="meeting"><h3>${r.titulo}</h3><p>${formatFecha(r)}</p><p>${r.lugar || ""}</p></div><button class="back" style="background:#fff;color:#D83E3E;border:1px solid #f0b1b1" onclick="eliminarReunionAdmin(${i})">×</button></div>`).join("")}</div>
    <button class="btn light" style="width:100%;margin-top:14px" onclick="restaurarReuniones()">Restaurar reuniones base</button>
  </section>`;
}
function validarAdmin(){
  const pin = document.getElementById("adminPin").value.trim();
  if(pin === ADMIN_PIN){ sessionStorage.setItem("admin_ok","1"); render(); }
  else alert("PIN incorrecto.");
}
function guardarReunionAdmin(){
  const titulo = document.getElementById("admTitulo").value.trim();
  const descripcion = document.getElementById("admDesc").value.trim();
  const fecha = document.getElementById("admFecha").value;
  const hora24 = document.getElementById("admHora").value;
  const lugar = document.getElementById("admLugar").value.trim();
  if(!titulo || !fecha || !hora24){ alert("Ingrese título, fecha y hora."); return; }
  const reuniones = getReuniones();
  reuniones.push({id:"adm_"+Date.now(), titulo, descripcion, fecha, hora24, hora:hora24, dia:"", lugar});
  setReuniones(reuniones);
  scheduleMeetingAlerts();
  alert("Reunión guardada.");
  render();
}
function eliminarReunionAdmin(i){
  const reuniones = getReuniones();
  reuniones.splice(i,1);
  setReuniones(reuniones);
  render();
}
function restaurarReuniones(){
  localStorage.removeItem("reuniones_admin");
  render();
}
function updateNav(){ navs.forEach(n=>n.classList.toggle('active', n.dataset.page===page || (page==='perfil'&&n.dataset.page==='directiva') || (['comentarios','metas'].includes(page)&&n.dataset.page==='comunidad'))); }
function render(){ updateNav(); const pages={inicio:home,directiva:directivaPage,perfil:perfilPage,reuniones:reunionesPage,comunidad:comunidadPage,comentarios:comentariosPage,metas:metasPage,socios:sociosPage,admin:adminPage}; app.innerHTML=(pages[page]||home)(); }
render();
if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js?v=15').catch(()=>{}); }
