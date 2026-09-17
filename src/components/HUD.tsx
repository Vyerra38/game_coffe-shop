import React from 'react';
import { CustomerData, DailyGoal, HeldItem, PlayerStats, GameSettings } from '../types';
import { InteractiveTarget } from '../game/threeScene';
import { 
  Coffee, 
  DollarSign, 
  Star, 
  ShoppingBag, 
  Settings as SettingsIcon, 
  Volume2, 
  VolumeX, 
  Clock, 
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface HUDProps {
  stats: PlayerStats;
  dayTimeRemaining: number;
  dayTotalTime: number;
  currentOrders: CustomerData[];
  dailyGoal: DailyGoal;
  heldItem: HeldItem | null;
  interactiveTarget: InteractiveTarget | null;
  settings: GameSettings;
  onOpenShop: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onToggleMusic: () => void;
  onInteract: () => void;
  onDiscardItem: () => void;
  onSelectCustomer?: (customer: CustomerData) => void;
  // Touch controls
  onTouchMove?: (dx: number, dy: number) => void;
  onTouchStop?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  dayTimeRemaining,
  dayTotalTime,
  currentOrders,
  dailyGoal,
  heldItem,
  interactiveTarget,
  settings,
  onOpenShop,
  onOpenSettings,
  onOpenHelp,
  onToggleMusic,
  onInteract,
  onDiscardItem,
  onSelectCustomer,
  onTouchMove,
  onTouchStop
}) => {
  const isId = settings.language === 'id';
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const dayProgressPercent = Math.max(0, Math.min(100, (1 - dayTimeRemaining / dayTotalTime) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5 font-sans overflow-hidden">
      {/* --- TOP BAR --- */}
      <div className="flex items-start justify-between w-full pointer-events-auto gap-2">
        {/* Left: Day & Time */}
        <div className="bg-[#241711]/90 backdrop-blur-md border border-[#5d3a1a]/60 text-amber-50 rounded-2xl px-3.5 py-2.5 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-inner text-white font-bold text-sm">
            D{stats.day}
          </div>
          <div>
            <div className="text-xs font-medium tracking-wide text-amber-200/80 uppercase">
              {isId ? `HARI KE-${stats.day}` : `DAY ${stats.day}`}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-100">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatTime(dayTimeRemaining)}</span>
            </div>
          </div>
          {/* Day Progress Line */}
          <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden ml-1 hidden sm:block">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-300"
              style={{ width: `${dayProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Center: Financial & Reputation Counters */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Money Counter */}
          <div className="bg-[#241711]/90 backdrop-blur-md border border-[#5d3a1a]/60 rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/80 flex items-center justify-center text-emerald-200 font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs text-amber-200/70 block leading-tight">
                {isId ? 'Kas Toko' : 'Cash'}
              </span>
              <span className="text-lg sm:text-xl font-bold text-white tracking-tight">
                ${stats.money.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Reputation Stars */}
          <div className="bg-[#241711]/90 backdrop-blur-md border border-[#5d3a1a]/60 rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/80 flex items-center justify-center text-amber-950 font-bold">
              <Star className="w-4 h-4 fill-current" />
            </div>
            <div className="text-left">
              <span className="text-xs text-amber-200/70 block leading-tight">
                {isId ? 'Reputasi' : 'Reputation'}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-base sm:text-lg font-bold text-amber-300">
                  {stats.reputation.toFixed(1)}
                </span>
                <span className="text-xs text-amber-400/80">/ 5.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions (Shop, Audio, Help, Settings) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenShop}
            id="hud-shop-btn"
            className="bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-bold px-3.5 py-2.5 rounded-2xl shadow-lg border border-amber-400/40 flex items-center gap-2 transition active:scale-95 cursor-pointer text-white"
            title={isId ? 'Toko Upgrade' : 'Shop Upgrades'}
          >
            <ShoppingBag className="w-4 h-4 text-amber-200" />
            <span className="text-sm font-semibold hidden md:inline">
              {isId ? 'Upgrade' : 'Shop'}
            </span>
          </button>

          <button
            onClick={onToggleMusic}
            className="w-10 h-10 rounded-2xl bg-[#241711]/90 hover:bg-[#342218] border border-[#5d3a1a]/60 text-amber-200 flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
            title={settings.musicVolume > 0 ? 'Mute Music' : 'Unmute Music'}
          >
            {settings.musicVolume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
          </button>

          <button
            onClick={onOpenHelp}
            className="w-10 h-10 rounded-2xl bg-[#241711]/90 hover:bg-[#342218] border border-[#5d3a1a]/60 text-amber-200 flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
            title={isId ? 'Bantuan & Kontrol' : 'Help & Controls'}
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSettings}
            id="hud-settings-btn"
            className="w-10 h-10 rounded-2xl bg-[#241711]/90 hover:bg-[#342218] border border-[#5d3a1a]/60 text-amber-200 flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- MIDDLE SECTION: ORDERS (LEFT) & DAILY GOAL (RIGHT) --- */}
      <div className="flex items-start justify-between w-full my-auto pointer-events-none">
        {/* Left: Active Orders Queue */}
        <div className="flex flex-col gap-2 max-w-[280px] sm:max-w-xs pointer-events-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-200/90 flex items-center gap-1.5 px-2 drop-shadow-sm">
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span>{isId ? 'Pesanan Aktif' : 'Current Orders'} ({currentOrders.length})</span>
          </div>

          {currentOrders.length === 0 ? (
            <div className="bg-[#241711]/75 backdrop-blur-md border border-[#5d3a1a]/40 rounded-xl p-3 text-xs text-amber-200/60 shadow-md">
              {isId ? 'Menunggu pelanggan datang...' : 'Waiting for cozy customers to arrive...'}
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
              {currentOrders.map((customer) => {
                if (!customer.order) return null;
                const patienceRatio = Math.max(0, customer.order.currentPatience / customer.order.maxPatience);
                const patienceColor = patienceRatio > 0.6 
                  ? 'bg-emerald-500' 
                  : patienceRatio > 0.3 
                    ? 'bg-amber-400' 
                    : 'bg-rose-500 animate-pulse';

                return (
                  <div
                    key={customer.id}
                    onClick={() => onSelectCustomer && onSelectCustomer(customer)}
                    className="bg-[#241711]/90 backdrop-blur-md border border-[#5d3a1a]/80 hover:border-amber-400/70 rounded-xl p-2.5 shadow-lg transition text-left cursor-pointer active:scale-98 group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">☕</span>
                        <span className="font-bold text-xs sm:text-sm text-amber-100">
                          {customer.order.drinkName}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-300 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        ${customer.order.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-amber-200/70 mb-1">
                      <span>
                        {customer.name} {customer.tableIndex >= 0 ? `(Meja ${customer.tableIndex + 1})` : `(Kasir)`}
                      </span>
                      <span className="capitalize text-amber-300/80 font-medium">
                        {customer.type}
                      </span>
                    </div>

                    {/* Patience Bar */}
                    <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-200 ${patienceColor}`}
                        style={{ width: `${patienceRatio * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Daily Goal Card */}
        <div className="bg-[#241711]/90 backdrop-blur-md border border-[#5d3a1a]/80 rounded-2xl p-3 shadow-lg max-w-[200px] sm:max-w-xs text-right pointer-events-auto">
          <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isId ? 'Target Harian' : 'Daily Goal'}</span>
          </div>
          <div className="text-xs font-semibold text-amber-100 mb-1 leading-snug">
            {isId ? dailyGoal.titleId : dailyGoal.title}
          </div>
          <div className="flex items-center justify-end gap-1 text-xs font-bold text-white mb-1.5">
            <span>{dailyGoal.current}</span>
            <span className="text-amber-200/60">/</span>
            <span>{dailyGoal.target}</span>
          </div>
          <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden mb-1">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (dailyGoal.current / dailyGoal.target) * 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-emerald-300 font-medium">
            {isId ? `Hadiah: +$${dailyGoal.rewardMoney}` : `Reward: +$${dailyGoal.rewardMoney}`}
          </div>
        </div>
      </div>

      {/* --- BOTTOM SECTION: HELD ITEM & CONTEXTUAL INTERACTION BUTTON --- */}
      <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3 pointer-events-auto">
        {/* Left: Item in Hand */}
        <div className="flex items-center gap-2">
          {heldItem ? (
            <div className="bg-gradient-to-r from-[#3e2723] to-[#241711] border border-amber-400/80 rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-3">
              <div className="text-2xl animate-bounce">☕</div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-300 block tracking-wider">
                  {isId ? 'Sedang Membawa' : 'Holding Drink'}
                </span>
                <span className="font-bold text-sm text-white">
                  {heldItem.drinkName}
                </span>
              </div>
              <button
                onClick={onDiscardItem}
                className="ml-2 text-xs text-rose-300 hover:text-rose-100 bg-rose-950/60 hover:bg-rose-900 px-2 py-1 rounded-lg border border-rose-800/40 transition cursor-pointer"
                title={isId ? 'Buang Minuman' : 'Discard'}
              >
                {isId ? 'Buang' : 'Discard'}
              </button>
            </div>
          ) : (
            <div className="bg-[#241711]/60 backdrop-blur-sm border border-[#5d3a1a]/30 rounded-xl px-3 py-1.5 text-xs text-amber-200/50 hidden sm:block">
              {isId ? 'Tangan kosong • Dekati mesin kopi untuk membuat minuman' : 'Hands empty • Approach the coffee machine to brew'}
            </div>
          )}
        </div>

        {/* Center: Contextual [E] Action prompt */}
        {interactiveTarget && (
          <button
            onClick={onInteract}
            id="context-interact-btn"
            className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-amber-950 font-black text-sm sm:text-base px-6 py-3 rounded-2xl shadow-2xl border-2 border-amber-200/60 flex items-center gap-3 transform transition active:scale-95 cursor-pointer animate-pulse"
          >
            <span className="bg-amber-950 text-amber-300 px-2.5 py-0.5 rounded-lg text-xs font-mono font-extrabold shadow-inner">
              E / TAP
            </span>
            <span>
              {interactiveTarget.actionText} ({interactiveTarget.label})
            </span>
          </button>
        )}

        {/* Right: Controls Helper hint for keyboard */}
        <div className="text-xs text-amber-200/70 bg-[#241711]/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-[#5d3a1a]/40 hidden md:block">
          <span className="font-mono text-amber-300 font-bold">WASD / Panah</span> {isId ? 'Jalan' : 'Walk'} • <span className="font-mono text-amber-300 font-bold">E</span> {isId ? 'Interaksi' : 'Interact'}
        </div>
      </div>
    </div>
  );
};
