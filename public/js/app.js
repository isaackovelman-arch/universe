document.addEventListener("DOMContentLoaded", () => {
"use strict";

const PASSWORD = "isaac0619";

const THEMES  = ["aurora","daylight","obsidian","rose"];
const ACCENTS = [["#8a7cff","#ff8acd"],["#5bc8ff","#7dffb0"],["#ff8a5c","#ffd166"],["#ff6bdc","#8a7cff"],["#5cffc2","#5bc8ff"],["#ffd166","#ff6bdc"]];

const $   = s => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2,9);
const esc = s => String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---- LOCK SCREEN ---- */
function unlock() {
  const val = $("#lockPassword").value;
  if (val === PASSWORD) {
    $("#lockScreen").style.display = "none";
    $("#app").classList.remove("hidden");
    bootApp();
  } else {
    $("#lockError").classList.remove("hidden");
    $("#lockPassword").value = "";
    $("#lockPassword").focus();
  }
}

$("#lockSubmit").onclick = unlock;
$("#lockPassword").onkeydown = e => { if (e.key === "Enter") unlock(); };
setTimeout(() => $("#lockPassword").focus(), 100);

/* ---- STATE ---- */
const S = { tabs:[], activeId:null, bookmarks:[], files:[], activeFileId:null, cloak:false,
  settings:{theme:"aurora",accent:"#8a7cff",accent2:"#ff8acd",style:"full",glass:60} };

let _st;
function save() {
  clearTimeout(_st); _st = setTimeout(async () => {
    try { await fetch("/api/state",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({tabs:S.tabs.map(t=>({id:t.id,title:t.title,url:t.url,kind:t.kind})),
        activeId:S.activeId,bookmarks:S.bookmarks,files:S.files,activeFileId:S.activeFileId,cloak:S.cloak,settings:S.settings})}); }catch{}
  }, 350);
}

async function bootApp() {
  try {
    const d = await (await fetch("/api/state")).json();
    if (d.settings) Object.assign(S.settings, d.settings);
    if (d.bookmarks) S.bookmarks = d.bookmarks;
    if (d.files?.length) S.files = d.files;
    if (d.cloak) S.cloak = d.cloak;
    applyTheme();
    if (d.tabs?.length) {
      d.tabs.forEach(t => mkTab(t.url,{title:t.title,id:t.id,silent:true}));
      S.activeId = (d.activeId && S.tabs.find(t=>t.id===d.activeId)) ? d.activeId : S.tabs[0]?.id;
    } else mkTab("",{silent:true});
    if (!S.files.length) S.files=[{id:uid(),name:"main.js",lang:"javascript",content:LANGUAGES[0].starter}];
    S.activeFileId = (d.activeFileId && S.files.find(f=>f.id===d.activeFileId)) ? d.activeFileId : S.files[0].id;
  } catch {
    applyTheme(); mkTab("",{silent:true});
    S.files=[{id:uid(),name:"main.js",lang:"javascript",content:LANGUAGES[0].starter}];
    S.activeFileId=S.files[0].id;
  }
  renderAll();
}

