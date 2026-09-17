import React, { useEffect } from 'react';
import { DayStats, GameSettings } from '../types';
import { soundManager } from '../audio/soundManager';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  Star, 
  AlertCircle, 
  Smile, 
  ShoppingBag, 
  ArrowRight,
  RefreshCw 
} from 'lucide-react';

interface DaySummaryModalProps {
  stats: DayStats;
  isGoalMet: boolean;
  rewardMoney: number;
  settings: GameSettings;
  onOpenShop: () => void;
  onNextDay: () => void;
  onRetryDay: () => void;
}

export const DaySummaryModal: React.FC<DaySummaryModalProps> = ({
  stats,
  isGoalMet,
  rewardMoney,
  settings,
  onOpenShop,
  onNextDay,
  onRetryDay
}) => {
  const isId = settings.language === 'id';

  useEffect(() => {
    if (isGoalMet) {
      soundManager.playSuccess();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // confetti fallback
      }
    } else {
      soundManager.playWrong();
    }
  }, [isGoalMet]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#2e1d14] via-[#241711] to-[#180e09] border-2 border-amber-500/70 rounded-3xl p-6 sm:p-8 shadow-2xl text-amber-50 overflow-hidden">
        {/* Decorative Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />

        {/* Title & Badge */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-800 flex items-center justify-center shadow-lg text-white">
            {isGoalMet ? <Trophy className="w-8 h-8 text-amber-200" /> : <Smile className="w-8 h-8 text-amber-200" />}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isGoalMet
              ? (isId ? `HARI KE-${stats.day} SELESAI!` : `DAY ${stats.day} COMPLETE!`)
              : (isId ? `HARI KE-${stats.day} AGAK SEPI` : `DAY ${stats.day} WAS A BIT SLOW`)}
          </h2>

          <p className="text-xs sm:text-sm text-amber-200/70 mt-1 max-w-sm mx-auto">
            {isGoalMet
              ? (isId ? 'Kerja bagus! Pelanggan sangat menyukai racikan kopimu.' : 'Great job! Customers loved your fresh coffee brews.')
              : (isId ? 'Hari ini agak sepi, jangan berkecil hati. Ayo coba lagi atau lanjut ke esok hari.' : 'Today was a little slow, but keep spirits high! Try again or continue.')}
          </p>
        </div>

        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Customers Served */}
          <div className="bg-[#1c110b] border border-amber-900/50 rounded-2xl p-3 flex items-center gap-3 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-600/30 flex items-center justify-center text-blue-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-amber-200/60 uppercase block font-bold">
                {isId ? 'Pelanggan Dilayani' : 'Served'}
              </span>
              <span className="text-lg font-bold text-white">
                {stats.customersServed}
              </span>
            </div>
          </div>

          {/* Money Earned */}
          <div className="bg-[#1c110b] border border-amber-900/50 rounded-2xl p-3 flex items-center gap-3 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-600/30 flex items-center justify-center text-emerald-300">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-amber-200/60 uppercase block font-bold">
                {isId ? 'Pendapatan Kas' : 'Money Earned'}
              </span>
              <span className="text-lg font-bold text-white">
                +${stats.moneyEarned.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Customer Satisfaction */}
          <div className="bg-[#1c110b] border border-amber-900/50 rounded-2xl p-3 flex items-center gap-3 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-600/30 flex items-center justify-center text-amber-300">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-amber-200/60 uppercase block font-bold">
                {isId ? 'Kepuasan' : 'Satisfaction'}
              </span>
              <span className="text-lg font-bold text-white">
                {stats.satisfactionRate}%
              </span>
            </div>
          </div>

          {/* Reputation Impact */}
          <div className="bg-[#1c110b] border border-amber-900/50 rounded-2xl p-3 flex items-center gap-3 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-yellow-950/80 border border-yellow-600/30 flex items-center justify-center text-yellow-300">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-[10px] text-amber-200/60 uppercase block font-bold">
                {isId ? 'Reputasi' : 'Reputation'}
              </span>
              <span className="text-lg font-bold text-amber-300">
                {stats.reputationChange >= 0 ? `+${stats.reputationChange.toFixed(1)}` : `${stats.reputationChange.toFixed(1)}`} ★
              </span>
            </div>
          </div>
        </div>

        {/* Goal Reward Banner */}
        {isGoalMet && rewardMoney > 0 && (
          <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-2xl p-3 mb-6 flex items-center justify-between shadow-lg">
            <span className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
              <span>🎉</span>
              <span>{isId ? 'Bonus Target Harian Tercapai!' : 'Daily Goal Bonus Claimed!'}</span>
            </span>
            <span className="text-sm font-black text-emerald-300 font-mono">
              +${rewardMoney.toFixed(2)}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onOpenShop}
            className="w-full sm:w-1/2 py-3 px-4 rounded-2xl bg-[#342218] hover:bg-[#432d20] border border-amber-600/40 text-amber-200 font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isId ? 'Toko Upgrade' : 'Shop Upgrades'}</span>
          </button>

          {isGoalMet ? (
            <button
              onClick={onNextDay}
              id="next-day-btn"
              className="w-full sm:w-1/2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-amber-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition active:scale-95 cursor-pointer"
            >
              <span>{isId ? 'Mulai Hari Baru' : 'Start Next Day'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onRetryDay}
              className="w-full sm:w-1/2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{isId ? 'Coba Hari Ini Lagi' : 'Try Day Again'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
