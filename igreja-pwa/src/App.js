// src/App.js
import React, { useState, useEffect } from "react";
import {
  Home, Calendar, BookOpen, Image as ImageIcon, Users, Heart,
  Bell, DollarSign, History, LogIn, LogOut, User, Lock,
  ChevronRight, Plus, X, Check, Shield, Star, Clock,
  MapPin, Phone, Mail, Send, Menu, Printer
} from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
import { loginUser, logoutUser, registerUser } from "./services/authService";
import {
  getNews, addNews, togglePinNews, deleteNews,
  getPrayers, addPrayer, incrementPrayed,
} from "./services/firestoreService";
import { roleLabel, roleColor } from "./services/permissions";
import BibleScreen from "./pages/BibleScreen";
import CalendarScreen from "./pages/CalendarScreen";
import DevotionalScreen from "./pages/DevotionalScreen";
import MembersScreen from "./pages/MembersScreen";
import DashboardScreen from "./pages/DashboardScreen";
import HistoryScreen from "./pages/HistoryScreen";
import MinistriesScreen from "./pages/MinistriesScreen";
import DonationsScreen from "./pages/DonationsScreen";
import SignatureListScreen from "./pages/SignatureListScreen";
import HomeScreen from "./pages/HomeScreen";
import ManageHomeScreen from "./pages/ManageHomeScreen";

const C = {
  navy:      "#6B0F0F",
  navyMid:   "#8B1A1A",
  navyLight: "#A52020",
  gold:      "#C8A45A",
  ivory:     "#FAF6F0",
  ivoryDeep: "#F0E8DC",
  terracotta:"#2D5A1B",
  olive:     "#3D7A25",
  ink:       "#1A1008",
};

function formatDate(val) {
  if (!val) return "";
  const iso = val?.toDate ? val.toDate().toISOString().slice(0,10) : String(val).slice(0,10);
  return new Date(iso+"T00:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"});
}
function formatShort(val) {
  if (!val) return "";
  const iso = val?.toDate ? val.toDate().toISOString().slice(0,10) : String(val).slice(0,10);
  return new Date(iso+"T00:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"});
}

function useToast() {
  const [msg, setMsg] = useState(null);
  const show = (m) => { setMsg(m); setTimeout(()=>setMsg(null),2800); };
  const Toast = msg ? (
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.navy,color:C.ivory,padding:"12px 22px",borderRadius:10,fontSize:14,fontWeight:500,boxShadow:"0 8px 24px rgba(0,0,0,.35)",zIndex:1000,border:`1px solid ${C.gold}55`,display:"flex",alignItems:"center",gap:8,maxWidth:"88%",textAlign:"center"}}>
      <Check size={16} color={C.gold}/> {msg}
    </div>
  ) : null;
  return { show, Toast };
}

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

