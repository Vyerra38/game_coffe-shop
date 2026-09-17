import React, { useState } from 'react';
import { PlayerStats, GameSettings } from '../types';
import { SHOP_UPGRADES, getUpgradeCost } from '../game/upgradesData';
import { soundManager } from '../audio/soundManager';
import { X, Check, DollarSign, ArrowUpRight, Sparkles } from 'lucide-react';

interface ShopModalProps {
  stats: PlayerStats;
  settings: GameSettings;
  onPurchaseUpgrade: (upgradeId: string, cost: number) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  stats,
  settings,
  onPurchaseUpgrade,
  onClose
}) => {
  const isId = settings.language === 'id';
  const [activeCategory, setActiveCategory] = useState<'all' | 'machine' | 'furniture' | 'decor' | 'staff'>('all');

  const getUpgradeCurrentLevel = (upgradeId: string): number => {
    switch (upgradeId) {
      case 'machine_upgrade':
        return stats.machineLevel;
      case 'tables_upgrade':
        return stats.tableCount;
      case 'decor_upgrade':
        return stats.decorLevel;
      case 'staff_upgrade':
        return stats.staffLevel;
      default:
        return 1;
    }
  };

  const handleBuy = (upgradeId: string, cost: number, currentLevel: number, maxLevel: number) => {
    if (currentLevel >= maxLevel) return;
    if (stats.money < cost) {
      soundManager.playWrong();
      return;
    }
    soundManager.playCash();
    onPurchaseUpgrade(upgradeId, cost);
  };

  const filteredUpgrades = activeCategory === 'all'
    ? SHOP_UPGRADES
    : SHOP_UPGRADES.filter(u => u.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#2e1d14] via-[#241711] to-[#190f0a] border-2 border-amber-600/70 rounded-3xl p-5 sm:p-7 shadow-2xl text-amber-50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-900/60 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
              🛍️
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                {isId ? 'Toko Upgrade Kafe' : 'Coffee Shop Upgrades'}
              </h2>
              <p className="text-xs text-amber-200/70">
                {isId ? 'Kembangkan coffee shop impianmu menjadi tempat favorit!' : 'Grow your cozy coffee shop into the most beloved spot!'}
              </p>
            </div>
          </div>

          {/* Current Money Balance */}
          <div className="flex items-center gap-3">
            <div className="bg-[#1a100b] border border-emerald-500/50 rounded-2xl px-3.5 py-1.5 flex items-center gap-1.5 shadow-inner">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-base sm:text-lg font-bold text-white">
                ${stats.money.toFixed(2)}
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-200 flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 pb-3 overflow-x-auto scrollbar-none mb-3">
          {[
            { id: 'all', label: isId ? 'Semua' : 'All', icon: '✨' },
            { id: 'machine', label: isId ? 'Mesin Kopi' : 'Machine', icon: '☕' },
            { id: 'furniture', label: isId ? 'Meja & Kursi' : 'Seating', icon: '🪑' },
            { id: 'decor', label: isId ? 'Dekorasi' : 'Decor', icon: '🌱' },
            { id: 'staff', label: isId ? 'Barista' : 'Staff', icon: '👨‍🍳' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundManager.playClick();
                setActiveCategory(cat.id as typeof activeCategory);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-amber-950 shadow-md scale-102'
                  : 'bg-black/40 text-amber-200/70 hover:bg-black/60 border border-amber-900/30'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Upgrades List Container */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
          {filteredUpgrades.map((item) => {
            const currentLevel = getUpgradeCurrentLevel(item.id);
            const isMaxed = currentLevel >= item.maxLevel;
            const cost = getUpgradeCost(item.id, currentLevel);
            const canAfford = stats.money >= cost;

            return (
              <div
                key={item.id}
                className={`bg-[#1c110b]/90 border rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                  isMaxed
                    ? 'border-amber-900/30 opacity-75'
                    : canAfford
                      ? 'border-amber-500/50 hover:border-amber-400'
                      : 'border-amber-950'
                }`}
              >
                {/* Left: Icon & Upgrade Details */}
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-700/40 to-amber-950 border border-amber-600/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                    {item.icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">
                        {isId ? item.nameId : item.name}
                      </h3>
                      {/* Level Badges */}
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-900/80 text-amber-200 border border-amber-700/50">
                        Lv. {currentLevel} / {item.maxLevel}
                      </span>
                    </div>

                    <p className="text-xs text-amber-200/70 mt-0.5 max-w-md">
                      {isId ? item.descriptionId : item.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold mt-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{item.effectDescription}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Buy / Maxed Button */}
                <div className="w-full sm:w-auto flex items-center justify-end">
                  {isMaxed ? (
                    <div className="px-4 py-2 rounded-xl bg-amber-950/50 border border-amber-800/40 text-amber-400/70 text-xs font-bold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>{isId ? 'Maksimal' : 'Max Level'}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBuy(item.id, cost, currentLevel, item.maxLevel)}
                      disabled={!canAfford}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-amber-950 shadow-amber-500/20'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>{isId ? 'Upgrade' : 'Upgrade'}</span>
                      <span className="font-mono bg-black/20 px-2 py-0.5 rounded text-xs">
                        ${cost}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-amber-900/60 mt-3 text-center text-xs text-amber-200/50">
          {isId 
            ? 'Setiap upgrade langsung terlihat di dalam coffee shop 3D dan meningkatkan gameplay.' 
            : 'All upgrades visually appear immediately in the 3D coffee shop and boost gameplay.'}
        </div>
      </div>
    </div>
  );
};
