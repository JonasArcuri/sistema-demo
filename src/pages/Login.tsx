import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleDot, Verified, User, Lock, Eye, ArrowRight, HelpCircle, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { useWorkshop } from '../lib/WorkshopContext';

export default function Login() {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user, loading: authLoading } = useAuth();
  const { settings, loading: workshopLoading } = useWorkshop();
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');

  const loading = authLoading || workshopLoading;

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isRegistering && password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      if (isRegistering) {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-pattern relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none mesh-gradient"></div>
      
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 bg-surface-lowest rounded-xl shadow-2xl shadow-primary/10 overflow-hidden relative z-10"
      >
        {/* Left Side: Branding */}
        <section className="hidden lg:flex flex-col justify-between p-12 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px)' }}></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-secondary p-2 rounded-lg overflow-hidden flex items-center justify-center w-12 h-12">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <CircleDot className="text-white" size={32} />
                )}
              </div>
              <h1 className="font-headline font-extrabold text-2xl text-white tracking-widest uppercase">{settings.name}</h1>
            </div>
            
            <h2 className="font-headline text-5xl font-bold text-white leading-tight mb-6">
              A Excelência em <br /> <span className="text-secondary-container">Gestão Automotiva</span>
            </h2>
            <p className="text-blue-100/70 text-lg max-w-md">
              Controle total da sua oficina com a precisão que o seu negócio exige. Bem-vindo ao Velocity OS.
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                <Verified className="text-white" size={24} />
              </div>
              <div>
                <p className="text-white font-semibold">Tecnologia Atelier</p>
                <p className="text-blue-100/60 text-sm">Interface fluida e alto desempenho.</p>
              </div>
            </div>
            <div className="pt-8 border-t border-white/10">
              <p className="text-white/40 text-xs font-headline tracking-tighter uppercase">Workshop Command © 2024</p>
            </div>
          </div>
        </section>

        {/* Right Side: Form */}
        <section className="flex flex-col justify-center p-8 md:p-16 bg-surface-lowest">
          <div className="lg:hidden flex items-center gap-2 mb-12">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <CircleDot className="text-secondary" size={24} />
            )}
            <span className="font-headline font-extrabold text-primary tracking-widest uppercase text-lg">{settings.name}</span>
          </div>

          <div className="mb-10">
            <h3 className="font-headline text-3xl font-bold text-primary mb-2">
              {isRegistering ? 'Criar Conta' : 'Entrar'}
            </h3>
            <p className="text-on-surface-variant">
              {isRegistering ? 'Cadastre-se para gerenciar sua loja.' : 'Acesse o sistema com suas credenciais de usuário.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            {isRegistering && (
              <div>
                <label className="block text-sm font-semibold text-primary mb-2" htmlFor="name">Nome Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="text-on-surface-variant/40" size={20} />
                  </div>
                  <input 
                    className="w-full pl-11 pr-4 py-4 bg-surface-high border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all text-on-surface placeholder:text-on-surface-variant/40 rounded-t-lg outline-none" 
                    id="name" 
                    placeholder="Seu nome" 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-primary mb-2" htmlFor="username">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="text-on-surface-variant/40" size={20} />
                </div>
                <input 
                  className="w-full pl-11 pr-4 py-4 bg-surface-high border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all text-on-surface placeholder:text-on-surface-variant/40 rounded-t-lg outline-none" 
                  id="username" 
                  placeholder="ex: tecnico@precision.com" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-2" htmlFor="password">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-on-surface-variant/40" size={20} />
                </div>
                <input 
                  className="w-full pl-11 pr-12 py-4 bg-surface-high border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all text-on-surface placeholder:text-on-surface-variant/40 rounded-t-lg outline-none" 
                  id="password" 
                  placeholder="••••••••" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant/40 hover:text-primary transition-colors" type="button">
                  <Eye size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input className="w-5 h-5 rounded border-surface-high text-primary focus:ring-primary/20 transition-all" type="checkbox" />
                <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">Lembrar de mim</span>
              </label>
              <button 
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm font-semibold text-secondary hover:text-secondary-container transition-colors"
              >
                {isRegistering ? 'Já tenho uma conta' : 'Criar nova conta'}
              </button>
            </div>

            <button 
              className="w-full py-4 bg-secondary text-white font-headline font-bold text-lg rounded-lg shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-8" 
              type="submit"
            >
              {isRegistering ? 'Cadastrar' : 'Acessar Sistema'}
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 w-full">
              <div className="h-px bg-surface-high/50 flex-1"></div>
              <span className="text-[10px] text-on-surface-variant/60 font-bold uppercase tracking-widest">Ou acesse via OAuth</span>
              <div className="h-px bg-surface-high/50 flex-1"></div>
            </div>

            <button 
              onClick={() => signInWithGoogle()}
              className="w-full py-4 bg-white border-2 border-surface-high text-primary font-headline font-bold text-lg rounded-lg hover:bg-surface-low transition-all flex items-center justify-center gap-3 shadow-sm"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Entrar com Google
            </button>
          </div>

          <div className="mt-12 flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 w-full">
              <div className="h-px bg-surface-high/50 flex-1"></div>
              <span className="text-xs text-on-surface-variant/60 font-medium uppercase tracking-widest">Suporte Técnico</span>
              <div className="h-px bg-surface-high/50 flex-1"></div>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-surface-low hover:bg-surface-high text-on-surface-variant text-sm rounded-full transition-all">
                <HelpCircle size={16} />
                Central de Ajuda
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-surface-low hover:bg-surface-high text-on-surface-variant text-sm rounded-full transition-all">
                <Phone size={16} />
                0800 Precision
              </button>
            </div>
          </div>
        </section>
      </motion.main>

      {/* Background Decorative Element */}
      <div className="fixed bottom-0 right-0 w-[40vw] h-[400px] pointer-events-none opacity-[0.03] grayscale">
        <img 
          src="https://picsum.photos/seed/mechanical/800/600" 
          alt="Mechanical Blueprint" 
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