/* ════════════════════════════════════════════════════════════
   APP ROOT
════════════════════════════════════════════════════════════ */
export default function App() {
  const {
    currentUser, userProfile, role,
    isAdmin, isLeader, canManageContent: canEdit,
    canViewMembers, canViewDashboard: hasDashboard,
    canManageMembers,
  } = useAuth();
  const { show, Toast } = useToast();
  const [tab, setTab]       = useState("inicio");
  const [menuOpen, setMenuOpen] = useState(false);
  const [news, setNews]     = useState([]);
  const [prayers, setPrayers] = useState([]);

  useEffect(() => { getNews().then(setNews).catch(()=>{}); }, []);
  useEffect(() => { getPrayers().then(setPrayers).catch(()=>{}); }, []);

  const navItems = [
    { key:"inicio",     label:"Início",    icon:Home },
    { key:"calendario", label:"Calendário",icon:Calendar },
    { key:"biblia",     label:"Bíblia",    icon:BookOpen },
    { key:"oracao",     label:"Oração",    icon:Heart },
    { key:"mais",       label:"Mais",      icon:Menu },
  ];
  const activeNav = ["inicio","calendario","biblia","oracao","mais"].includes(tab) ? tab : "mais";

  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:C.ivory,minHeight:"100vh",color:C.ink,display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto",position:"relative",boxShadow:"0 0 60px rgba(0,0,0,.08)"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        body{margin:0}button{font-family:inherit;cursor:pointer}
        input,textarea,select{font-family:inherit}
        .serif{font-family:'Lora',serif}
      `}</style>

      <Header onMenu={()=>setMenuOpen(true)} onProfile={()=>setTab(currentUser?"perfil":"auth")} userProfile={userProfile}/>

      <main style={{flex:1,paddingBottom:86,overflowX:"hidden"}}>
        {tab==="auth"        && !currentUser && <AuthScreen show={show} onSuccess={()=>setTab("inicio")}/>}
        {tab==="inicio"      && <HomeScreen currentUser={userProfile} onNavigate={setTab}/>}
        {tab==="gerenciar_home" && isAdmin && <ManageHomeScreen onBack={()=>setTab("dashboard")}/>}
        {tab==="calendario"  && <CalendarScreen userProfile={userProfile}/>}
        {tab==="biblia"      && <BibleScreen/>}
        {tab==="oracao"      && <PrayerScreen prayers={prayers} setPrayers={setPrayers} userProfile={userProfile} show={show} addPrayer={addPrayer} incrementPrayed={incrementPrayed}/>}
        {tab==="avisos"      && <NewsScreen news={news} setNews={setNews} isLeader={canEdit} userProfile={userProfile} show={show} addNews={addNews} togglePinNews={togglePinNews} deleteNews={deleteNews}/>}
        {tab==="devocional"  && <DevotionalScreen userProfile={userProfile}/>}
        {tab==="fotos"       && <PhotosScreen/>}
        {tab==="historia"    && <HistoryScreen userProfile={userProfile}/>}
        {tab==="ministerios" && <MinistriesScreen userProfile={userProfile}/>}
        {tab==="doacoes"     && <DonationsScreen userProfile={userProfile} show={show}/>}
        {tab==="perfil"      && currentUser && <ProfileScreen userProfile={userProfile} show={show} onNavigate={setTab} isLeader={isLeader} isAdmin={isAdmin} onLogout={async()=>{await logoutUser();setTab("inicio");show("Sessão encerrada.");}}/>}
        {tab==="membros"     && canViewMembers && <MembersScreen userProfile={userProfile}/>}
        {tab==="dashboard"   && hasDashboard && <DashboardScreen userProfile={userProfile} onNavigate={setTab}/>}
        {tab==="assinaturas"  && canManageMembers && <SignatureListScreen onBack={()=>setTab('membros')}/>}
        {tab==="mais"        && <MoreScreen onNavigate={setTab} currentUser={currentUser} isLeader={isLeader} canMembers={canViewMembers} hasDashboard={hasDashboard}/>}
      </main>

      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.navy,display:"flex",justifyContent:"space-around",padding:"10px 4px 12px",borderTop:`1px solid ${C.gold}33`,zIndex:100}}>
        {navItems.map(item=>{
          const active = activeNav===item.key;
          return (
            <button key={item.key} onClick={()=>setTab(item.key)} style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:active?C.gold:`${C.ivory}99`,padding:"2px 10px"}}>
              <item.icon size={20} strokeWidth={active?2.4:1.8}/>
              <span style={{fontSize:10.5,fontWeight:active?700:500}}>{item.label}</span>
            </button>
          );
        })}
      </nav>

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
    ...(isAdmin?[{key:"gerenciar_home",label:"Gerenciar Home",icon:Home}]:[]),
    ...(canMembers?[{key:"assinaturas",label:"Lista de Assinaturas",icon:Printer}]:[]),
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
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:19,background:`${C.gold}22`,border:`1px solid ${C.gold}66`,display:"flex",alignItems:"center",justifyContent:"center",color:C.gold,fontWeight:700,fontSize:14}} className="serif">
                {userProfile.name?.split(" ")[0][0]}{userProfile.name?.split(" ")[1]?.[0]||""}
              </div>
              <div>
                <div style={{color:C.ivory,fontSize:14,fontWeight:600}}>{userProfile.name}</div>
                <div style={{color:C.gold,fontSize:11,fontWeight:600}}>{roleLabel(userProfile.role)}</div>
              </div>
            </div>
          ) : (
            <button onClick={()=>onNavigate("auth")} style={{background:C.gold,color:C.navy,border:"none",borderRadius:8,padding:"9px 16px",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
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
  const [mode, setMode]   = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
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
        "auth/user-not-found":"E-mail não encontrado.",
        "auth/wrong-password":"Senha incorreta.",
        "auth/email-already-in-use":"Este e-mail já está cadastrado.",
        "auth/weak-password":"A senha deve ter pelo menos 6 caracteres.",
        "auth/invalid-email":"E-mail inválido.",
      };
      setError(msgs[e.code]||"Erro ao autenticar. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <div style={{padding:"32px 24px"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <img src="/logo.png" alt="Logo IBBP" style={{width:80,height:80,objectFit:"contain",filter:"drop-shadow(0 4px 8px rgba(107,15,15,0.3))",marginBottom:14}}/>
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
          onBlur={e=>e.target.style.borderColor=C.ivoryDeep}/>
      </div>
    </label>
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
    setRequest("");setShowForm(false);show("Pedido enviado. Estamos orando!");
  };
  const pray=async(id)=>{
    await fbInc(id);
    setPrayers(prev=>prev.map(p=>p.id===id?{...p,prayedBy:(p.prayedBy||0)+1}:p));
    show("Você orou por este pedido!");
  };
  return (
    <div style={{padding:"18px 18px 0"}}>
      <div style={{marginBottom:18}}><h1 className="serif" style={{fontSize:21,color:C.navy,margin:"0 0 3px",fontWeight:700}}>Mural de Oração</h1><p style={{fontSize:12.5,color:`${C.ink}88`,margin:0}}>Ore conosco e compartilhe seu pedido</p></div>
      <button onClick={()=>setShowForm(!showForm)} style={{width:"100%",background:showForm?C.ivoryDeep:C.navy,color:showForm?C.ink:C.ivory,border:"none",borderRadius:10,padding:13,fontSize:13.5,fontWeight:700,marginBottom:18,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        {showForm?<><X size={15}/>Cancelar</>:<><Heart size={15}/>Compartilhar pedido de oração</>}
      </button>
      {showForm && (
        <div style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:16,marginBottom:18}}>
          <textarea value={request} onChange={e=>setRequest(e.target.value)} placeholder="Compartilhe seu pedido..." rows={4} style={{width:"100%",padding:12,borderRadius:9,border:`1.5px solid ${C.ivoryDeep}`,fontSize:14,resize:"vertical",marginBottom:12}}/>
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
  const del=async(id)=>{await fbDel(id);setNews(prev=>prev.filter(n=>n.id!==id));show("Aviso removido.");};
  const pin=async(id,pinned)=>{await fbPin(id,!pinned);setNews(prev=>prev.map(n=>n.id===id?{...n,pinned:!pinned}:n));};
  const sorted=[...news].sort((a,b)=>(b.pinned-a.pinned)||String(b.date).localeCompare(String(a.date)));
  return (
    <div style={{padding:"18px 18px 0"}}>
      <div style={{marginBottom:18}}><h1 className="serif" style={{fontSize:21,color:C.navy,margin:"0 0 3px",fontWeight:700}}>Avisos e Mural</h1><p style={{fontSize:12.5,color:`${C.ink}88`,margin:0}}>Fique por dentro das novidades da igreja</p></div>
      {isLeader && (
        <button onClick={()=>setShowForm(!showForm)} style={{width:"100%",background:showForm?C.ivoryDeep:`${C.gold}18`,border:`1.5px dashed ${C.gold}`,borderRadius:10,padding:12,fontSize:13,fontWeight:700,color:C.navy,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {showForm?<><X size={15}/>Cancelar</>:<><Plus size={15}/>Publicar aviso</>}
        </button>
      )}
      {showForm && (
        <div style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:16,marginBottom:18,display:"flex",flexDirection:"column",gap:10}}>
          <label style={{fontSize:12.5,fontWeight:600,color:`${C.ink}aa`}}>Título<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Título do aviso" style={{width:"100%",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${C.ivoryDeep}`,fontSize:14,marginTop:5,display:"block"}}/></label>
          <label style={{fontSize:12.5,fontWeight:600,color:`${C.ink}aa`}}>Conteúdo<textarea value={body} onChange={e=>setBody(e.target.value)} rows={3} style={{width:"100%",padding:11,borderRadius:9,border:`1.5px solid ${C.ivoryDeep}`,marginTop:6,fontSize:14,resize:"vertical",display:"block"}}/></label>
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