/* ---- PROXY ---- */
function toProxy(url) {
  try { if (typeof self.__uv$config!=="undefined") { const c=self.__uv$config; return location.origin+c.prefix+c.encodeUrl(url); } } catch {}
  return url;
}
function resolve(v) {
  const t=(v||"").trim(); if(!t) return null;
  if(/^https?:\/\//i.test(t)) return t;
  if(/^[\w-]+(\.[\w-]+)+([/?#].*)?$/.test(t)&&!t.includes(" ")) return "https://"+t;
  return "https://www.google.com/search?q="+encodeURIComponent(t);
}

/* ---- TABS ---- */
function mkTab(url,o={}) {
  const id=o.id||uid(), tab={id,title:o.title||"New Tab",url:url||"",kind:url?"proxy":"newtab",frame:null};
  S.tabs.push(tab);
  if (url) { mkFrame(tab); loadUrl(tab,url); }
  if (!o.silent) { S.activeId=id; renderAll(); save(); }
  return tab;
}
function mkFrame(tab) {
  if (tab.frame) return;
  const f=document.createElement("iframe"); f.className="view-frame";
  f.setAttribute("allow","fullscreen; clipboard-write");
  f.setAttribute("sandbox","allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation");
  $("#viewport").appendChild(f); tab.frame=f;
}
function loadUrl(tab,url) { if(!tab.frame) mkFrame(tab); tab.frame.src=toProxy(url); }
function navTab(tab,url) {
  tab.url=url; tab.kind="proxy";
  try { tab.title=new URL(url).hostname.replace(/^www\./,""); } catch { tab.title=url.slice(0,28)||"Tab"; }
  loadUrl(tab,url);
  if(S.activeId===tab.id){ $("#omnibox").value=url; star(); }
  renderTabsList(); save();
}
function closeTab(id) {
  const i=S.tabs.findIndex(t=>t.id===id); if(i<0) return;
  S.tabs[i].frame?.remove(); S.tabs.splice(i,1);
  if(S.activeId===id){ const n=S.tabs[i]||S.tabs[i-1]; S.activeId=n?.id??null; if(!S.tabs.length){ mkTab("",{silent:true}); S.activeId=S.tabs[0].id; } }
  renderAll(); save();
}
function switchTab(id){ S.activeId=id; renderAll(); }
const curTab = () => S.tabs.find(t=>t.id===S.activeId);

/* ---- RENDER ---- */
function renderAll(){ renderTabsList(); renderViewport(); renderBookmarks(); renderFileTabs(); renderEditor(); }

function renderTabsList(){
  const el=$("#tabsList"); el.innerHTML="";
  S.tabs.forEach(t=>{
    const d=document.createElement("div"); d.className="tab-item"+(t.id===S.activeId?" active":"");
    d.innerHTML=`<span class="tab-fav">${t.kind==="newtab"?"✦":"🌐"}</span><span class="tab-title">${esc(t.title)}</span><span class="tab-close"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></span>`;
    d.onclick=()=>switchTab(t.id);
    d.querySelector(".tab-close").onclick=e=>{ e.stopPropagation(); closeTab(t.id); };
    el.appendChild(d);
  });
}

function renderViewport(){
  document.querySelectorAll(".newtab").forEach(e=>e.remove());
  S.tabs.forEach(t=>{ if(t.frame) t.frame.classList.toggle("active",t.id===S.activeId); });
  const t=curTab(); if(!t) return;
  $("#omnibox").value=t.url||""; star();
  if(t.kind==="newtab") mkNewTab();
}

function mkNewTab(){
  const pg=document.createElement("div"); pg.className="newtab active";
  pg.innerHTML=`<div class="newtab-logo">Universe</div>
    <form class="newtab-search" id="_ntf">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
      <input id="_nti" placeholder="Search Google or type a URL" autocomplete="off" />
    </form>
    <div class="newtab-shortcuts">${S.bookmarks.slice(0,8).map(b=>`<div class="shortcut" data-url="${esc(b.url)}"><div class="shortcut-icon">${esc((b.title||b.url||"?")[0].toUpperCase())}</div><div class="shortcut-label">${esc(b.title||b.url)}</div></div>`).join("")}</div>`;
  $("#viewport").appendChild(pg);
  pg.querySelector("#_ntf").onsubmit=e=>{ e.preventDefault(); go(pg.querySelector("#_nti").value); };
  pg.querySelectorAll(".shortcut").forEach(s=>s.onclick=()=>go(s.dataset.url));
  setTimeout(()=>pg.querySelector("#_nti").focus(),80);
}

function renderBookmarks(){
  const el=$("#bookmarksList"); el.innerHTML="";
  S.bookmarks.forEach(b=>{ const d=document.createElement("div"); d.className="bookmark-item";
    d.innerHTML=`<svg viewBox="0 0 24 24"><path d="m12 2 3.1 6.3 7 1-5 5 1.2 6.9L12 18l-6.3 3.2L7 14.3l-5-5 7-1z"/></svg><span>${esc(b.title||b.url)}</span>`;
    d.onclick=()=>go(b.url); el.appendChild(d); });
}

function star(){ const t=curTab(); $("#starBtn").classList.toggle("starred",!!(t&&S.bookmarks.some(b=>b.url===t.url))); }

/* ---- NAV ---- */
function go(input) {
  const url=resolve(input); if(!url) return;
  let t=curTab();
  if(!t||t.kind==="newtab"){
    if(!t){ mkTab("",{silent:true}); S.activeId=S.tabs[S.tabs.length-1].id; t=curTab(); }
    navTab(t,url); renderViewport();
  } else { navTab(t,url); renderViewport(); }
}

/* ---- TOOLBAR ---- */
$("#omniboxForm").onsubmit=e=>{ e.preventDefault(); go($("#omnibox").value); $("#omnibox").blur(); };
$("#newTabBtn").onclick=()=>mkTab("");
$("#backBtn").onclick=()=>{ try{ curTab()?.frame?.contentWindow?.history.back(); }catch{} };
$("#fwdBtn").onclick=()=>{ try{ curTab()?.frame?.contentWindow?.history.forward(); }catch{} };
$("#reloadBtn").onclick=()=>{ const t=curTab(); if(t?.frame) t.frame.src=t.frame.src; };
$("#starBtn").onclick=()=>{
  const t=curTab(); if(!t?.url) return;
  const i=S.bookmarks.findIndex(b=>b.url===t.url);
  if(i>=0) S.bookmarks.splice(i,1); else S.bookmarks.unshift({url:t.url,title:t.title});
  star(); renderBookmarks(); save();
};
$("#sidebarToggle").onclick=()=>$("#sidebar").classList.toggle("collapsed");
const toggleCode=()=>$("#codePanel").classList.toggle("collapsed");
$("#codePanelToggle").onclick=toggleCode;
$("#codeToggleTop").onclick=toggleCode;
$("#closeCodePanel").onclick=toggleCode;

/* ---- CLOAKERS ---- */
const bHtml=url=>`<!DOCTYPE html><html><head><title></title><style>*{margin:0;padding:0}html,body,iframe{width:100%;height:100%;border:none;overflow:hidden}</style></head><body><iframe src="${url}" allow="fullscreen"></iframe></body></html>`;
$("#cloakerBtn").onclick=()=>{ $("#cloakerPanel").classList.remove("hidden"); };
$("#closeCloakerPanel").onclick=()=>$("#cloakerPanel").classList.add("hidden");
$("#launchBlank").onclick=()=>{ const u=resolve($("#cloakUrl1").value); if(!u) return; const w=window.open("about:blank","_blank"); if(!w){alert("Allow popups");return;} w.document.open(); w.document.write(bHtml(u)); w.document.close(); };
$("#downloadBlank").onclick=()=>{ const u=resolve($("#cloakUrl1").value)||"https://google.com"; const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([bHtml(u)],{type:"text/html"})); a.download="blank-cloak.html"; a.click(); URL.revokeObjectURL(a.href); };
$("#launchBlob").onclick=()=>{ const u=resolve($("#cloakUrl2").value); if(!u) return; window.open(URL.createObjectURL(new Blob([bHtml(u)],{type:"text/html"})),"_blank"); };
$("#downloadBlob").onclick=()=>{ const u=resolve($("#cloakUrl2").value)||"https://google.com"; const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([bHtml(u)],{type:"text/html"})); a.download="blob-cloak.html"; a.click(); URL.revokeObjectURL(a.href); };

/* ---- PALETTE ---- */
const cmds=()=>[
  {l:"New tab",k:"Ctrl+T",r:()=>mkTab("")},{l:"Close tab",k:"Ctrl+W",r:()=>{ const t=curTab(); if(t) closeTab(t.id); }},
  {l:"Toggle sidebar",k:"Ctrl+B",r:()=>$("#sidebar").classList.toggle("collapsed")},
  {l:"Toggle code panel",k:"Ctrl+E",r:toggleCode},{l:"Cloakers",k:"",r:()=>$("#cloakerBtn").click()},
  {l:"Customize",k:"Ctrl+,",r:openTheme},{l:"Bookmark page",k:"Ctrl+D",r:()=>$("#starBtn").click()},
  ...S.tabs.map(t=>({l:"Switch: "+t.title,k:"",r:()=>switchTab(t.id)})),
  ...S.bookmarks.map(b=>({l:"Open: "+(b.title||b.url),k:"",r:()=>go(b.url)})),
];
function openPal(){ $("#commandPalette").classList.remove("hidden"); $("#commandInput").value=""; renderCmds(""); setTimeout(()=>$("#commandInput").focus(),10); }
function closePal(){ $("#commandPalette").classList.add("hidden"); }
function renderCmds(q){
  const res=cmds().filter(c=>c.l.toLowerCase().includes(q.toLowerCase())).slice(0,30);
  const box=$("#commandResults"); box.innerHTML="";
  res.forEach((c,i)=>{ const d=document.createElement("div"); d.className="p-result"+(i===0?" sel":"");
    d.innerHTML=`<span>${esc(c.l)}</span>${c.k?`<kbd>${c.k}</kbd>`:""}`;
    d.onclick=()=>{ c.r(); closePal(); }; box.appendChild(d); });
}
$("#commandInput").oninput=e=>renderCmds(e.target.value);
$("#commandInput").onkeydown=e=>{
  if(e.key==="Enter"){ $("#commandResults .p-result.sel")?.click(); }
  if(e.key==="Escape") closePal();
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){
    const items=[...$("#commandResults").querySelectorAll(".p-result")];
    const cur=items.findIndex(el=>el.classList.contains("sel")); items[cur]?.classList.remove("sel");
    items[(e.key==="ArrowDown"?(cur+1):(cur-1+items.length))%items.length]?.classList.add("sel"); e.preventDefault();
  }
};
$("#commandPalette").onclick=e=>{ if(e.target.id==="commandPalette") closePal(); };
$("#commandPaletteBtn").onclick=openPal;

/* ---- THEME ---- */
function applyTheme(){
  document.documentElement.setAttribute("data-theme",S.settings.theme);
  document.documentElement.style.setProperty("--accent",S.settings.accent);
  document.documentElement.style.setProperty("--accent2",S.settings.accent2);
  document.documentElement.style.setProperty("--glass",S.settings.glass);
  document.body.classList.toggle("compact",S.settings.style==="compact");
}
function openTheme(){
  $("#themePanel").classList.remove("hidden");
  const ts=$("#themeSwatches"); ts.innerHTML="";
  THEMES.forEach(t=>{ const d=document.createElement("div"); d.className="swatch"+(S.settings.theme===t?" active":"");
    d.style.background=({aurora:"#111118",daylight:"#eeeaf8",obsidian:"#08080c",rose:"#130e11"})[t]; d.title=t;
    d.onclick=()=>{ S.settings.theme=t; applyTheme(); openTheme(); save(); }; ts.appendChild(d); });
  const as=$("#accentSwatches"); as.innerHTML="";
  ACCENTS.forEach(([a,b])=>{ const d=document.createElement("div"); d.className="swatch"+(S.settings.accent===a?" active":"");
    d.style.background=`linear-gradient(135deg,${a},${b})`;
    d.onclick=()=>{ S.settings.accent=a; S.settings.accent2=b; applyTheme(); openTheme(); save(); }; as.appendChild(d); });
  $("#tabStyleSeg").querySelectorAll("button").forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.val===S.settings.style);
    btn.onclick=()=>{ S.settings.style=btn.dataset.val; applyTheme(); openTheme(); save(); };
  });
  $("#glassRange").value=S.settings.glass;
  $("#glassRange").oninput=e=>{ S.settings.glass=+e.target.value; applyTheme(); save(); };
}
$("#themeBtn").onclick=openTheme;
$("#closeThemePanel").onclick=()=>$("#themePanel").classList.add("hidden");

