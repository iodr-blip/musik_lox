import React, { useState } from 'react';
import { User, AuthStep } from '../types';
import { auth, db } from '../services/firebase';
import * as FirebaseAuth from 'firebase/auth';
const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = FirebaseAuth as any;
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';

export const MainLogo = ({ className = "w-24 h-24", white = false, glow = false }: { className?: string, white?: boolean, glow?: boolean }) => (
  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00c6ff" />
        <stop offset="100%" stopColor="#0072ff" />
      </linearGradient>
      <filter id="logoGlowEffect" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="12" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <path 
      d="M157.144 147.042L74.644 281.542H5.64401L139.644 71.0421H185.144L206.144 123.542L392.644 5.54209L323.144 144.042L392.644 147.042L234.644 298.542L283.144 187.042H247.644L291.144 104.042L181.144 201.542L157.144 147.042Z" 
      fill={white ? "white" : "url(#logoGradient)"}
      filter={glow ? "url(#logoGlowEffect)" : "none"}
      style={{ transform: 'translateX(2px) translateY(-1px)' }}
    />
  </svg>
);

interface AuthProps {
  onComplete: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onComplete }) => {
  const [step, setStep] = useState<AuthStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameHandle, setUsernameHandle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleError = (err: any) => {
    console.error("Auth Error:", err);
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
      setError('Неверная почта или пароль. Проверьте данные.');
    } else if (err.code === 'auth/email-already-in-use') {
      setError('Этот email уже зарегистрирован');
    } else if (err.code === 'auth/weak-password') {
      setError('Пароль должен быть не менее 6 символов');
    } else {
      setError('Произошла ошибка при аутентификации');
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) return setError('Заполните все поля');

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      handleError(err);
    }
  };

  const nextRegisterStep = async () => {
    setError(null);
    try {
      if (step === 'register_creds') {
        if (!email || !password || !confirmPassword) return setError('Заполните все поля');
        if (password !== confirmPassword) return setError('Пароли не совпадают');
        if (password.length < 6) return setError('Пароль слишком короткий');
        setStep('register_username');
      } else if (step === 'register_username') {
        if (!usernameHandle) return setError('Введите юзернейм');
        const cleanHandle = usernameHandle.toLowerCase().trim();
        if (!/^[a-z0-9_]+$/.test(cleanHandle)) return setError('Допустимые символы: a-z, 0-9, _');
        if (cleanHandle.length < 5) return setError('Минимум 5 символов');
        const handle = `@${cleanHandle}`;
        setLoading(true);
        const q = query(collection(db, 'users'), where('username_handle', '==', handle));
        const querySnapshot = await getDocs(q);
        setLoading(false);
        if (!querySnapshot.empty) return setError('Этот юзернейм занят');
        setStep('register_profile');
      }
    } catch (err: any) {
      handleError(err);
    }
  };

  const finishRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return setError('Имя обязательно');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      const handle = `@${usernameHandle.toLowerCase().trim()}`;
      const userData = {
        username: firstName,
        surname: lastName,
        username_handle: handle,
        email: email,
        bio: 'Пользуюсь MeganNait 💎',
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=3390ec&color=fff`,
        online: true,
        lastSeen: Date.now(),
        createdAt: Date.now(),
        verified: false
      };
      await setDoc(doc(db, 'users', fbUser.uid), userData);
    } catch (err: any) {
      handleError(err);
    }
  };

  const BackButton = () => (
    <button 
      type="button"
      onClick={() => {
        if (step === 'choice') setStep('welcome');
        else if (step === 'login') setStep('choice');
        else if (step === 'register_creds') setStep('choice');
        else if (step === 'register_username') setStep('register_creds');
        else if (step === 'register_profile') setStep('register_username');
        setError(null);
      }}
      className="absolute left-6 top-8 text-gray-500 hover:text-blue-500 transition-colors"
    >
      <i className="fa-solid fa-arrow-left text-xl"></i>
    </button>
  );

  return (
    <div className="auth-container">
      <div className="auth-box relative animate-slide-up">
        {step !== 'welcome' && <BackButton />}

        {step === 'welcome' && (
          <div className="text-center">
            <div className="auth-logo-circle overflow-hidden">
              <MainLogo white className="w-12 h-12" />
            </div>
            <h1 className="text-4xl font-black mb-1">MeganNait</h1>
            <div className="mb-8">
              <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em]">THE COMMUNICATION</p>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-[280px] mx-auto font-medium">
                Мессенджер от 14-летнего разработчика. Скорость, рожденная мечтой. Ноль рекламы. Абсолютно бесплатно.
              </p>
            </div>
            <button 
              onClick={() => setStep('choice')}
              className="w-full bg-[#3390ec] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl hover:brightness-110 active:scale-95 transition-all"
            >
              Продолжить
            </button>
          </div>
        )}

        {step === 'choice' && (
          <div className="text-center py-4">
            <h2 className="text-2xl font-black mb-10 mt-6">У вас уже есть аккаунт?</h2>
            <div className="space-y-4">
              <button 
                onClick={() => setStep('login')}
                className="w-full bg-[#3390ec] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-all"
              >
                Да, войти
              </button>
              <button 
                onClick={() => setStep('register_creds')}
                className="w-full bg-[#f1f1f1] text-gray-700 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-sm active:scale-95 transition-all"
              >
                Нет, создать
              </button>
            </div>
          </div>
        )}

        {(step === 'login' || step === 'register_creds' || step === 'register_username' || step === 'register_profile') && (
          <form onSubmit={step === 'login' ? handleLogin : step === 'register_profile' ? finishRegistration : (e) => e.preventDefault()} className="space-y-5">
            <h2 className="text-2xl font-black text-center mb-10 mt-6">
              {step === 'login' ? 'Вход' : step === 'register_creds' ? 'Регистрация' : step === 'register_username' ? 'Юзернейм' : 'Профиль'}
            </h2>
            <div className="space-y-3">
              {(step === 'login' || step === 'register_creds') && (
                <>
                  <input type="email" placeholder="Электронная почта" className="w-full p-4 bg-[#f1f1f1] rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" value={email} onChange={e => setEmail(e.target.value)} />
                  <input type="password" placeholder="Пароль" className="w-full p-4 bg-[#f1f1f1] rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" value={password} onChange={e => setPassword(e.target.value)} />
                  {step === 'register_creds' && <input type="password" placeholder="Подтвердите пароль" className="w-full p-4 bg-[#f1f1f1] rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />}
                </>
              )}
              {step === 'register_username' && (
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 font-black text-lg">@</span>
                  <input type="text" placeholder="username" className="w-full p-4 pl-12 bg-[#f1f1f1] rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-black text-lg" value={usernameHandle} onChange={e => setUsernameHandle(e.target.value)} />
                </div>
              )}
              {step === 'register_profile' && (
                <>
                  <input type="text" placeholder="Имя" className="w-full p-4 bg-[#f1f1f1] rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  <input type="text" placeholder="Фамилия (необязательно)" className="w-full p-4 bg-[#f1f1f1] rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" value={lastName} onChange={e => setLastName(e.target.value)} />
                </>
              )}
            </div>
            {error && <div className="text-red-500 text-xs text-center font-bold animate-fade-in">{error}</div>}
            <button type={step === 'login' || step === 'register_profile' ? "submit" : "button"} onClick={step === 'register_creds' || step === 'register_username' ? nextRegisterStep : undefined} disabled={loading} className="w-full bg-[#3390ec] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
              {loading ? <i className="fas fa-spinner fa-spin"></i> : step === 'login' ? 'Войти' : 'Далее'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;