/* ── Photos Screen ────────────────────────────────────────── */
const seedPhotos=[
  {id:"f1",album:"Culto de Celebração",caption:"Domingo de celebração",color:C.navyLight},
  {id:"f2",album:"Batismo",caption:"Batismo nas águas",color:C.terracotta},
  {id:"f3",album:"Acampamento de Jovens",caption:"Acampamento 2026",color:C.olive},
  {id:"f4",album:"Ação Social",caption:"Campanha do Agasalho",color:C.gold},
  {id:"f5",album:"Casamentos",caption:"Cerimônias 2026",color:C.navy},
  {id:"f6",album:"EBD",caption:"Escola Bíblica Dominical",color:C.terracotta},
];
function PhotosScreen() {
  const [sel,setSel]=useState(null);
  return (
    <div style={{padding:"18px 18px 0"}}>
      <div style={{marginBottom:18}}><h1 className="serif" style={{fontSize:21,color:C.navy,margin:"0 0 3px",fontWeight:700}}>Galeria de Fotos</h1><p style={{fontSize:12.5,color:`${C.ink}88`,margin:0}}>Momentos da nossa caminhada</p></div>
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
          <Shield size={16}/>Lista de Membros
        </button>
      )}
      <button onClick={onLogout} style={{width:"100%",background:"none",border:`1.5px solid ${C.ivoryDeep}`,color:C.ink,borderRadius:10,padding:13,fontSize:13.5,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:24}}>
        <LogOut size={16}/>Sair da conta
      </button>
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
    {icon:History,label:"Nossa História",tab:"historia",desc:"Desde 2008"},
    {icon:DollarSign,label:"Dízimos e Ofertas",tab:"doacoes",desc:"Contribua com a igreja"},
    ...(currentUser?[{icon:User,label:"Meu Perfil",tab:"perfil",desc:"Seus dados e conta"}]:[]),
    ...(canMembers?[{icon:Users,label:"Lista de Membros",tab:"membros",desc:"Cadastro e gestão"}]:[]),
    ...(canMembers?[{icon:Printer,label:"Lista de Assinaturas",tab:"assinaturas",desc:"Impressão de listas de presença"}]:[]),
    ...(hasDashboard?[{icon:Shield,label:"Dashboard Admin",tab:"dashboard",desc:"Painel administrativo"}]:[]),
  ];
  return (
    <div style={{padding:"18px 18px 0"}}>
      <div style={{marginBottom:18}}><h1 className="serif" style={{fontSize:21,color:C.navy,margin:"0 0 3px",fontWeight:700}}>Mais opções</h1><p style={{fontSize:12.5,color:`${C.ink}88`,margin:0}}>Tudo da igreja em um só lugar</p></div>
      <div style={{display:"flex",flexDirection:"column",gap:8,paddingBottom:24}}>
        {items.map(it=>(
          <button key={it.tab} onClick={()=>onNavigate(it.tab)} style={{background:"#fff",border:`1px solid ${C.ivoryDeep}`,borderRadius:12,padding:14,display:"flex",alignItems:"center",gap:14,textAlign:"left"}}>
            <div style={{width:38,height:38,borderRadius:10,background:`${C.navy}0e`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><it.icon size={18} color={C.navy}/></div>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{it.label}</div><div style={{fontSize:11.5,color:`${C.ink}88`}}>{it.desc}</div></div>
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
