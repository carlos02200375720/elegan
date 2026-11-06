import { CartItem, User } from "../../tipos";
const coverImage = "/portada-elegan.jpg";
import { usePerfilLogin } from "./usePerfilLogin";
import LoginHeader from "./LoginHeader";
import LoginForm from "./LoginForm";
import LoginFooter from "./LoginFooter";

interface PerfilLoginProps {
  currentUser: User;
  cart: CartItem[];
  savedReelIds: string[];
  onBack: () => void;
  onSuccess: (user: User, restoredCart?: CartItem[]) => void;
}

export default function PerfilLogin({
  currentUser,
  cart,
  savedReelIds,
  onBack,
  onSuccess,
}: PerfilLoginProps) {
  const login = usePerfilLogin({ currentUser, cart, savedReelIds, onSuccess });

  return (
    <main className="relative min-h-screen bg-slate-50 px-5 pb-36 pt-[calc(env(safe-area-inset-top,0px)+4.5rem)] text-slate-900">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[300px] overflow-hidden">
        <img src={coverImage} alt="" className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-slate-50" />
      </div>

      <LoginHeader mode={login.mode} onBack={onBack} />

      <div className="relative z-10 -mx-5 mt-[210px] flex min-h-[calc(100vh-282px)] w-[calc(100%+2.5rem)] flex-col bg-gradient-to-b from-slate-50 via-white to-white px-5 pt-5">
        <div className="mx-auto w-full max-w-md">
          <LoginForm
            mode={login.mode}
            setMode={(mode) => {
              login.setMode(mode);
              login.setError("");
            }}
            name={login.name}
            setName={login.setName}
            email={login.email}
            setEmail={login.setEmail}
            password={login.password}
            setPassword={login.setPassword}
            passwordConfirmation={login.passwordConfirmation}
            setPasswordConfirmation={login.setPasswordConfirmation}
            showPassword={login.showPassword}
            setShowPassword={login.setShowPassword}
            cart={cart}
            savedReelIds={savedReelIds}
            error={login.error}
            onSubmit={login.handleSubmit}
          />
        </div>
      </div>

      <LoginFooter mode={login.mode} isLoading={login.isLoading} />
    </main>
  );
}
