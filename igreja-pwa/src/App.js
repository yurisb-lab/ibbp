// src/App.js
import React, { useState, useEffect } from "react";
import {
  Home, Calendar, BookOpen, Image as ImageIcon, Users, Heart,
  Bell, Radio, DollarSign, History, LogIn, LogOut, User, Lock,
  ChevronRight, ChevronLeft, Plus, X, Check, Copy, Search,
  Shield, Star, Clock, MapPin, Phone, Mail, Send, Menu, Quote
} from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
import BibleScreen from "./pages/BibleScreen";
import CalendarScreen from "./pages/CalendarScreen";
import DevotionalScreen from "./pages/DevotionalScreen";
import { roleLabel, roleColor } from "./services/permissions";
import MembersScreen from "./pages/MembersScreen";
import DashboardScreen from "./pages/DashboardScreen";
import HistoryScreen from "./pages/HistoryScreen";
import MinistriesScreen from "./pages/MinistriesScreen";
import DonationsScreen from "./pages/DonationsScreen";
import { loginUser, logoutUser, registerUser } from "./services/authService";
import {
  getEvents, addEvent, deleteEvent,
  getNews, addNews, togglePinNews, deleteNews,
  getPrayers, addPrayer, incrementPrayed,
  getMembers, updateMemberRole,
  getTodayDevotional,
} from "./services/firestoreService";

/* ── Paleta — Identidade Visual IBBP ─────────────────────── */
const C = {
  navy:       "#6B0F0F",   // bordô escuro principal
  navyMid:    "#8B1A1A",   // bordô médio
  navyLight:  "#A52020",   // bordô claro
  gold:       "#C8A45A",   // dourado/creme quente
  ivory:      "#FAF6F0",   // fundo marfim suave
  ivoryDeep:  "#F0E8DC",   // fundo marfim profundo
  terracotta: "#2D5A1B",   // verde escuro (ramo da logo)
  olive:      "#3D7A25",   // verde médio
  ink:        "#1A1008",   // tinta quente
};

/* ── Helpers ──────────────────────────────────────────────── */
function formatDate(val) {
  if (!val) return "";
  const iso = val?.toDate ? val.toDate().toISOString().slice(0,10) : String(val).slice(0,10);
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" });
}
function formatShort(val) {
  if (!val) return "";
  const iso = val?.toDate ? val.toDate().toISOString().slice(0,10) : String(val).slice(0,10);
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day:"2-digit", month:"short" });
}

/* ── Toast ────────────────────────────────────────────────── */
function useToast() {
  const [msg, setMsg] = useState(null);
  const show = (m) => { setMsg(m); setTimeout(()=>setMsg(null),2800); };
  const Toast = msg ? (
    <div style={{
      position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
      background:C.navy,color:C.ivory,padding:"12px 22px",borderRadius:10,
      fontSize:14,fontWeight:500,boxShadow:"0 8px 24px rgba(0,0,0,.35)",zIndex:1000,
      border:`1px solid ${C.gold}55`,display:"flex",alignItems:"center",gap:8,maxWidth:"88%",textAlign:"center"
    }}>
      <Check size={16} color={C.gold}/> {msg}
    </div>
  ) : null;
  return { show, Toast };
}

