
import React, { useState } from 'react';
import { User } from '../types';
import { auth, db } from '../services/firebase';
import * as FirebaseAuth from 'firebase/auth';
const { updateEmail, updatePassword } = FirebaseAuth as any;
import { doc, updateDoc } from 'firebase/firestore';

interface SettingsModalProps {
  currentUser: User;
  onClose: () => void;
}

const FloatingInput = ({ label, value, onChange, placeholder = "", autoFocus = false, type = "text", error = false }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || (value && value.length > 0);
  return (
    <div className="relative pt-5 pb-1">
      <input
        type={type} autoFocus={autoFocus}
        className={`w-full bg-transparent border-b outline-none text-white py-1.5 transition-all font-medium ${error ? 'border-red-500' : 'border-white/10 focus:border-blue-500'}`}
        value={value} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} onChange={onChange}
      />
      <label className={`absolute left-0 transition-all pointer-events-none uppercase font-bold tracking-tight ${isActive ? `top-0 ${error ? 'text-red-500' : 'text-blue-500'} text-[10px]` : 'top-6 text-[#7f91a4] text-[15px] font-normal'}`}>{isActive ? label : (placeholder || label)}</label>
    </div>
  );
};

const SettingsModal: React.FC<SettingsModalProps> = ({ currentUser, onClose }) => {
  const [view, setView] = useState<'MAIN' | 'EMAIL' | 'PASSWORD'>('MAIN');
  const [email, setEmail] = useState(currentUser.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpdateEmail = async () => {
    setError(null);
    if (!email.includes('@')) return setError('Некорректный email');
    setLoading(true);
    try {
      await updateEmail(auth.currentUser, email);
      // Also update Firestore to keep metadata in sync
      await updateDoc(doc(db, 'users', currentUser.id), { email });
      setSuccess('Email успешно обновлен');
      setTimeout(() => setView('MAIN'), 1500);
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') setError('Требуется перевход в аккаунт для смены почты');
      else setError('Ошибка обновления почты');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setError(null);
    if (password.length < 6) return setError('Минимум 6 символов');
    setLoading(true);
    try {
      await updatePassword(auth.currentUser, password);
      setSuccess('Пароль успешно изменен');
      setTimeout(() => setView('MAIN'), 1500);
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') setError('Требуется перевход в аккаунт для смены пароля');
      else setError('Ошибка обновления пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-[360px] bg-[#17212b] rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col border border-white/5">
        
        <div className="flex items-center p-4 border-b border-white/5 bg-[#17212b] shrink-0">
          <button onClick={view === 'MAIN' ? onClose : () => { setView('MAIN'); setError(null); setSuccess(null); }} className="text-[#7f91a4] hover:text-white p-2 transition-all">
            <i className={`fa-solid ${view === 'MAIN' ? 'fa-xmark' : 'fa-chevron-left'} text-xl`}></i>
          </button>
          <h2 className="text-[17px] font-bold flex-1 text-center pr-8">Настройки</h2>
        </div>

        <div className="p-4 overflow-y-auto no-scrollbar bg-[#0e1621]">
          {view === 'MAIN' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#17212b] rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-4 py-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest border-b border-white/5 bg-[#1c2a38]/30">Аккаунт</div>
                <button onClick={() => setView('EMAIL')} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-4 text-[#7f91a4] group-hover:text-white transition-colors">
                    <i className="fa-solid fa-envelope w-5 text-center"></i>
                    <span className="text-white text-[15px] font-medium">Электронная почта</span>
                  </div>
                  <span className="text-blue-400 text-sm font-bold truncate max-w-[120px]">{currentUser.email || 'Добавить'}</span>
                </button>
                <button onClick={() => setView('PASSWORD')} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-4 text-[#7f91a4] group-hover:text-white transition-colors">
                    <i className="fa-solid fa-lock w-5 text-center"></i>
                    <span className="text-white text-[15px] font-medium">Пароль</span>
                  </div>
                  <span className="text-blue-400 text-sm font-bold">Изменить</span>
                </button>
              </div>

              <div className="bg-[#17212b] rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-4 py-2 text-[10px] font-bold text-[#7f91a4] uppercase tracking-widest border-b border-white/5 bg-[#1c2a38]/30">Дополнительно</div>
                <div className="p-4 flex flex-col gap-1">
                  <span className="text-white text-[14px]">Автоматические обновления</span>
                  <span className="text-[#7f91a4] text-[11px]">Включено. Текущая версия: MeganNait E2EE 1.4.0</span>
                </div>
              </div>
            </div>
          )}

          {(view === 'EMAIL' || view === 'PASSWORD') && (
            <div className="space-y-6 p-2 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className={`fa-solid ${view === 'EMAIL' ? 'fa-envelope' : 'fa-lock'} text-2xl text-blue-500`}></i>
                </div>
                <h3 className="text-white font-bold">{view === 'EMAIL' ? 'Новая почта' : 'Смена пароля'}</h3>
              </div>

              {view === 'EMAIL' ? (
                <FloatingInput label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} error={!!error} />
              ) : (
                <FloatingInput label="Новый пароль" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} error={!!error} />
              )}

              {error && <p className="text-red-400 text-[11px] font-bold text-center animate-fade-in">{error}</p>}
              {success && <p className="text-green-400 text-[11px] font-bold text-center animate-fade-in">{success}</p>}

              <button 
                onClick={view === 'EMAIL' ? handleUpdateEmail : handleUpdatePassword}
                disabled={loading}
                className="w-full bg-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-xl active:scale-95 transition-all hover:brightness-110 disabled:opacity-50"
              >
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Сохранить изменения'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
