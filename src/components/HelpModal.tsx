import React from 'react';
import { GameSettings } from '../types';
import { X, Coffee, Users, DollarSign, ArrowUpRight, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  settings: GameSettings;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ settings, onClose }) => {
  const isId = settings.language === 'id';

  const steps = [
    {
      num: '1',
      title: isId ? 'Terima Pesanan' : 'Receive Order',
      desc: isId ? 'Pelanggan masuk dan memilih meja atau antre di kasir.' : 'Customers enter and sit at tables or queue at counter.',
      icon: '🔔'
    },
    {
      num: '2',
      title: isId ? 'Seduh Kopi' : 'Brew Coffee',
      desc: isId ? 'Dekati mesin espresso [E] lalu ikuti resep minuman yang diminta.' : 'Walk to the espresso machine [E] and assemble the requested drink recipe.',
      icon: '☕'
    },
    {
      num: '3',
      title: isId ? 'Sajikan & Terima Uang' : 'Serve & Earn Cash',
      desc: isId ? 'Bawakan cangkir ke meja pelanggan [E] sebelum kesabaran mereka habis.' : 'Carry the cup to their table [E] before their patience bar runs out.',
      icon: '💵'
    },
    {
      num: '4',
      title: isId ? 'Upgrade & Kembangkan' : 'Upgrade & Expand',
      desc: isId ? 'Beli mesin kopi yang lebih cepat, meja baru, dekorasi cantik, dan rekrut barista!' : 'Buy faster espresso machines, more tables, cozy decor, and hire staff!',
      icon: '🌱'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#2e1d14] via-[#241711] to-[#180e09] border-2 border-amber-600/70 rounded-3xl p-5 sm:p-7 shadow-2xl text-amber-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/60 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
              📖
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                {isId ? 'Cara Bermain' : 'How to Play'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-200 flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-2.5 mb-5">
          {steps.map((s) => (
            <div key={s.num} className="bg-[#1c110b] border border-amber-900/40 rounded-2xl p-3 flex items-start gap-3">
              <span className="text-2xl shrink-0 mt-0.5">{s.icon}</span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-300">
                  {s.num}. {s.title}
                </h4>
                <p className="text-xs text-amber-100/70 mt-0.5 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Controls Guide */}
        <div className="bg-black/40 border border-amber-900/40 rounded-2xl p-3 text-xs mb-5">
          <span className="text-amber-400 font-bold block mb-1.5 uppercase tracking-wider text-[10px]">
            {isId ? 'Kontrol Navigasi:' : 'Controls Guide:'}
          </span>
          <div className="grid grid-cols-2 gap-2 text-amber-100/80">
            <div><span className="font-mono text-amber-300 font-bold">W, A, S, D</span> : {isId ? 'Berjalan' : 'Walk'}</div>
            <div><span className="font-mono text-amber-300 font-bold">E / Spasi</span> : {isId ? 'Interaksi' : 'Interact'}</div>
            <div><span className="font-mono text-amber-300 font-bold">Shift</span> : {isId ? 'Lari' : 'Run'}</div>
            <div><span className="font-mono text-amber-300 font-bold">Mouse / Touch</span> : {isId ? 'Sentuh & Tap' : 'Tap & Interact'}</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-sm shadow transition cursor-pointer"
        >
          {isId ? 'Mengerti, Ayo Main!' : 'Got it, Let\'s Play!'}
        </button>
      </div>
    </div>
  );
};