/* ---- CODE PANEL ---- */
const curFile=()=>S.files.find(f=>f.id===S.activeFileId);
function renderFileTabs(){
  const box=$("#fileTabs"); box.innerHTML="";
  S.files.forEach(f=>{ const d=document.createElement("div"); d.className="file-tab"+(f.id===S.activeFileId?" active":"");
    d.innerHTML=`<span>${esc(f.name)}</span><span class="fx"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></span>`;
    d.onclick=()=>{ S.activeFileId=f.id; renderFileTabs(); renderEditor(); };
    d.querySelector(".fx").onclick=e=>{ e.stopPropagation(); if(S.files.length<=1) return;
      const i=S.files.findIndex(x=>x.id===f.id); S.files.splice(i,1);
      if(S.activeFileId===f.id) S.activeFileId=S.files[Math.max(0,i-1)].id;
      renderFileTabs(); renderEditor(); save(); };
    box.appendChild(d); });
}
function renderEditor(){ const f=curFile(); if(!f) return; $("#codeEditor").value=f.content;
  $("#langSelect").innerHTML=LANGUAGES.map(l=>`<option value="${l.id}"${l.id===f.lang?" selected":""}>${l.label}</option>`).join("");
  $("#cloakToggle").checked=S.cloak; }
$("#codeEditor").oninput=e=>{ const f=curFile(); if(f){ f.content=e.target.value; save(); } };
$("#langSelect").onchange=e=>{ const f=curFile(); if(!f) return; const l=getLanguage(e.target.value); f.lang=l.id; f.name=f.name.replace(/\.[^.]+$/,"")+"."+l.ext; renderFileTabs(); save(); };
$("#addFileBtn").onclick=()=>{ const l=LANGUAGES[0]; const f={id:uid(),name:`file${S.files.length+1}.${l.ext}`,lang:l.id,content:l.starter}; S.files.push(f); S.activeFileId=f.id; renderFileTabs(); renderEditor(); save(); };
$("#cloakToggle").onchange=e=>{ S.cloak=e.target.checked; save(); };
$("#runBtn").onclick=async()=>{
  const f=curFile(); if(!f) return; const l=getLanguage(f.lang); const out=$("#consoleOutput");
  if(l.piston===null){ out.innerHTML=""; const fr=document.createElement("iframe"); fr.style.cssText="width:100%;height:140px;border:1px solid var(--border);border-radius:8px;background:#fff;"; fr.srcdoc=f.content; out.appendChild(fr); return; }
  out.textContent="Running…";
  try{ const r=await fetch("/api/run",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({language:l.piston,files:[{name:f.name,content:f.content}]})});
    const d=await r.json(); if(d.error){ out.textContent="Error: "+d.error; return; }
    out.textContent=[d.compile?.output,d.run?.output].filter(Boolean).join("\n")||"(no output)";
  }catch(err){ out.textContent="Runner error: "+err.message; }
};
const minify=(c,lang)=>{ const cl=["javascript","typescript","java","c","cpp","csharp","go","rust","kotlin","dart","swift","php"]; let r=c;
  if(cl.includes(lang)) r=r.replace(/\/\*[\s\S]*?\*\//g,"").replace(/(^|[^:])\/\/.*$/gm,"$1");
  else if(["python","ruby","bash","perl","r"].includes(lang)) r=r.replace(/(^|[^\\])#.*$/gm,"$1");
  return r.split("\n").map(l=>l.trim()).filter(Boolean).join("\n"); };
$("#downloadBtn").onclick=()=>{ const f=curFile(); if(!f) return; const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([S.cloak?minify(f.content,f.lang):f.content],{type:"text/plain"})); a.download=f.name; a.click(); URL.revokeObjectURL(a.href); };

/* ---- KEYBOARD ---- */
document.onkeydown=e=>{
  if(e.key==="Escape"){ closePal(); ["themePanel","cloakerPanel"].forEach(id=>$("#"+id).classList.add("hidden")); return; }
  const mod=e.ctrlKey||e.metaKey; if(!mod) return; const k=e.key.toLowerCase();
  const map={t:()=>mkTab(""),w:()=>{ const t=curTab(); if(t) closeTab(t.id); },l:()=>{ $("#omnibox").focus(); $("#omnibox").select(); },k:openPal,b:()=>$("#sidebar").classList.toggle("collapsed"),e:toggleCode,d:()=>$("#starBtn").click(),r:()=>$("#reloadBtn").click(),",":openTheme};
  if(map[k]){ e.preventDefault(); map[k](); return; }
  if(/^[1-9]$/.test(k)){ const t=S.tabs[+k-1]; if(t){ e.preventDefault(); switchTab(t.id); } }
  if(k==="tab"){ e.preventDefault(); const i=S.tabs.findIndex(t=>t.id===S.activeId); switchTab(S.tabs[(e.shiftKey?(i-1+S.tabs.length):i+1)%S.tabs.length].id); }
};

/* ---- SW ---- */
if("serviceWorker"in navigator&&location.protocol==="https:"){
  navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(err=>console.warn("SW:",err));
}

});