import { ArrowRight, Mail, Sparkles, UserPlus } from "lucide-react";
import type { EstadoFormularioAcceso } from "./tipos";

interface Props {
  estado: EstadoFormularioAcceso;
}

export default function FormularioAcceso({ estado }: Props) {
  const {
    pestaña, setPestaña, correo, setCorreo, contraseña, setContraseña,
    errorAcceso, cargandoAcceso, nombre, setNombre, correoRegistro,
    setCorreoRegistro, contraseñaRegistro, setContraseñaRegistro,
    errorRegistro, cargandoRegistro, iniciarSesion, registrar,
  } = estado;

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col justify-between bg-white">
      <div>
        <div className="flex border-b border-slate-200 pb-3 mb-6">
          <button onClick={() => { setPestaña("login"); }} className={`text-xs font-bold px-4 py-2 rounded-xl transition-all mr-2 flex items-center space-x-2 cursor-pointer ${pestaña === "login" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`} id="btn-tab-login">
            <span>Iniciar Sesión</span>
          </button>
          <button onClick={() => { setPestaña("register"); }} className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${pestaña === "register" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`} id="btn-tab-register">
            <UserPlus className="w-3.5 h-3.5" /><span>Crear Cuenta</span>
          </button>
        </div>

        {pestaña === "login" && (
          <div className="space-y-5">
            <div><h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Iniciar Sesión</h2><p className="text-xs text-slate-500 mt-1">Ingresa con tu correo electrónico y la contraseña que configuraste al momento del registro.</p></div>
            <form onSubmit={iniciarSesion} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input type="email" placeholder="ejemplo@correo.com" value={correo} onChange={(e) => setCorreo(e.target.value)} className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 rounded-xl pl-11 pr-4 py-3 text-xs border border-slate-200 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors" id="login-email-input" required />
                </div>
              </div>
              <div><label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Contraseña</label><input type="password" placeholder="Tu contraseña registrada" value={contraseña} onChange={(e) => setContraseña(e.target.value)} className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 text-xs border border-slate-200 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors" id="login-password-input" required /></div>
              {errorAcceso && <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-xl font-medium">⚠️ {errorAcceso}</div>}
              <button type="submit" disabled={cargandoAcceso} className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-amber-500/15" id="login-submit-btn">
                {cargandoAcceso ? <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : <><span>Ingresar</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        )}

        {pestaña === "register" && (
          <div className="space-y-4 pb-4">
            <div><h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Crea tu Cuenta</h2><p className="text-xs text-slate-500 mt-1">Regístrate para acceder a tu perfil, compras y datos de tu cuenta.</p></div>
            <form onSubmit={registrar} className="space-y-3">
              <div><label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nombre Completo</label><input type="text" placeholder="Ej. Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-xs border border-slate-200 focus:bg-white focus:outline-none focus:border-amber-500 transition-colors" id="reg-name-input" required /></div>
              <div><label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Correo Electrónico</label><input type="email" placeholder="ejemplo@correo.com" value={correoRegistro} onChange={(e) => setCorreoRegistro(e.target.value)} className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-xs border border-slate-200 focus:bg-white focus:outline-none focus:border-amber-500 transition-colors" id="reg-email-input" required /></div>
              <div><label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Contraseña</label><input type="password" placeholder="Crea una contraseña segura" value={contraseñaRegistro} onChange={(e) => setContraseñaRegistro(e.target.value)} className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-xs border border-slate-200 focus:bg-white focus:outline-none focus:border-amber-500 transition-colors" id="reg-password-input" required /></div>
              <p className="text-[10px] text-slate-400 leading-tight">Podrás actualizar tus datos de envío, teléfono y foto de perfil en la página de Configuración cuando quieras.</p>
              {errorRegistro && <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl font-medium">⚠️ {errorRegistro}</div>}
              <button type="submit" disabled={cargandoRegistro} className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-amber-500/15" id="register-submit-btn">
                {cargandoRegistro ? <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : <><span>Crear Cuenta y Continuar</span><Sparkles className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
