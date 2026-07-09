let page = "inicio";
let currentProfile = "presidencia";
let stack = [];
let deferredPrompt = null;

const app = document.getElementById("app");
const navs = document.querySelectorAll(".nav");
const installBanner = document.getElementById("installBanner");

const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } };

const ADMIN_PIN = "2027";
const wa = (n, msg) => `https://wa.me/51${n}?text=${encodeURIComponent(msg)}`;
const photoSrc = (m) => `assets/${m.foto}.jpg?v=21`;

function isIOS(){ return /iphone|ipad|ipod/i.test(navigator.userAgent); }
function isStandalone(){ return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; }
function installInstructions(){
  if(isStandalone()){ alert("La aplicación ya está instalada en este dispositivo."); return; }
  if(isIOS()){
    alert("Para instalar en iPhone:\n\n1. Abre este enlace en Safari.\n2. Toca Compartir.\n3. Elige Agregar a pantalla de inicio.\n4. Presiona Agregar.");
  } else {
    if(deferredPrompt){ document.getElementById("installNow").click(); }
    else alert("Para instalar en Android:\n\n1. Abre este enlace en Chrome.\n2. Toca menú ⋮.\n3. Elige Instalar app o Agregar a pantalla principal.");
  }
}
function installApp(){ installInstructions(); }

function go(p, opts = {}) {
  if (!opts.noStack && page !== p) stack.push({ page, currentProfile });
  page = p;
  if (opts.profile) currentProfile = opts.profile;
  render();
  window.scrollTo({top:0, behavior:"smooth"});
}
function back() {
  const last = stack.pop();
  if (last) { page = last.page; currentProfile = last.currentProfile; }
  else { page = "inicio"; }
  render();
}
navs.forEach(n => n.onclick = () => { stack = []; page = n.dataset.page; render(); window.scrollTo({top:0, behavior:"smooth"}); });