/* ── Vitral SVG (assinatura visual) ──────────────────────── */
function Vitral({ opacity=0.08, id="vt" }) {
  return (
    <svg width="100%" height="100%" style={{position:"absolute",inset:0,opacity}} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id={id} width="84" height="84" patternUnits="userSpaceOnUse">
          <path d="M42 0 L84 42 L42 84 L0 42 Z" fill="none" stroke={C.gold} strokeWidth="1"/>
          <path d="M42 0 L42 84 M0 42 L84 42" stroke={C.gold} strokeWidth="0.5"/>
          <circle cx="42" cy="42" r="6" fill="none" stroke={C.gold} strokeWidth="0.75"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`}/>
    </svg>
  );
}

const categoryMeta = {
  culto:     { label:"Culto",     color:C.navy },
  oracao:    { label:"Oração",    color:C.olive },
  ensino:    { label:"Ensino",    color:C.gold },
  jovens:    { label:"Jovens",    color:C.terracotta },
  lideranca: { label:"Liderança", color:C.terracotta },
  especial:  { label:"Especial",  color:C.navyLight },
};

const churchHistory = [
  { year:"1978", text:"Fundação da Igreja Bíblica Batista de Pacatuba por um pequeno grupo de famílias reunidas em uma casa, com a visão de pregar o evangelho na região." },
  { year:"1985", text:"Construção do primeiro templo, com capacidade para 150 pessoas, erguido em mutirão pelos próprios membros." },
  { year:"1994", text:"Organização formal dos ministérios de música, ensino e ação social." },
  { year:"2003", text:"Ampliação do templo sede e construção das salas de Escola Bíblica Dominical." },
  { year:"2012", text:"Início do ministério de plantação de igrejas na região metropolitana." },
  { year:"2020", text:"Adaptação para cultos com transmissão online durante a pandemia." },
  { year:"2026", text:"A igreja celebra décadas de história, mantendo viva sua missão em Pacatuba." },
];

const seedMinistries = [
  { id:"m1", name:"Louvor e Adoração",    leader:"Renata Oliveira",   description:"Responsável pela música e adoração nos cultos.",        contact:"louvor@ibbpacatuba.org" },
  { id:"m2", name:"Ministério Jovem",     leader:"João Pedro Souza",  description:"Discipulado e comunhão para jovens de 15 a 29 anos.",   contact:"jovens@ibbpacatuba.org" },
  { id:"m3", name:"Ação Social",          leader:"Conceição Lima",     description:"Campanhas de doação e apoio à comunidade.",             contact:"social@ibbpacatuba.org" },
  { id:"m4", name:"Ministério Infantil",  leader:"Patrícia Gomes",    description:"Cuidado e ensino bíblico para crianças de 0 a 11 anos.",contact:"kids@ibbpacatuba.org" },
  { id:"m5", name:"Mulheres em Oração",   leader:"Renata Oliveira",   description:"Encontros de oração e estudo voltados às mulheres.",    contact:"mulheres@ibbpacatuba.org" },
  { id:"m6", name:"Diaconato",            leader:"Pr. Marcos Vieira", description:"Apoio prático à igreja e cuidado pastoral.",             contact:"diaconato@ibbpacatuba.org" },
];

const sampleVerses = {
  "João 3:16":        "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
  "Salmos 23:1":      "O Senhor é o meu pastor; nada me faltará.",
  "Filipenses 4:13":  "Posso todas as coisas naquele que me fortalece.",
  "Romanos 8:28":     "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.",
  "Provérbios 3:5-6": "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.",
};

const bibleBooks = [
  "Gênesis","Êxodo","Levítico","Números","Deuteronômio","Josué","Juízes","Rute",
  "1 Samuel","2 Samuel","1 Reis","2 Reis","Salmos","Provérbios","Isaías","Jeremias",
  "Mateus","Marcos","Lucas","João","Atos","Romanos","1 Coríntios","2 Coríntios",
  "Gálatas","Efésios","Filipenses","Colossenses","Apocalipse",
];

/* ════════════════════════════════════════════════════════════
   APP ROOT
════════════════════════════════════════════════════════════ */
export default function App() {
  const {
    currentUser, userProfile, role,
    isAdmin, isLeader, canManageContent: canEdit,
    canViewMembers, canViewDashboard: hasDashboard,
    canManageMembers: canMembers
  } = useAuth();
  const { show, Toast } = useToast();
  const [tab, setTab]         = useState("inicio");
  const [menuOpen, setMenuOpen] = useState(false);

  // Dados do Firestore
  const [events,  setEvents]  = useState([]);
  const [news,    setNews]    = useState([]);
  const [prayers, setPrayers] = useState([]);
  const [members, setMembers] = useState([]);
  const [devotional, setDevotional] = useState(null);

  // Carrega dados ao montar / quando usuário loga
  useEffect(() => { getEvents().then(setEvents).catch(()=>{}); }, []);
  useEffect(() => { getNews().then(setNews).catch(()=>{}); }, []);
  useEffect(() => { getPrayers().then(setPrayers).catch(()=>{}); }, []);
  useEffect(() => { getTodayDevotional().then(setDevotional).catch(()=>{}); }, []);
  useEffect(() => {
    if (isLeader) getMembers().then(setMembers).catch(()=>{});
  }, [isLeader]);

  const navItems = [
    { key:"inicio",    label:"Início",    icon:Home },
    { key:"calendario",label:"Calendário",icon:Calendar },
    { key:"biblia",    label:"Bíblia",    icon:BookOpen },
    { key:"oracao",    label:"Oração",    icon:Heart },
    { key:"mais",      label:"Mais",      icon:Menu },
  ];

  const activeNav = ["inicio","calendario","biblia","oracao","mais"].includes(tab) ? tab : "mais";

  return (
    <div style={{
      fontFamily:"'Inter',system-ui,sans-serif", background:C.ivory, minHeight:"100vh", color:C.ink,
      display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", position:"relative",
      boxShadow:"0 0 60px rgba(0,0,0,.08)"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        body{margin:0}button{font-family:inherit;cursor:pointer}
        input,textarea,select{font-family:inherit}
        .serif{font-family:'Lora',serif}
      `}</style>

      {/* ── Header ── */}
      <Header onMenu={()=>setMenuOpen(true)} onProfile={()=>setTab(currentUser?"perfil":"auth")} userProfile={userProfile}/>

      {/* ── Main ── */}
      <main style={{flex:1,paddingBottom:86,overflowX:"hidden"}}>
        {tab==="auth"       && !currentUser && <AuthScreen show={show} onSuccess={()=>setTab("inicio")}/>}
        {tab==="inicio"     && <HomeScreen events={events} news={news} currentUser={userProfile} onNavigate={setTab}/>}
        {tab==="calendario" && <CalendarScreen userProfile={userProfile}/>}
        {tab==="biblia"     && <BibleScreen />}
        {tab==="oracao"     && <PrayerScreen prayers={prayers} setPrayers={setPrayers} userProfile={userProfile} show={show} addPrayer={addPrayer} incrementPrayed={incrementPrayed}/>}
        {tab==="avisos"     && <NewsScreen news={news} setNews={setNews} isLeader={canEdit} userProfile={userProfile} show={show} addNews={addNews} togglePinNews={togglePinNews} deleteNews={deleteNews}/>}
        {tab==="devocional" && <DevotionalScreen userProfile={userProfile}/>}
        {tab==="fotos"      && <PhotosScreen/>}
        {tab==="historia"   && <HistoryScreen userProfile={userProfile}/>}
        {tab==="ministerios"&& <MinistriesScreen userProfile={userProfile}/>}
        {tab==="transmissao"&& <LiveScreen/>}
        {tab==="doacoes"    && <DonationsScreen userProfile={userProfile} show={show}/>}
        {tab==="perfil"     && currentUser && <ProfileScreen userProfile={userProfile} show={show} onNavigate={setTab} isLeader={isLeader} isAdmin={isAdmin} onLogout={async()=>{await logoutUser();setTab("inicio");show("Sessão encerrada.");}}/>}
        {tab==="membros"    && canViewMembers && <MembersScreen userProfile={userProfile}/>}
        {tab==="dashboard"   && hasDashboard && <DashboardScreen userProfile={userProfile} onNavigate={setTab}/>}
        {tab==="mais"       && <MoreScreen onNavigate={setTab} currentUser={currentUser} isLeader={isLeader} canMembers={canViewMembers} hasDashboard={hasDashboard}/>}
      </main>

      {/* ── Bottom Nav ── */}
      <nav style={{
        position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,
        background:C.navy,display:"flex",justifyContent:"space-around",padding:"10px 4px 12px",
        borderTop:`1px solid ${C.gold}33`,zIndex:100
      }}>
        {navItems.map(item=>{
          const active = activeNav===item.key;
          return (
            <button key={item.key} onClick={()=>setTab(item.key)} style={{
              background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",
              gap:3,color:active?C.gold:`${C.ivory}99`,padding:"2px 10px"
            }}>
              <item.icon size={20} strokeWidth={active?2.4:1.8}/>
              <span style={{fontSize:10.5,fontWeight:active?700:500}}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Side Menu ── */}
      {menuOpen && <SideMenu userProfile={userProfile} onClose={()=>setMenuOpen(false)} onNavigate={t=>{setTab(t);setMenuOpen(false);}} isLeader={isLeader} canMembers={canViewMembers} hasDashboard={hasDashboard} currentUser={currentUser} onLogout={async()=>{await logoutUser();setTab("inicio");setMenuOpen(false);show("Sessão encerrada.");}}/>}

      {Toast}
    </div>
  );
}

/* ── Header ──────────────────────────────────────────────── */
function Header({ onMenu, onProfile, userProfile }) {
  return (
    <header style={{background:`linear-gradient(160deg,${C.navy} 0%,${C.navyMid} 60%,${C.navyLight} 100%)`,padding:"10px 14px 14px",position:"relative",overflow:"hidden"}}>
      <Vitral opacity={0.06} id="vt-hd"/>
      <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
        <button onClick={onMenu} aria-label="Menu" style={{background:"none",border:"none",padding:6,color:C.ivory,flexShrink:0}}><Menu size={22}/></button>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1,justifyContent:"center"}}>
          <img src="/logo.png" alt="Logo IBBP" style={{width:46,height:46,objectFit:"contain",filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.4))"}}/>
          <div style={{textAlign:"left"}}>
            <div className="serif" style={{color:C.gold,fontSize:9.5,letterSpacing:2,fontWeight:700,lineHeight:1}}>IGREJA BÍBLICA BATISTA</div>
            <div className="serif" style={{color:C.ivory,fontSize:15,fontWeight:700,letterSpacing:0.3,lineHeight:1.2}}>DE PACATUBA</div>
            <div style={{color:`${C.gold}bb`,fontSize:9,fontWeight:600,letterSpacing:1}}>Est. 2008</div>
          </div>
        </div>
        <button onClick={onProfile} aria-label="Perfil" style={{background:userProfile?`${C.gold}22`:"none",border:userProfile?`1px solid ${C.gold}66`:"none",borderRadius:20,padding:6,color:C.ivory,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {userProfile
            ? <span className="serif" style={{color:C.gold,fontSize:13,fontWeight:700}}>{userProfile.name?.split(" ")[0][0]}{userProfile.name?.split(" ")[1]?.[0]||""}</span>
            : <User size={18}/>}
        </button>
      </div>
    </header>
  );
}

/* ── Side Menu ────────────────────────────────────────────── */
function SideMenu({ userProfile, currentUser, onClose, onNavigate, isLeader, canMembers, hasDashboard, onLogout }) {
  const role = userProfile?.role || "membro";
  const items = [
    {key:"inicio",label:"Início",icon:Home},
    {key:"calendario",label:"Calendário",icon:Calendar},
    {key:"biblia",label:"Bíblia",icon:BookOpen},
    {key:"devocional",label:"Devocional Diário",icon:Star},
    {key:"avisos",label:"Avisos e Mural",icon:Bell},
    {key:"oracao",label:"Pedidos de Oração",icon:Heart},
    {key:"ministerios",label:"Ministérios",icon:Users},
    {key:"fotos",label:"Galeria de Fotos",icon:ImageIcon},
    {key:"historia",label:"Nossa História",icon:History},
    {key:"doacoes",label:"Dízimos e Ofertas",icon:DollarSign},
    ...(canMembers?[{key:"membros",label:"Lista de Membros",icon:Users}]:[]),
    ...(hasDashboard?[{key:"dashboard",label:"Dashboard Admin",icon:Shield}]:[]),
  ];
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(50,5,5,.55)"}}/>
      <div style={{position:"relative",width:"82%",maxWidth:340,height:"100%",background:C.navy,boxShadow:"4px 0 30px rgba(0,0,0,.3)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <Vitral opacity={0.06} id="vt-mn"/>
        <div style={{position:"relative",padding:"20px 20px 16px",borderBottom:`1px solid ${C.gold}33`}}>
          <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",color:C.ivory}}><X size={20}/></button>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <img src="/logo.png" alt="Logo IBBP" style={{width:44,height:44,objectFit:"contain",filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.5))"}}/>
            <div>
              <div className="serif" style={{color:C.gold,fontSize:9.5,letterSpacing:2,fontWeight:700,lineHeight:1}}>IGREJA BÍBLICA BATISTA</div>
              <div className="serif" style={{color:C.ivory,fontSize:16,fontWeight:700,lineHeight:1.2}}>de Pacatuba</div>
              <div style={{color:`${C.gold}bb`,fontSize:9,fontWeight:600,letterSpacing:1}}>Est. 2008</div>
            </div>
          </div>
          {userProfile ? (
            <div style={{marginTop:14,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:19,background:`${C.gold}22`,border:`1px solid ${C.gold}66`,display:"flex",alignItems:"center",justifyContent:"center",color:C.gold,fontWeight:700,fontSize:14}} className="serif">
                {userProfile.name?.split(" ")[0][0]}{userProfile.name?.split(" ")[1]?.[0]||""}
              </div>
              <div>
                <div style={{color:C.ivory,fontSize:14,fontWeight:600}}>{userProfile.name}</div>
                <div style={{color:roleColor(userProfile.role),fontSize:11,fontWeight:600}}>{roleLabel(userProfile.role)}</div>
              </div>
            </div>
          ) : (
            <button onClick={()=>onNavigate("auth")} style={{marginTop:14,background:C.gold,color:C.navy,border:"none",borderRadius:8,padding:"9px 16px",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
              <LogIn size={15}/> Entrar / Cadastrar
            </button>
          )}
        </div>
        <div style={{position:"relative",flex:1,overflowY:"auto",padding:"10px 8px"}}>
          {items.map(item=>(
            <button key={item.key} onClick={()=>onNavigate(item.key)} style={{width:"100%",background:"none",border:"none",color:C.ivory,textAlign:"left",padding:"12px 12px",display:"flex",alignItems:"center",gap:14,borderRadius:8,fontSize:14.5}}
              onMouseEnter={e=>e.currentTarget.style.background=`${C.gold}15`}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <item.icon size={18} color={C.gold}/>{item.label}
            </button>
          ))}
        </div>
        {currentUser && (
          <div style={{position:"relative",padding:14,borderTop:`1px solid ${C.gold}33`}}>
            <button onClick={onLogout} style={{width:"100%",background:"none",border:`1px solid ${C.terracotta}88`,color:C.terracotta,borderRadius:8,padding:"10px",fontSize:13.5,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <LogOut size={15}/> Sair da conta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Auth Screen ──────────────────────────────────────────── */
function AuthScreen({ show, onSuccess }) {
  const [mode, setMode]       = useState("login");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setError(""); setLoading(true);
    try {
      if (mode==="login") {
        await loginUser(email.trim(), password);
        show("Bem-vindo(a) de volta!");
      } else {
        if (!name.trim()) { setError("Informe seu nome."); setLoading(false); return; }
        await registerUser({ name: name.trim(), email: email.trim(), password, phone: phone.trim() });
        show("Conta criada com sucesso!");
      }
      onSuccess();
    } catch(e) {
      const msgs = {
        "auth/user-not-found":   "E-mail não encontrado.",
        "auth/wrong-password":   "Senha incorreta.",
        "auth/email-already-in-use": "Este e-mail já está cadastrado.",
        "auth/weak-password":    "A senha deve ter pelo menos 6 caracteres.",
        "auth/invalid-email":    "E-mail inválido.",
      };
      setError(msgs[e.code] || "Erro ao autenticar. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <div style={{padding:"32px 24px"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{margin:"0 auto 14px",textAlign:"center"}}>
          <img src="/logo.png" alt="Logo IBBP" style={{width:80,height:80,objectFit:"contain",filter:"drop-shadow(0 4px 8px rgba(107,15,15,0.3))"}}/>
        </div>
        <h1 className="serif" style={{fontSize:22,color:C.navy,margin:"0 0 4px"}}>{mode==="login"?"Acesse sua conta":"Crie sua conta"}</h1>
        <p style={{fontSize:13.5,color:`${C.ink}99`,margin:0}}>{mode==="login"?"Entre para acessar a área de membros":"Junte-se à nossa comunidade de fé"}</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {mode==="register" && <FInput label="Nome completo" icon={User} value={name} onChange={setName} placeholder="Seu nome"/>}
        <FInput label="E-mail" icon={Mail} value={email} onChange={setEmail} placeholder="seu@email.com" type="email"/>
        <FInput label="Senha" icon={Lock} value={password} onChange={setPass} placeholder="••••••" type="password"/>
        {mode==="register" && <FInput label="Telefone (opcional)" icon={Phone} value={phone} onChange={setPhone} placeholder="(85) 99999-0000"/>}
        {error && <div style={{background:`${C.terracotta}15`,color:C.terracotta,padding:"10px 14px",borderRadius:8,fontSize:13}}>{error}</div>}
        <button onClick={handle} disabled={loading} style={{background:C.navy,color:C.ivory,border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:loading?.7:1}}>
          {loading?"Aguarde...":(mode==="login"?<><LogIn size={17}/> Entrar</>:<><Plus size={17}/> Criar conta</>)}
        </button>
        <button onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}} style={{background:"none",border:"none",color:C.navyLight,fontSize:13.5,padding:8,fontWeight:600}}>
          {mode==="login"?"Não tem conta? Cadastre-se":"Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}

function FInput({ label, icon:Icon, value, onChange, placeholder, type="text" }) {
  return (
    <label style={{display:"block"}}>
      <span style={{fontSize:12.5,fontWeight:600,color:`${C.ink}aa`,marginBottom:6,display:"block"}}>{label}</span>
      <div style={{position:"relative"}}>
        <Icon size={16} color={`${C.ink}66`} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}/>
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          style={{width:"100%",padding:"12px 12px 12px 36px",borderRadius:9,border:`1.5px solid ${C.ivoryDeep}`,background:"#fff",fontSize:14.5,outline:"none",color:C.ink}}
          onFocus={e=>e.target.style.borderColor=C.gold}
          onBlur={e=>e.target.style.borderColor=C.ivoryDeep}
        />
      </div>
    </label>
  );
}

/* ── Shared UI ────────────────────────────────────────────── */
function PageTitle({ title, subtitle }) {
  return (
    <div style={{marginBottom:18}}>
      <h1 className="serif" style={{fontSize:21,color:C.navy,margin:"0 0 3px",fontWeight:700}}>{title}</h1>
      {subtitle && <p style={{fontSize:12.5,color:`${C.ink}88`,margin:0}}>{subtitle}</p>}
    </div>
  );
}
function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <h2 className="serif" style={{fontSize:16.5,color:C.navy,margin:0,fontWeight:700}}>{title}</h2>
      {action && <button onClick={onAction} style={{background:"none",border:"none",color:C.terracotta,fontSize:12.5,fontWeight:600,display:"flex",alignItems:"center",gap:2}}>{action}<ChevronRight size={14}/></button>}
    </div>
  );
}
function EventCard({ event, compact }) {
  const meta = categoryMeta[event.category]||{label:event.category,color:C.navy};
  return (
    <div style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:14,display:"flex",gap:14,alignItems:"center"}}>
      <div style={{width:50,height:50,borderRadius:10,background:`${meta.color}12`,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:meta.color}}>
        <div style={{fontSize:15,fontWeight:800,lineHeight:1}}>{formatShort(event.date).split(" ")[0]}</div>
        <div style={{fontSize:9.5,fontWeight:700,textTransform:"uppercase"}}>{formatShort(event.date).split(" ")[1]}</div>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
          <span style={{fontSize:9.5,fontWeight:700,color:meta.color,background:`${meta.color}15`,padding:"2px 7px",borderRadius:5,letterSpacing:.4}}>{meta.label.toUpperCase()}</span>
          {event.restricted && <Shield size={11} color={C.terracotta}/>}
        </div>
        <div style={{fontWeight:700,fontSize:14,color:C.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{event.title}</div>
        {!compact && <div style={{fontSize:12.5,color:`${C.ink}88`,marginTop:3,lineHeight:1.4}}>{event.description}</div>}
        <div style={{display:"flex",gap:12,marginTop:4,fontSize:11.5,color:`${C.ink}77`}}>
          <span style={{display:"flex",alignItems:"center",gap:3}}><Clock size={11}/>{event.time}</span>
          <span style={{display:"flex",alignItems:"center",gap:3}}><MapPin size={11}/>{event.location}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Home Screen ──────────────────────────────────────────── */
function HomeScreen({ events, news, currentUser, onNavigate }) {
  const upcoming   = events.filter(e=>!e.restricted).slice(0,3);
  const pinnedNews = news.find(n=>n.pinned)||news[0];
  return (
    <div>
      <div style={{background:`linear-gradient(160deg,${C.navy},${C.navyMid} 60%,${C.navyLight})`,padding:"26px 22px 30px",position:"relative",overflow:"hidden"}}>
        <Vitral opacity={0.07} id="vt-hero"/>
        <div style={{position:"relative"}}>
          <div style={{fontSize:12.5,color:C.gold,fontWeight:600,letterSpacing:1}}>
            {new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}
          </div>
          <h1 className="serif" style={{color:C.ivory,fontSize:24,lineHeight:1.3,margin:"8px 0 6px"}}>
            {currentUser?`Paz, ${currentUser.name?.split(" ")[0]}.`:"Bem-vindo à nossa família de fé."}
          </h1>
          <p style={{color:`${C.ivory}cc`,fontSize:13.5,margin:"0 0 18px",lineHeight:1.5}}>
            "Porque onde estiverem dois ou três reunidos em meu nome, aí estou eu no meio deles." — Mt 18:20
          </p>
          {!currentUser && (
            <button onClick={()=>onNavigate("auth")} style={{background:C.gold,color:C.navy,border:"none",borderRadius:9,padding:"11px 20px",fontSize:13.5,fontWeight:700,display:"flex",alignItems:"center",gap:8}}>
              <LogIn size={16}/> Entrar na área de membros
            </button>
          )}
        </div>
      </div>
      <div style={{padding:"20px 18px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:26}}>
          {[{icon:Calendar,label:"Agenda",tab:"calendario"},{icon:BookOpen,label:"Bíblia",tab:"biblia"},{icon:Heart,label:"Oração",tab:"oracao"},{icon:Radio,label:"Ao Vivo",tab:"transmissao"}].map(a=>(
            <button key={a.tab} onClick={()=>onNavigate(a.tab)} style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:"14px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <a.icon size={19} color={C.navy}/><span style={{fontSize:10.5,fontWeight:600,color:C.ink}}>{a.label}</span>
            </button>
          ))}
        </div>
        {pinnedNews && (
          <div onClick={()=>onNavigate("avisos")} style={{background:`${C.terracotta}10`,border:`1px solid ${C.terracotta}33`,borderRadius:12,padding:16,marginBottom:24,cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}><Bell size={14} color={C.terracotta}/><span style={{fontSize:11,fontWeight:700,color:C.terracotta,letterSpacing:.5}}>AVISO FIXADO</span></div>
            <div style={{fontWeight:700,fontSize:14.5,color:C.ink,marginBottom:4}}>{pinnedNews.title}</div>
            <div style={{fontSize:13,color:`${C.ink}99`,lineHeight:1.5}}>{pinnedNews.body}</div>
          </div>
        )}
        <SectionHeader title="Próximos Eventos" action="Ver agenda" onAction={()=>onNavigate("calendario")}/>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
          {upcoming.length===0 && <p style={{fontSize:13,color:`${C.ink}77`,textAlign:"center",padding:"16px 0"}}>Nenhum evento próximo cadastrado.</p>}
          {upcoming.map(e=><EventCard key={e.id} event={e} compact/>)}
        </div>
        <SectionHeader title="Explore"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{icon:History,label:"Nossa História",desc:"Desde 1978",tab:"historia",color:C.navy},{icon:Users,label:"Ministérios",desc:"6 áreas ativas",tab:"ministerios",color:C.terracotta},{icon:ImageIcon,label:"Galeria",desc:"Fotos e momentos",tab:"fotos",color:C.olive},{icon:DollarSign,label:"Dízimos",desc:"Contribua online",tab:"doacoes",color:C.gold}].map(c=>(
            <button key={c.tab} onClick={()=>onNavigate(c.tab)} style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:14,textAlign:"left",display:"flex",flexDirection:"column",gap:8}}>
              <c.icon size={20} color={c.color}/>
              <div><div style={{fontWeight:700,fontSize:13.5}}>{c.label}</div><div style={{fontSize:11.5,color:`${C.ink}88`}}>{c.desc}</div></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Calendar Screen ─────────────────────────────────────── */
function CalendarScreen({ events, setEvents, isLeader, show, addEvent:fbAdd, deleteEvent:fbDelete }) {
  const [showForm,setShowForm]=useState(false);
  const [filter,setFilter]=useState("todos");
  const [form,setForm]=useState({title:"",date:"",time:"",location:"",category:"culto",description:"",restricted:false});
  const visible=events.filter(e=>filter==="todos"||e.category===filter).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const save=async()=>{
    if(!form.title.trim()||!form.date||!form.time){show("Preencha título, data e horário.");return;}
    const ref=await fbAdd(form);
    setEvents(prev=>[...prev,{...form,id:ref.id}].sort((a,b)=>String(a.date).localeCompare(String(b.date))));
    setForm({title:"",date:"",time:"",location:"",category:"culto",description:"",restricted:false});
    setShowForm(false);show("Evento adicionado!");
  };
  const del=async(id)=>{
    if(!window.confirm("Excluir este evento?"))return;
    await fbDelete(id);setEvents(prev=>prev.filter(e=>e.id!==id));show("Evento removido.");
  };
  return (
    <div style={{padding:"18px 18px 0"}}>
      <PageTitle title="Calendário" subtitle="Cultos, reuniões e eventos especiais"/>
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,marginBottom:16}}>
        {["todos","culto","oracao","ensino","jovens","especial",...(isLeader?["lideranca"]:[])].map(c=>(
          <button key={c} onClick={()=>setFilter(c)} style={{background:filter===c?C.navy:"#fff",color:filter===c?C.ivory:C.ink,border:`1px solid ${filter===c?C.navy:C.ivoryDeep}`,borderRadius:20,padding:"7px 14px",fontSize:12,fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>
            {c==="todos"?"Todos":(categoryMeta[c]?.label||c)}
          </button>
        ))}
      </div>
      {isLeader && (
        <button onClick={()=>setShowForm(!showForm)} style={{width:"100%",background:showForm?C.ivoryDeep:`${C.gold}18`,border:`1.5px dashed ${C.gold}`,borderRadius:10,padding:12,fontSize:13,fontWeight:700,color:C.navy,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {showForm?<><X size={15}/>Cancelar</>:<><Plus size={15}/>Adicionar evento</>}
        </button>
      )}
      {showForm && (
        <div style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:16,marginBottom:18,display:"flex",flexDirection:"column",gap:10}}>
          <FInput label="Título" icon={Calendar} value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="Ex: Culto de Oração"/>
          <div style={{display:"flex",gap:10}}>
            <FInput label="Data" icon={Calendar} value={form.date} onChange={v=>setForm({...form,date:v})} placeholder="" type="date"/>
            <FInput label="Horário" icon={Clock} value={form.time} onChange={v=>setForm({...form,time:v})} placeholder="" type="time"/>
          </div>
          <FInput label="Local" icon={MapPin} value={form.location} onChange={v=>setForm({...form,location:v})} placeholder="Ex: Templo Sede"/>
          <label style={{fontSize:12.5,fontWeight:600,color:`${C.ink}aa`}}>Categoria
            <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{width:"100%",padding:11,borderRadius:9,border:`1.5px solid ${C.ivoryDeep}`,marginTop:6,fontSize:14}}>
              {Object.keys(categoryMeta).map(c=><option key={c} value={c}>{categoryMeta[c].label}</option>)}
            </select>
          </label>
          <label style={{fontSize:12.5,fontWeight:600,color:`${C.ink}aa`}}>Descrição
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2} style={{width:"100%",padding:11,borderRadius:9,border:`1.5px solid ${C.ivoryDeep}`,marginTop:6,fontSize:14,resize:"vertical"}}/>
          </label>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:600}}>
            <input type="checkbox" checked={form.restricted} onChange={e=>setForm({...form,restricted:e.target.checked})}/> Visível apenas para liderança
          </label>
          <button onClick={save} style={{background:C.navy,color:C.ivory,border:"none",borderRadius:9,padding:12,fontWeight:700,fontSize:14}}>Salvar evento</button>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:10,paddingBottom:24}}>
        {visible.length===0 && <p style={{fontSize:13,color:`${C.ink}77`,textAlign:"center",padding:"20px 0"}}>Nenhum evento encontrado.</p>}
        {visible.map(e=>(
          <div key={e.id} style={{position:"relative"}}>
            <EventCard event={e}/>
            {isLeader && <button onClick={()=>del(e.id)} style={{position:"absolute",top:8,right:8,background:`${C.terracotta}15`,border:"none",borderRadius:6,padding:"4px 8px",fontSize:11,color:C.terracotta,fontWeight:700}}><X size={12}/></button>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Bible Screen ─────────────────────────────────────────── */
function BibleScreen() {
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const filtered=bibleBooks.filter(b=>b.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{padding:"18px 18px 0"}}>
      <PageTitle title="Bíblia Sagrada" subtitle="Almeida Revista e Corrigida"/>
      <div style={{position:"relative",marginBottom:18}}>
        <Search size={16} color={`${C.ink}66`} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar livro..." style={{width:"100%",padding:"12px 12px 12px 36px",borderRadius:10,border:`1.5px solid ${C.ivoryDeep}`,fontSize:14}}/>
      </div>
      {selected ? (
        <div>
          <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:C.navyLight,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:4,marginBottom:14,padding:0}}><ChevronLeft size={16}/>Voltar</button>
          <div style={{background:C.navy,borderRadius:14,padding:22,position:"relative",overflow:"hidden",marginBottom:20}}>
            <Vitral opacity={0.06} id="vt-vs"/>
            <div style={{position:"relative"}}><Quote size={22} color={C.gold}/>
              <div className="serif" style={{color:C.ivory,fontSize:17,lineHeight:1.7,margin:"10px 0"}}>{sampleVerses[selected]}</div>
              <div style={{color:C.gold,fontWeight:700,fontSize:13.5}}>{selected}</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <SectionHeader title="Versículos em Destaque"/>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
            {Object.entries(sampleVerses).map(([ref,text])=>(
              <button key={ref} onClick={()=>setSelected(ref)} style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:10,padding:14,textAlign:"left",display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontWeight:700,color:C.terracotta,fontSize:13}}>{ref}</span>
                <span style={{fontSize:12.5,color:`${C.ink}88`,lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical"}}>{text}</span>
              </button>
            ))}
          </div>
          <SectionHeader title="Livros da Bíblia"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,paddingBottom:24}}>
            {filtered.map(b=><div key={b} style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:9,padding:"11px 13px",fontSize:13,fontWeight:600,color:C.ink}}>{b}</div>)}
            {filtered.length===0 && <div style={{gridColumn:"1/-1",textAlign:"center",fontSize:13,color:`${C.ink}77`,padding:"20px 0"}}>Nenhum livro encontrado.</div>}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Prayer Screen ────────────────────────────────────────── */
function PrayerScreen({ prayers, setPrayers, userProfile, show, addPrayer:fbAdd, incrementPrayed:fbInc }) {
  const [showForm,setShowForm]=useState(false);
  const [request,setRequest]=useState("");
  const [isPublic,setIsPublic]=useState(true);
  const submit=async()=>{
    if(!request.trim()){show("Escreva seu pedido.");return;}
    const data={name:userProfile?.name||"Anônimo",request:request.trim(),isPublic,prayedBy:0,date:new Date().toISOString().slice(0,10)};
    const ref=await fbAdd(data);
    setPrayers(prev=>[{...data,id:ref.id},...prev]);
    setRequest("");setShowForm(false);show("Pedido enviado. Estamos orando! 🙏");
  };
  const pray=async(id)=>{
    await fbInc(id);
    setPrayers(prev=>prev.map(p=>p.id===id?{...p,prayedBy:(p.prayedBy||0)+1}:p));
    show("Você orou por este pedido 🙏");
  };
  return (
    <div style={{padding:"18px 18px 0"}}>
      <PageTitle title="Mural de Oração" subtitle="Ore conosco e compartilhe seu pedido"/>
      <button onClick={()=>setShowForm(!showForm)} style={{width:"100%",background:showForm?C.ivoryDeep:C.navy,color:showForm?C.ink:C.ivory,border:"none",borderRadius:10,padding:13,fontSize:13.5,fontWeight:700,marginBottom:18,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        {showForm?<><X size={15}/>Cancelar</>:<><Heart size={15}/>Compartilhar pedido de oração</>}
      </button>
      {showForm && (
        <div style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:16,marginBottom:18}}>
          <textarea value={request} onChange={e=>setRequest(e.target.value)} placeholder="Compartilhe seu pedido de oração..." rows={4} style={{width:"100%",padding:12,borderRadius:9,border:`1.5px solid ${C.ivoryDeep}`,fontSize:14,resize:"vertical",marginBottom:12}}/>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:600,marginBottom:14}}>
            <input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(e.target.checked)}/> Exibir no mural público
          </label>
          <button onClick={submit} style={{width:"100%",background:C.terracotta,color:"#fff",border:"none",borderRadius:9,padding:12,fontWeight:700,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Send size={15}/>Enviar pedido</button>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:10,paddingBottom:24}}>
        {prayers.filter(p=>p.isPublic).map(p=>(
          <div key={p.id} style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:15}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontWeight:700,fontSize:13}}>{p.name}</span>
              <span style={{fontSize:11.5,color:`${C.ink}77`}}>{p.date?formatShort(p.date):""}</span>
            </div>
            <p style={{fontSize:13.5,color:C.ink,lineHeight:1.5,margin:"0 0 12px"}}>{p.request}</p>
            <button onClick={()=>pray(p.id)} style={{background:`${C.olive}12`,border:`1px solid ${C.olive}44`,color:C.olive,borderRadius:8,padding:"7px 14px",fontSize:12.5,fontWeight:700,display:"flex",alignItems:"center",gap:6}}><Heart size={13}/>Orar ({p.prayedBy||0})</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── News Screen ──────────────────────────────────────────── */
function NewsScreen({ news, setNews, isLeader, userProfile, show, addNews:fbAdd, togglePinNews:fbPin, deleteNews:fbDel }) {
  const [showForm,setShowForm]=useState(false);
  const [title,setTitle]=useState("");
  const [body,setBody]=useState("");
  const publish=async()=>{
    if(!title.trim()||!body.trim()){show("Preencha título e conteúdo.");return;}
    const data={title,body,author:userProfile?.name||"Liderança",date:new Date().toISOString().slice(0,10),pinned:false};
    const ref=await fbAdd(data);
    setNews(prev=>[{...data,id:ref.id},...prev]);
    setTitle("");setBody("");setShowForm(false);show("Aviso publicado!");
  };
  const del=async(id)=>{
    await fbDel(id);setNews(prev=>prev.filter(n=>n.id!==id));show("Aviso removido.");
  };
  const pin=async(id,pinned)=>{
    await fbPin(id,!pinned);setNews(prev=>prev.map(n=>n.id===id?{...n,pinned:!pinned}:n));
  };
  const sorted=[...news].sort((a,b)=>(b.pinned-a.pinned)||String(b.date).localeCompare(String(a.date)));
  return (
    <div style={{padding:"18px 18px 0"}}>
      <PageTitle title="Avisos e Mural" subtitle="Fique por dentro das novidades da igreja"/>
      {isLeader && (
        <button onClick={()=>setShowForm(!showForm)} style={{width:"100%",background:showForm?C.ivoryDeep:`${C.gold}18`,border:`1.5px dashed ${C.gold}`,borderRadius:10,padding:12,fontSize:13,fontWeight:700,color:C.navy,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {showForm?<><X size={15}/>Cancelar</>:<><Plus size={15}/>Publicar aviso</>}
        </button>
      )}
      {showForm && (
        <div style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:16,marginBottom:18,display:"flex",flexDirection:"column",gap:10}}>
          <FInput label="Título" icon={Bell} value={title} onChange={setTitle} placeholder="Título do aviso"/>
          <label style={{fontSize:12.5,fontWeight:600,color:`${C.ink}aa`}}>Conteúdo
            <textarea value={body} onChange={e=>setBody(e.target.value)} rows={3} style={{width:"100%",padding:11,borderRadius:9,border:`1.5px solid ${C.ivoryDeep}`,marginTop:6,fontSize:14,resize:"vertical"}}/>
          </label>
          <button onClick={publish} style={{background:C.navy,color:C.ivory,border:"none",borderRadius:9,padding:12,fontWeight:700,fontSize:14}}>Publicar</button>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:12,paddingBottom:24}}>
        {sorted.map(n=>(
          <div key={n.id} style={{background:"#fff",border:`1px solid ${n.pinned?C.gold:C.ivoryDeep}`,borderRadius:12,padding:16,borderLeftWidth:4,borderLeftColor:n.pinned?C.gold:C.navyLight}}>
            {n.pinned && <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}><Star size={12} color={C.gold} fill={C.gold}/><span style={{fontSize:10.5,fontWeight:700,color:C.gold}}>FIXADO</span></div>}
            <div style={{fontWeight:700,fontSize:15,marginBottom:5}}>{n.title}</div>
            <p style={{fontSize:13.5,color:`${C.ink}99`,lineHeight:1.55,margin:"0 0 10px"}}>{n.body}</p>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11.5,color:`${C.ink}77`}}>
              <span>{n.author} · {formatDate(n.date)}</span>
              {isLeader && (
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>pin(n.id,n.pinned)} style={{background:`${C.gold}15`,border:"none",borderRadius:6,padding:"4px 8px",fontSize:11,color:C.gold,fontWeight:700}}>{n.pinned?"Desafixar":"Fixar"}</button>
                  <button onClick={()=>del(n.id)} style={{background:`${C.terracotta}15`,border:"none",borderRadius:6,padding:"4px 8px",fontSize:11,color:C.terracotta,fontWeight:700}}>Excluir</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Devotional Screen ────────────────────────────────────── */
function DevotionalScreen({ devotional }) {
  const fallback={title:"Firmados na Rocha",verse:"Mateus 7:24-25",text:"Jesus encerra o Sermão do Monte com uma parábola direta: o sábio edifica sobre a rocha, o insensato sobre a areia. A diferença não aparece em dia de sol — aparece na tempestade. Que hoje possamos examinar sobre o que temos edificado nossa vida, nossa família e nossas decisões. A Palavra de Deus é o único fundamento que permanece quando tudo ao redor balança.",date:new Date().toISOString().slice(0,10)};
  const d=devotional||fallback;
  return (
    <div style={{padding:"18px 18px 0"}}>
      <PageTitle title="Devocional Diário" subtitle={formatDate(d.date)}/>
      <div style={{background:`linear-gradient(160deg,${C.navy},${C.navyMid})`,borderRadius:16,padding:22,position:"relative",overflow:"hidden",marginBottom:22}}>
        <Vitral opacity={0.07} id="vt-dv"/>
        <div style={{position:"relative"}}><Star size={20} color={C.gold} fill={C.gold}/>
          <h2 className="serif" style={{color:C.ivory,fontSize:21,margin:"10px 0 6px"}}>{d.title}</h2>
          <div style={{color:C.gold,fontSize:13,fontWeight:700,marginBottom:16}}>{d.verse}</div>
          <p style={{color:`${C.ivory}dd`,fontSize:14.5,lineHeight:1.75,margin:0}}>{d.text}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Photos Screen ────────────────────────────────────────── */
const seedPhotos=[
  {id:"f1",album:"Culto de Celebração",caption:"Domingo de celebração — Junho 2026",color:C.navyLight},
  {id:"f2",album:"Batismo",caption:"Batismo nas águas — Maio 2026",color:C.terracotta},
  {id:"f3",album:"Acampamento de Jovens",caption:"Acampamento 2026",color:C.olive},
  {id:"f4",album:"Ação Social",caption:"Campanha do Agasalho 2025",color:C.gold},
  {id:"f5",album:"Casamentos",caption:"Cerimônias realizadas em 2026",color:C.navy},
  {id:"f6",album:"EBD",caption:"Escola Bíblica Dominical",color:C.terracotta},
];
function PhotosScreen() {
  const [sel,setSel]=useState(null);
  return (
    <div style={{padding:"18px 18px 0"}}>
      <PageTitle title="Galeria de Fotos" subtitle="Momentos da nossa caminhada"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,paddingBottom:24}}>
        {seedPhotos.map(p=>(
          <button key={p.id} onClick={()=>setSel(p)} style={{border:"none",borderRadius:12,overflow:"hidden",position:"relative",height:130,padding:0,background:`linear-gradient(150deg,${p.color},${p.color}cc)`}}>
            <Vitral opacity={0.15} id={`vt-ph-${p.id}`}/>
            <ImageIcon size={22} color="#fff" style={{position:"absolute",top:10,left:10,opacity:.85}}/>
            <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,.6))",padding:"20px 10px 10px",textAlign:"left"}}>
              <div style={{color:"#fff",fontSize:12,fontWeight:700}}>{p.album}</div>
            </div>
          </button>
        ))}
      </div>
      {sel && (
        <div onClick={()=>setSel(null)} style={{position:"fixed",inset:0,background:"rgba(11,31,58,.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"#fff",borderRadius:14,overflow:"hidden",maxWidth:380,width:"100%"}} onClick={e=>e.stopPropagation()}>
            <div style={{height:200,background:`linear-gradient(150deg,${sel.color},${sel.color}cc)`,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Vitral opacity={0.15} id="vt-modal"/><ImageIcon size={44} color="#fff" style={{position:"relative"}}/>
            </div>
            <div style={{padding:16}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{sel.album}</div>
              <div style={{fontSize:13,color:`${C.ink}88`}}>{sel.caption}</div>
              <button onClick={()=>setSel(null)} style={{marginTop:14,width:"100%",background:C.ivoryDeep,border:"none",borderRadius:8,padding:10,fontWeight:600,fontSize:13}}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── History Screen ───────────────────────────────────────── */
function HistoryScreen() {
  return (
    <div style={{padding:"18px 18px 0"}}>
      <PageTitle title="Nossa História" subtitle="A trajetória da Igreja Bíblica Batista de Pacatuba"/>
      <div style={{position:"relative",paddingLeft:22,paddingBottom:24}}>
        <div style={{position:"absolute",left:6,top:6,bottom:6,width:2,background:C.ivoryDeep}}/>
        {churchHistory.map((h,i)=>(
          <div key={i} style={{position:"relative",marginBottom:24}}>
            <div style={{position:"absolute",left:-22,top:2,width:14,height:14,borderRadius:7,background:C.navy,border:`3px solid ${C.gold}`}}/>
            <div className="serif" style={{color:C.terracotta,fontWeight:700,fontSize:17,marginBottom:4}}>{h.year}</div>
            <p style={{fontSize:13.5,color:C.ink,lineHeight:1.6,margin:0}}>{h.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Ministries Screen ────────────────────────────────────── */
function MinistriesScreen() {
  return (
    <div style={{padding:"18px 18px 0"}}>
      <PageTitle title="Ministérios" subtitle="Sirva conosco em uma destas áreas"/>
      <div style={{display:"flex",flexDirection:"column",gap:10,paddingBottom:24}}>
        {seedMinistries.map(m=>(
          <div key={m.id} style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:16}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:4,color:C.navy}}>{m.name}</div>
            <p style={{fontSize:13,color:`${C.ink}99`,lineHeight:1.5,margin:"0 0 10px"}}>{m.description}</p>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:`${C.ink}88`,alignItems:"center"}}>
              <span>Líder: <strong style={{color:C.ink}}>{m.leader}</strong></span>
              <span style={{display:"flex",alignItems:"center",gap:4,color:C.terracotta,fontWeight:600}}><Mail size={12}/>{m.contact}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Live Screen ──────────────────────────────────────────── */
function LiveScreen() {
  return (
    <div style={{padding:"18px 18px 0"}}>
      <PageTitle title="Transmissão ao Vivo" subtitle="Acompanhe nossos cultos online"/>
      <div style={{background:C.navy,borderRadius:14,aspectRatio:"16/9",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:10,position:"relative",overflow:"hidden",marginBottom:18}}>
        <Vitral opacity={0.07} id="vt-live"/>
        <Radio size={30} color={C.gold} style={{position:"relative"}}/>
        <span style={{position:"relative",color:C.ivory,fontSize:13.5,fontWeight:600}}>Nenhuma transmissão no momento</span>
        <span style={{position:"relative",color:`${C.ivory}99`,fontSize:11.5}}>Próxima: Domingo às 18h</span>
      </div>
      <SectionHeader title="Onde assistir"/>
      <div style={{display:"flex",flexDirection:"column",gap:10,paddingBottom:24}}>
        {[{name:"YouTube — IBB Pacatuba",desc:"Canal oficial com transmissões e cultos gravados"},{name:"Instagram — @ibbpacatuba",desc:"Transmissões especiais e bastidores"}].map(p=>(
          <div key={p.name} style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:15,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div><div style={{fontWeight:700,fontSize:13.5}}>{p.name}</div><div style={{fontSize:12,color:`${C.ink}88`}}>{p.desc}</div></div>
            <ChevronRight size={18} color={`${C.ink}55`}/>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Donations Screen ─────────────────────────────────────── */
function DonationsScreen({ show }) {
  const pixKey="12.345.678/0001-90";
  const copy=()=>{navigator.clipboard?.writeText(pixKey).catch(()=>{});show("Chave PIX copiada!");};
  return (
    <div style={{padding:"18px 18px 0"}}>
      <PageTitle title="Dízimos e Ofertas" subtitle={'\"Trazei todos os dízimos\" — Malaquias 3:10'}/>
      <div style={{background:`linear-gradient(160deg,${C.navy},${C.navyMid})`,borderRadius:16,padding:22,position:"relative",overflow:"hidden",marginBottom:18}}>
        <Vitral opacity={0.07} id="vt-don"/>
        <div style={{position:"relative"}}>
          <div style={{color:C.gold,fontSize:11.5,fontWeight:700,letterSpacing:1,marginBottom:8}}>CHAVE PIX (CNPJ)</div>
          <div style={{color:C.ivory,fontSize:19,fontWeight:700,marginBottom:14,letterSpacing:.5}}>{pixKey}</div>
          <button onClick={copy} style={{background:C.gold,color:C.navy,border:"none",borderRadius:9,padding:"11px 18px",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:8}}><Copy size={15}/>Copiar chave PIX</button>
        </div>
      </div>
      <div style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:16,marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>Dados bancários</div>
        {[["Banco","Banco do Brasil"],["Agência","1234-5"],["Conta corrente","12345-6"],["Favorecido","Igreja Bíblica Batista de Pacatuba"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.ivoryDeep}`,fontSize:13}}>
            <span style={{color:`${C.ink}88`}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{fontSize:12,color:`${C.ink}77`,lineHeight:1.6,paddingBottom:24}}>Sua contribuição sustenta o trabalho da igreja, os ministérios e as ações sociais na comunidade de Pacatuba.</div>
    </div>
  );
}

/* ── Profile Screen ───────────────────────────────────────── */
function ProfileScreen({ userProfile:p, show, onNavigate, isLeader, isAdmin, onLogout }) {
  if(!p)return null;
  return (
    <div style={{padding:"18px 18px 0"}}>
      <div style={{background:`linear-gradient(160deg,${C.navy},${C.navyMid})`,borderRadius:16,padding:22,display:"flex",alignItems:"center",gap:16,marginBottom:20,position:"relative",overflow:"hidden"}}>
        <Vitral opacity={0.06} id="vt-pf"/>
        <div style={{position:"relative",width:58,height:58,borderRadius:29,background:`${C.gold}22`,border:`2px solid ${C.gold}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span className="serif" style={{color:C.gold,fontSize:20,fontWeight:700}}>{p.name?.split(" ")[0][0]}{p.name?.split(" ")[1]?.[0]||""}</span>
        </div>
        <div style={{position:"relative"}}>
          <div style={{color:C.ivory,fontWeight:700,fontSize:16}}>{p.name}</div>
          <div style={{display:"inline-block",marginTop:4,fontSize:11,fontWeight:700,color:C.navy,background:C.gold,padding:"2px 9px",borderRadius:12}}>{roleLabel(p.role)}</div>
        </div>
      </div>
      <div style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:16,marginBottom:14}}>
        {[{icon:Mail,label:p.email},{icon:Phone,label:p.phone||"Não informado"},{icon:Clock,label:`Membro desde ${formatDate(p.joinedAt)}`},{icon:Users,label:p.ministries?.length?p.ministries.join(", "):"Nenhum ministério"}].map((r,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<3?`1px solid ${C.ivoryDeep}`:"none"}}>
            <r.icon size={15} color={C.navyLight}/><span style={{fontSize:13.5}}>{r.label}</span>
          </div>
        ))}
      </div>
      {isLeader && (
        <button onClick={()=>onNavigate("membros")} style={{width:"100%",background:`${C.terracotta}12`,border:`1px solid ${C.terracotta}44`,color:C.terracotta,borderRadius:10,padding:13,fontSize:13.5,fontWeight:700,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <Shield size={16}/>Área de Liderança
        </button>
      )}
      <button onClick={onLogout} style={{width:"100%",background:"none",border:`1.5px solid ${C.ivoryDeep}`,color:C.ink,borderRadius:10,padding:13,fontSize:13.5,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:24}}>
        <LogOut size={16}/>Sair da conta
      </button>
    </div>
  );
}

/* ── Members Screen ───────────────────────────────────────── */
function MembersScreen({ members, updateMemberRole, setMembers, show }) {
  const [search,setSearch]=useState("");
  const stats=[{label:"Total",value:members.length},{label:"Líderes",value:members.filter(u=>u.role==="lider"||u.role==="admin").length},{label:"Ministérios",value:seedMinistries.length}];
  const filtered=members.filter(u=>u.name?.toLowerCase().includes(search.toLowerCase()));
  const changeRole=async(uid,role)=>{
    await updateMemberRole(uid,role);
    setMembers(prev=>prev.map(m=>m.uid===uid?{...m,role}:m));
    show("Perfil atualizado!");
  };
  return (
    <div style={{padding:"18px 18px 0"}}>
      <PageTitle title="Área de Liderança" subtitle="Visão geral dos membros e da igreja"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:20}}>
        {stats.map(s=>(
          <div key={s.label} style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:"14px 8px",textAlign:"center"}}>
            <div className="serif" style={{fontSize:22,fontWeight:700,color:C.navy}}>{s.value}</div>
            <div style={{fontSize:10,color:`${C.ink}88`,marginTop:2,lineHeight:1.3}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{position:"relative",marginBottom:14}}>
        <Search size={16} color={`${C.ink}66`} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar membro..." style={{width:"100%",padding:"12px 12px 12px 36px",borderRadius:10,border:`1.5px solid ${C.ivoryDeep}`,fontSize:14}}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,paddingBottom:24}}>
        {filtered.map(u=>(
          <div key={u.uid} style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:13,display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:38,height:38,borderRadius:19,background:`${roleColor(u.role)}18`,display:"flex",alignItems:"center",justifyContent:"center",color:roleColor(u.role),fontWeight:700,fontSize:13,flexShrink:0}} className="serif">
              {u.name?.split(" ")[0][0]}{u.name?.split(" ")[1]?.[0]||""}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:13.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</div>
              <div style={{fontSize:11.5,color:`${C.ink}88`}}>{u.email}</div>
            </div>
            <select value={u.role} onChange={e=>changeRole(u.uid,e.target.value)} style={{fontSize:11,fontWeight:700,color:roleColor(u.role),background:`${roleColor(u.role)}15`,border:`1px solid ${roleColor(u.role)}44`,borderRadius:8,padding:"4px 6px"}}>
              <option value="membro">Membro</option>
              <option value="lider">Líder</option>
              <option value="admin">Pastor/Admin</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── More Screen ──────────────────────────────────────────── */
function MoreScreen({ onNavigate, currentUser, isLeader, canMembers, hasDashboard }) {
  const items=[
    {icon:Star,label:"Devocional Diário",tab:"devocional",desc:"Reflexão diária da Palavra"},
    {icon:Bell,label:"Avisos e Mural",tab:"avisos",desc:"Notícias e comunicados"},
    {icon:Users,label:"Ministérios",tab:"ministerios",desc:"Conheça e participe"},
    {icon:ImageIcon,label:"Galeria de Fotos",tab:"fotos",desc:"Álbuns de eventos"},
    {icon:History,label:"Nossa História",tab:"historia",desc:"Desde 1978"},
    {icon:DollarSign,label:"Dízimos e Ofertas",tab:"doacoes",desc:"Contribua com a igreja"},
    ...(currentUser?[{icon:User,label:"Meu Perfil",tab:"perfil",desc:"Seus dados e conta"}]:[]),
    ...(canMembers?[{icon:Users,label:"Lista de Membros",tab:"membros",desc:"Cadastro e gestão"}]:[]),
    ...(hasDashboard?[{icon:Shield,label:"Dashboard Admin",tab:"dashboard",desc:"Painel administrativo"}]:[]),
  ];
  return (
    <div style={{padding:"18px 18px 0"}}>
      <PageTitle title="Mais opções" subtitle="Tudo da igreja em um só lugar"/>
      <div style={{display:"flex",flexDirection:"column",gap:8,paddingBottom:24}}>
        {items.map(it=>(
          <button key={it.tab} onClick={()=>onNavigate(it.tab)} style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:14,display:"flex",alignItems:"center",gap:14,textAlign:"left"}}>
            <div style={{width:38,height:38,borderRadius:10,background:`${C.navy}0e`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <it.icon size={18} color={C.navy}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14}}>{it.label}</div>
              <div style={{fontSize:11.5,color:`${C.ink}88`}}>{it.desc}</div>
            </div>
            <ChevronRight size={17} color={`${C.ink}44`}/>
          </button>
        ))}
        {!currentUser && (
          <button onClick={()=>onNavigate("auth")} style={{background:C.navy,color:C.ivory,border:"none",borderRadius:12,padding:14,display:"flex",alignItems:"center",gap:14,textAlign:"left",marginTop:6}}>
            <div style={{width:38,height:38,borderRadius:10,background:`${C.gold}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><LogIn size={18} color={C.gold}/></div>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>Entrar / Cadastrar</div><div style={{fontSize:11.5,color:`${C.ivory}99`}}>Acesse a área de membros</div></div>
          </button>
        )}
      </div>
    </div>
  );
}