function getReuniones() {
  const saved = load("reuniones_admin", null);
  return Array.isArray(saved) && saved.length ? saved : REUNIONES;
}
function setReuniones(data) { save("reuniones_admin", data); }
function fechaHoraReunion(r) {
  if (!r.fecha || !r.hora24) return null;
  const d = new Date(`${r.fecha}T${r.hora24}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
function formatFecha(r) { return `${r.fechaTexto || ""} · ${r.dia || ""} · ${r.hora || r.hora24 || ""}`; }
function proximasReuniones() {
  const now = Date.now();
  return getReuniones().filter(r => { const d = fechaHoraReunion(r); return d && d.getTime() >= now; })
    .sort((a,b) => fechaHoraReunion(a) - fechaHoraReunion(b));
}
function scheduleMeetingAlerts() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const now = Date.now();
  getReuniones().forEach(r => {
    const start = fechaHoraReunion(r);
    if (!start) return;
    [60,45,30,15].forEach(min => {
      const delay = start.getTime() - min * 60000 - now;
      const key = `alert_${r.id}_${min}_${r.fecha}_${r.hora24}`;
      if (delay > 0 && delay < 86400000 && !localStorage.getItem(key)) {
        setTimeout(() => {
          new Notification("Club Rotary Huaraz Colonial", {
            body: `${r.titulo}: inicia en ${min} minutos. ${r.lugar || ""}`,
            icon: "assets/icon-192.png"
          });
          localStorage.setItem(key, "sent");
        }, delay);
      }
    });
  });
}
function requestNotifications() {
  if (!("Notification" in window)) { alert("Este navegador no permite notificaciones."); return; }
  Notification.requestPermission().then(p => {
    if (p === "granted") { scheduleMeetingAlerts(); alert("Notificaciones activadas."); }
    else alert("No se activaron las notificaciones.");
  });
}

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault(); deferredPrompt = e; installBanner.classList.remove("hidden");
});
document.getElementById("installNow").onclick = async () => {
  if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; installBanner.classList.add("hidden"); }
  else installInstructions();
};
document.getElementById("closeBanner").onclick = () => installBanner.classList.add("hidden");

function tile(icon, label, target, gold=false) {
  const alertClass = target === "reuniones" ? " meeting-alert" : "";
  return `<button class="tile ${gold ? "gold-tile" : ""}${alertClass}" onclick="${target === "instalar" ? "installApp()" : `go('${target}')`}"><span class="ico">${icon}</span>${label}</button>`;
}
function head(title) {
  return `<section class="screen-head"><div class="screen-row"><button class="back" onclick="back()">‹</button><div class="screen-title">${title}</div><div style="width:38px"></div></div></section>`;
}


function cleanPhone(n){ return String(n || "").replace(/\D/g,"").replace(/^51/,""); }
function waSocio(s, msg){ return `https://wa.me/51${cleanPhone(s.celular)}?text=${encodeURIComponent(msg)}`; }
function todayMMDD(){
  const d = new Date();
  return String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}
function socioMMDD(s){
  const parts = String(s.cumple || "").split("-");
  return parts.length === 3 ? parts[1] + "-" + parts[2] : "";
}
function cumpleHoy(){
  const today = todayMMDD();
  return SOCIOS.filter(s => socioMMDD(s) === today);
}
function proximosCumples(limit = 6){
  const now = new Date();
  const currentYear = now.getFullYear();
  return SOCIOS.map(s => {
    const parts = String(s.cumple || "").split("-");
    if(parts.length !== 3) return null;
    let d = new Date(`${currentYear}-${parts[1]}-${parts[2]}T08:00:00`);
    if(d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) d = new Date(`${currentYear+1}-${parts[1]}-${parts[2]}T08:00:00`);
    return {...s, nextDate:d, dias:Math.ceil((d - now) / 86400000)};
  }).filter(Boolean).sort((a,b)=>a.nextDate-b.nextDate).slice(0, limit);
}
function mensajeCumpleSocio(s){
  return `Estimado/a ${s.nombre}, el Club Rotary Huaraz Colonial te saluda con mucho aprecio en el día de tu cumpleaños. Que este nuevo año de vida llegue con salud, alegría, unión familiar y renovado compromiso de servicio. ¡Feliz cumpleaños!`;
}
function mensajeImagenCumple(s){
  return `Estimada Lourdes, hoy es cumpleaños de nuestro/a socio/a ${s.nombre}. Por favor coordinar la felicitación en el grupo institucional y redes sociales del Club Rotary Huaraz Colonial. Fecha de cumpleaños: ${s.cumpleTexto}.`;
}
function scheduleBirthdayAlerts(){
  const hoy = cumpleHoy();
  if(hoy.length && !localStorage.getItem("cumple_alert_" + new Date().toDateString())){
    setTimeout(()=> {
      const nombres = hoy.map(s=>s.nombre).join(", ");
      alert("🎂 Hoy cumple años: " + nombres + ". Recuerda felicitar y avisar a Imagen Pública.");
      localStorage.setItem("cumple_alert_" + new Date().toDateString(), "1");
    }, 900);
  }
}

function home() {
  const prox = proximasReuniones()[0] || getReuniones()[0];
  return `<section class="hero">
    <div class="hero-top"><div class="hero-time">9:41</div><div class="hero-bell">🔔</div></div>
    <div class="logo-card">
      <div class="logo-grid">
        <div class="logo-side"><img src="assets/logo_rotary_huaraz_colonial.png?v=21" alt="Club Rotary Huaraz Colonial"></div>
        <div class="president-card">
          <div class="president-badge">Presidencia</div>
          <div class="president-photo"><img src="assets/foto_p.jpg?v=21" alt="José Rafael Zeña Peche" onerror="this.remove(); this.parentElement.textContent='Presidente'"></div>
          <p class="president-name">José Rafael Zeña Peche</p>
          <p class="president-role">Presidente</p>
          <p class="president-period">Gestión 2026–2027</p>
        </div>
      </div>
    </div>
    <h1>Club Rotary Huaraz Colonial</h1>
    <p>Aplicación institucional <span class="gold">2026–2027</span></p>
  </section>
  <section class="next-card" onclick="go('reuniones')">
    <div class="urgent-icon">🔔</div>
    <div><strong>Atención: reuniones del club</strong><span>${prox ? `${prox.tipo} · ${formatFecha(prox)}` : "Revisa el cronograma institucional."}</span></div>
    <button>Ver</button>
  </section>

  ${cumpleHoy().length ? `<section class="next-card birthday-card" onclick="go('cumpleanos')">
    <div class="urgent-icon">🎂</div>
    <div><strong>Cumpleaños de hoy</strong><span>${cumpleHoy().map(s=>s.nombre).join(", ")}</span></div>
    <button>Felicitar</button>
  </section>` : `<section class="next-card birthday-card" onclick="go('cumpleanos')">
    <div class="urgent-icon">🎂</div>
    <div><strong>Próximos cumpleaños</strong><span>${proximosCumples(1)[0] ? proximosCumples(1)[0].nombre + " · " + proximosCumples(1)[0].cumpleTexto : "Revisar calendario"}</span></div>
    <button>Ver</button>
  </section>`}

  <section class="grid">
    ${tile("📅","Cronograma","reuniones",true)}
    ${tile("🏅","Cambio de Mazo","cambio")}
    ${tile("🎂","Cumpleaños","cumpleanos")}
    ${tile("👥","Directiva","directiva")}
    ${tile("👤","Socios","socios")}
    ${tile("⬇️","Instalar app","instalar")}
  </section>
  <h3 class="section-title">Accesos oficiales</h3>
  <section class="quick-links">
    <a class="small-link" href="${LINKS.web}" target="_blank"><span class="ico">🌐</span>Web oficial</a>
    <a class="small-link" href="${LINKS.facebook}" target="_blank"><span class="ico">f</span>Facebook</a>
    <a class="small-link" href="${LINKS.tiktok}" target="_blank"><span class="ico">🎵</span>TikTok</a>
    <a class="small-link" href="${LINKS.myrotary}" target="_blank"><span class="ico">⚙️</span>MyRotary</a>
  </section>
  <a class="whatsapp" href="${LINKS.whatsapp}" target="_blank">🟢 WhatsApp del grupo de socios</a>`;
}

function directivaPage() {
  return `${head("Directiva 2026–2027")}<section class="page"><div class="list">
  ${DIRECTIVA.map(m => `<button class="role-card ${m.id === "presidencia" ? "active" : ""}" onclick="go('perfil',{profile:'${m.id}'})">
    <div class="mini-photo"><img src="${photoSrc(m)}" alt="${m.nombre}" onerror="this.remove(); this.parentElement.textContent='${m.item}'"></div>
    <div class="role"><p class="cargo">${m.cargo}</p><p class="nombre">${m.nombre}</p></div><div class="chev">›</div>
  </button>`).join("")}</div></section>`;
}
function perfilPage() {
  const m = DIRECTIVA.find(x => x.id === currentProfile) || DIRECTIVA[0];
  return `<section class="profile-hero"><div class="profile-nav"><button class="back" onclick="back()">‹</button><div class="dots">•••</div></div></section>
  <section class="profile-card"><div class="photo"><img src="${photoSrc(m)}" alt="${m.nombre}" onerror="this.remove(); this.parentElement.textContent='${m.foto}'"></div>
  <h2>${m.nombre}</h2><p>${m.cargo}</p><div class="rotary-mini"></div></section>
  <div class="actions"><a class="btn green" href="${wa(m.celular, "Hola " + m.nombre + ", soy socio del Club Rotary Huaraz Colonial.")}" target="_blank">🟢 WhatsApp</a><button class="btn blue" onclick="go('reuniones')">📅 Ver agenda</button></div>
  <section class="panel"><h3>Reseña</h3><p>${m.resena}</p></section>
  <section class="panel"><h3>Funciones</h3><ul>${m.funciones.map(x => `<li>${x}</li>`).join("")}</ul></section>
  <section class="panel"><h3>Metas</h3><ul>${m.metas.map(x => `<li>${x}</li>`).join("")}</ul></section>`;
}

function reunionesPage() {
  const reuniones = getReuniones();
  const virtuales = reuniones.filter(r => r.tipo === "Virtual");
  const presenciales = reuniones.filter(r => r.tipo === "Presencial");
  return `${head("Cronograma de reuniones")}
  <section class="page">
    <div class="summary-card"><strong>Reuniones virtuales</strong><span>Jueves · 8:00 p. m. · cada 15 días</span></div>
    <div class="summary-card"><strong>Reuniones presenciales</strong><span>Sábados · 5:00 p. m. · cada 2 meses</span></div>
    ${tablaReuniones("Cronograma de reuniones virtuales", virtuales)}
    ${tablaReuniones("Cronograma de reuniones presenciales", presenciales)}
    <div class="actions"><button class="btn gold" onclick="requestNotifications()">🔔 Activar alertas</button><button class="btn blue" onclick="go('admin')">⚙️ Administrar</button></div>
  </section>`;
}
function tablaReuniones(titulo, items) {
  return `<div class="table-card"><h3>${titulo}</h3><table><thead><tr><th>N.°</th><th>Fecha</th><th>Día</th><th>Hora</th></tr></thead><tbody>
  ${items.map((r,i)=>`<tr><td>${i+1}</td><td>${r.fechaTexto}</td><td>${r.dia}</td><td>${r.hora}<br><small>${r.observacion || ""}</small></td></tr>`).join("")}
  </tbody></table></div>`;
}

function agendaPage() {
  return `${head("Agenda de reunión")}<section class="page">
    <div class="panel" style="margin:0"><h3>Agenda propuesta</h3><p>Estimados socios y socias, para nuestra próxima reunión se propone tratar la siguiente agenda:</p></div>
    <div class="list" style="margin-top:14px">${AGENDA_REUNION.map((a,i)=>`<div class="goal-card"><div class="num">${i+1}</div><p><strong>${a.titulo}</strong><br>${a.detalle}</p></div>`).join("")}</div>
    <div class="panel"><p>Se agradece la puntual asistencia y participación activa de todos los socios.</p><p><strong>Un abrazo rotario.</strong><br>Ing. José Rafael Zeña Peche<br>Presidente<br>Club Rotary Huaraz Colonial</p></div>
  </section>`;
}

function cambioPage() {
  const hero = CAMBIO_MAZO[0]?.src || "assets/foto_cambio_maza.jpg";
  return `${head("Cambio de Mazo")}
  <section class="page">
    <div class="gallery-hero" style="background-image:url('${hero}?v=21')">
      <div class="copy"><h2>Cambio de Mazo y Primer Aniversario</h2><p>Club Rotary Huaraz Colonial · Año Rotario 2026–2027</p></div>
    </div>
    <div class="panel" style="margin:0 0 14px"><h3>Memoria institucional</h3><p>Galería especial de nuestra ceremonia de cambio de directiva, juramentación, integración de socios y momentos institucionales que fortalecen la vida rotaria del club.</p></div>
    <div class="gallery-grid">
      ${CAMBIO_MAZO.map((f,i)=>`<div class="gallery-card" onclick="verFotoCambio(${i})"><img src="${f.src}?v=21" alt="${f.caption}"><p>${f.caption}</p></div>`).join("")}
    </div>
  </section>`;
}
function verFotoCambio(i){
  const f = CAMBIO_MAZO[i];
  if(!f) return;
  const w = window.open(f.src, "_blank");
  if(!w) alert(f.caption);
}

function sociosPage() {
  return `${head("Socios")}<section class="page">
  <div class="panel" style="margin:0 0 14px"><h3>Directorio de socios</h3><p>Lista integrada con WhatsApp independiente para comunicación personal con cada socio.</p></div>
  <div class="list">
  ${SOCIOS.map(s => `<div class="role-card">
    <div class="mini-photo">${s.foto ? `<img src="assets/${s.foto}.jpg?v=21" alt="${s.nombre}" onerror="this.remove(); this.parentElement.textContent='👤'">` : "👤"}</div>
    <div class="role"><p class="cargo">${s.cargo || "Socio"}</p><p class="nombre">${s.nombre}</p><p style="margin:6px 0 0;color:#66778E;font-size:12px">${s.profesion || ""}<br>${s.email || ""}<br>Cumple: ${s.cumpleTexto || ""}</p></div>
    <a class="btn green" style="min-height:42px;padding:0 8px;font-size:12px" href="${waSocio(s, "Hola " + s.nombre + ", soy socio del Club Rotary Huaraz Colonial.")}" target="_blank">WhatsApp</a>
  </div>`).join("")}</div></section>`;
}


function cumpleanosPage(){
  const hoy = cumpleHoy();
  const proximos = proximosCumples(14);
  return `${head("Cumpleaños")}
  <section class="page">
    ${hoy.length ? `<div class="panel" style="margin:0 0 14px;background:linear-gradient(135deg,#fff7df,#ffffff);border:2px solid rgba(247,168,27,.75)"><h3>🎂 Cumpleaños de hoy</h3><p>${hoy.map(s=>s.nombre).join(", ")}</p></div>` : `<div class="panel" style="margin:0 0 14px"><h3>🎂 Cumpleaños de socios</h3><p>No hay cumpleaños registrados para hoy. Revisa los próximos cumpleaños.</p></div>`}
    <div class="list">
      ${proximos.map(s=>`<div class="role-card">
        <div class="mini-photo">${s.foto ? `<img src="assets/${s.foto}.jpg?v=21" alt="${s.nombre}" onerror="this.remove(); this.parentElement.textContent='🎂'">` : "🎂"}</div>
        <div class="role"><p class="cargo">${s.dias === 0 ? "Hoy" : "Faltan " + s.dias + " días"}</p><p class="nombre">${s.nombre}</p><p style="margin:6px 0 0;color:#66778E;font-size:12px">${s.cumpleTexto} · ${s.cargo || "Socio"}</p></div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <a class="btn green" style="min-height:38px;padding:0 8px;font-size:11px" href="${waSocio(s, mensajeCumpleSocio(s))}" target="_blank">Felicitar</a>
          <a class="btn gold" style="min-height:38px;padding:0 8px;font-size:11px" href="https://wa.me/51${IMAGEN_PUBLICA.celular}?text=${encodeURIComponent(mensajeImagenCumple(s))}" target="_blank">Avisar Imagen</a>
        </div>
      </div>`).join("")}
    </div>
    <div class="panel"><h3>Automatización</h3><p>La app muestra alerta interna de cumpleaños. Para enviar mensajes automáticos sin tocar WhatsApp se requiere conectar WhatsApp Business Cloud API o un servidor autorizado.</p></div>
  </section>`;
}

function adminPage() {
  const unlocked = sessionStorage.getItem("admin_ok") === "1";
  if (!unlocked) {
    return `${head("Administrar reuniones")}<section class="page"><div class="panel" style="margin:0"><h3>Acceso del administrador</h3><p>Ingrese el PIN para actualizar reuniones.</p><input id="adminPin" type="password" placeholder="PIN administrador" style="margin-top:12px"><button class="btn blue" style="width:100%;margin-top:12px" onclick="validarAdmin()">Ingresar</button></div><div class="panel"><p><strong>Nota:</strong> los cambios se guardan en este dispositivo. Para sincronizar a todos los socios se requiere Firebase o Google Sheets.</p></div></section>`;
  }
  const reuniones = getReuniones();
  return `${head("Administrar reuniones")}<section class="page"><div class="panel" style="margin:0"><h3>Nueva reunión</h3>
  <input id="admTitulo" placeholder="Título" style="margin-top:8px"><input id="admTipo" placeholder="Tipo: Virtual o Presencial" style="margin-top:8px"><input id="admFecha" type="date" style="margin-top:8px"><input id="admHora" type="time" style="margin-top:8px"><input id="admLugar" placeholder="Lugar" style="margin-top:8px"><button class="btn gold" style="width:100%;margin-top:12px" onclick="guardarReunionAdmin()">Guardar reunión</button></div>
  <div class="list" style="margin-top:14px">${reuniones.map((r,i)=>`<div class="meeting-card"><div class="micon">📅</div><div class="meeting"><h3>${r.titulo}</h3><p>${formatFecha(r)}</p><p>${r.lugar}</p></div><button class="back" style="background:#fff;color:#D83E3E;border:1px solid #f0b1b1" onclick="eliminarReunionAdmin(${i})">×</button></div>`).join("")}</div><button class="btn light" style="width:100%;margin-top:14px" onclick="restaurarReuniones()">Restaurar cronograma base</button></section>`;
}
function validarAdmin(){ const pin=document.getElementById("adminPin").value.trim(); if(pin===ADMIN_PIN){sessionStorage.setItem("admin_ok","1");render();} else alert("PIN incorrecto.");}
function guardarReunionAdmin(){
  const titulo=document.getElementById("admTitulo").value.trim(), tipo=document.getElementById("admTipo").value.trim() || "Virtual", fecha=document.getElementById("admFecha").value, hora24=document.getElementById("admHora").value, lugar=document.getElementById("admLugar").value.trim();
  if(!titulo || !fecha || !hora24){alert("Ingrese título, fecha y hora."); return;}
  const d=new Date(`${fecha}T${hora24}:00`);
  const fechaTexto=d.toLocaleDateString("es-PE",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase().replace(".","");
  const dia=d.toLocaleDateString("es-PE",{weekday:"long"});
  const reuniones=getReuniones();
  reuniones.push({id:"adm_"+Date.now(),tipo,titulo,descripcion:"Reunión del club",fechaTexto,fecha,dia,hora24,hora:hora24,lugar,observacion:""});
  setReuniones(reuniones); scheduleMeetingAlerts(); alert("Reunión guardada."); render();
}
function eliminarReunionAdmin(i){ const reuniones=getReuniones(); reuniones.splice(i,1); setReuniones(reuniones); render();}
function restaurarReuniones(){ localStorage.removeItem("reuniones_admin"); render();}

function comunidadPage() {
  return `${head("Más opciones")}<section class="page"><div class="list">
  ${linkCard("🏅","Cambio de Mazo","Galería institucional 2026–2027","javascript:go('cambio')")}
  ${linkCard("👥","Directiva","Funciones y contactos de la junta","javascript:go('directiva')")}
  ${linkCard("👤","Socios","Directorio con WhatsApp personal","javascript:go('socios')")}
  ${linkCard("🎂","Cumpleaños","Alertas y felicitaciones","javascript:go('cumpleanos')")}
  ${linkCard("📅","Cronograma","Reuniones virtuales y presenciales","javascript:go('reuniones')")}
  ${linkCard("📋","Agenda","Agenda propuesta de reunión","javascript:go('agenda')")}
  ${linkCard("⚙️","Administrar reuniones","Actualizar fecha, hora y lugar","javascript:go('admin')")}
  ${linkCard("⬇️","Instalar Android / iPhone","Instrucciones de instalación","javascript:installApp()")}
  ${linkCard("🌐","Web oficial","Memoria institucional",LINKS.web)}
  ${linkCard("f","Facebook","Página oficial",LINKS.facebook)}
  ${linkCard("🎵","TikTok","Canal oficial",LINKS.tiktok)}
  ${linkCard("⚙️","MyRotary","Portal Rotary",LINKS.myrotary)}
  </div></section>`;
}
function linkCard(icon,title,sub,url){const target=url.startsWith("javascript")?"":' target="_blank"';return `<a class="link-card" href="${url}"${target}><div class="licon">${icon}</div><div><h3>${title}</h3><p>${sub}</p></div><div class="chev">›</div></a>`;}

function comentariosPage(){const comments=load("comentarios",[]);return `${head("Comentarios")}<section class="page"><div class="panel" style="margin:0"><textarea id="nuevoComentario" placeholder="Escriba su comentario para el club..."></textarea><button class="btn blue" style="width:100%;margin-top:10px" onclick="guardarComentarioGeneral()">Publicar comentario</button></div><div class="list" style="margin-top:12px">${comments.length?comments.slice().reverse().map(c=>`<div class="post-card"><strong>${c.tipo||"Socio"}</strong><p>${c.texto}</p><small>${c.fecha}</small></div>`).join(""):'<div class="panel"><p>Aún no hay comentarios registrados.</p></div>'}</div></section>`;}
function guardarComentarioGeneral(){const t=document.getElementById("nuevoComentario").value.trim(); if(!t){alert("Escriba un comentario.");return;} const c=load("comentarios",[]); c.push({tipo:"Comentario de socio",texto:t,fecha:new Date().toLocaleString("es-PE")}); save("comentarios",c); render();}
function metasPage(){return `${head("Metas 2026–2027")}<section class="page"><div class="list">${METAS.map((m,i)=>`<div class="goal-card"><div class="num">${i+1}</div><p>${m}</p></div>`).join("")}</div></section>`;}

function updateNav(){navs.forEach(n=>n.classList.toggle("active", n.dataset.page===page || (page==="perfil"&&n.dataset.page==="directiva") || (["agenda","comentarios","metas","socios","admin","directiva","cumpleanos"].includes(page)&&n.dataset.page==="comunidad")));}
function render(){updateNav();const pages={inicio:home,directiva:directivaPage,perfil:perfilPage,reuniones:reunionesPage,comunidad:comunidadPage,comentarios:comentariosPage,metas:metasPage,socios:sociosPage,admin:adminPage,agenda:agendaPage,cambio:cambioPage,cumpleanos:cumpleanosPage}; app.innerHTML=(pages[page]||home)();}
render(); scheduleMeetingAlerts(); scheduleBirthdayAlerts();
if("serviceWorker" in navigator){navigator.serviceWorker.register("./sw.js?v=21").catch(()=>{});}
