import React, { useState, useEffect } from 'react';
import { DrinkId, DrinkRecipe, HeldItem, GameSettings } from '../types';
import { ALL_DRINKS, INGREDIENT_DETAILS } from '../game/drinkData';
import { soundManager } from '../audio/soundManager';
import { X, Check, Sparkles, Zap, Flame } from 'lucide-react';

interface DrinkCraftingModalProps {
  unlockedDrinks: DrinkId[];
  machineLevel: number;
  initialDrinkId?: DrinkId;
  settings: GameSettings;
  onFinishDrink: (item: HeldItem) => void;
  onClose: () => void;
  onTriggerSteam: () => void;
  onStopSteam: () => void;
}

export const DrinkCraftingModal: React.FC<DrinkCraftingModalProps> = ({
  unlockedDrinks,
  machineLevel,
  initialDrinkId,
  settings,
  onFinishDrink,
  onClose,
  onTriggerSteam,
  onStopSteam
}) => {
  const isId = settings.language === 'id';

  // Selected drink to brew
  const [selectedDrinkId, setSelectedDrinkId] = useState<DrinkId>(
    initialDrinkId && unlockedDrinks.includes(initialDrinkId)
      ? initialDrinkId
      : unlockedDrinks[0] || 'espresso'
  );

  const recipe: DrinkRecipe = ALL_DRINKS[selectedDrinkId] || ALL_DRINKS.espresso;

  // Completed steps tracker for this session
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isBrewingAnimation, setIsBrewingAnimation] = useState<boolean>(false);
  const [gaugeNeedle, setGaugeNeedle] = useState<number>(20); // pressure gauge angle

  // Reset steps when changing drink recipe
  useEffect(() => {
    setCompletedSteps([]);
    setIsBrewingAnimation(false);
  }, [selectedDrinkId]);

  // Current needed next step
  const nextStepIndex = completedSteps.length;
  const nextStepId = recipe.steps[nextStepIndex];
  const isComplete = completedSteps.length === recipe.steps.length;

  const handleStepClick = (stepId: string) => {
    if (isBrewingAnimation || isComplete) return;

    // Check if this step is the next required step in recipe
    if (stepId !== nextStepId) {
      soundManager.playWrong();
      return;
    }

    setIsBrewingAnimation(true);

    // Play appropriate sound effect based on step
    if (stepId === 'cup') {
      soundManager.playCup();
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, stepId]);
        setIsBrewingAnimation(false);
      }, 350);
    } else if (stepId === 'espresso') {
      soundManager.playGrind();
      onTriggerSteam();
      setGaugeNeedle(85); // pressure spike

      setTimeout(() => {
        soundManager.playEspresso();
      }, 350);

      const prepTime = Math.max(800, 1500 - machineLevel * 250);
      setTimeout(() => {
        onStopSteam();
        setGaugeNeedle(35);
        setCompletedSteps(prev => [...prev, stepId]);
        setIsBrewingAnimation(false);
      }, prepTime);
    } else if (stepId === 'milk' || stepId === 'foam' || stepId === 'latte_art') {
      soundManager.playSteam();
      onTriggerSteam();
      setTimeout(() => {
        onStopSteam();
        setCompletedSteps(prev => [...prev, stepId]);
        setIsBrewingAnimation(false);
      }, 700);
    } else {
      soundManager.playClick();
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, stepId]);
        setIsBrewingAnimation(false);
      }, 400);
    }
  };

  // Instant Quick Brew button for higher tier machines or speedy baristas
  const handleQuickBrew = () => {
    if (isComplete || isBrewingAnimation) return;
    soundManager.playEspresso();
    soundManager.playSteam();
    onTriggerSteam();
    setIsBrewingAnimation(true);

    setTimeout(() => {
      onStopSteam();
      setCompletedSteps([...recipe.steps]);
      setIsBrewingAnimation(false);
      soundManager.playSuccess();
    }, 600);
  };

  const handleCollectDrink = () => {
    if (!isComplete) return;
    soundManager.playSuccess();
    onFinishDrink({
      drinkId: recipe.id,
      drinkName: recipe.name,
      quality: 'perfect'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#2e1d14] via-[#241711] to-[#1a100b] border-2 border-amber-600/60 rounded-3xl p-5 sm:p-7 shadow-2xl text-amber-50 overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-900/60 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
              ☕
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                {isId ? 'Stasiun Peracik Minuman' : 'Coffee Crafting Station'}
              </h2>
              <p className="text-xs text-amber-200/70">
                {isId ? 'Ikuti langkah resep untuk membuat minuman pesanan' : 'Follow recipe steps to craft the perfect drink'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-200 flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recipe Selection Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
          {unlockedDrinks.map((dId) => {
            const d = ALL_DRINKS[dId];
            if (!d) return null;
            const isSelected = dId === selectedDrinkId;

            return (
              <button
                key={dId}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedDrinkId(dId);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-amber-950 shadow-md font-extrabold scale-102'
                    : 'bg-black/40 text-amber-200/80 hover:bg-black/60 border border-amber-900/40'
                }`}
              >
                <span>{d.icon}</span>
                <span>{d.name}</span>
                <span className="text-[10px] opacity-75 font-mono">${d.price.toFixed(2)}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Crafting Workspace: Visual Cup + Pressure Gauge */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 mb-5 items-center">
          {/* Cup Simulation Visualizer */}
          <div className="sm:col-span-6 bg-black/40 border border-amber-800/40 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[170px]">
            {/* Pressure Gauge & Machine Status */}
            <div className="absolute top-2.5 left-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 bg-zinc-900 flex items-center justify-center shadow-inner relative">
                <div 
                  className="w-0.5 h-3 bg-rose-500 origin-bottom transform transition-transform duration-300 rounded-full"
                  style={{ transform: `rotate(${gaugeNeedle - 90}deg)` }}
                />
              </div>
              <span className="text-[10px] font-mono text-amber-300 font-bold">
                {isBrewingAnimation ? (isId ? 'MENYEDUH...' : 'BREWING...') : (isId ? 'SIAP' : 'STANDBY')}
              </span>
            </div>

            {/* Quick Brew button for high level machines */}
            {machineLevel >= 2 && (
              <button
                onClick={handleQuickBrew}
                disabled={isComplete || isBrewingAnimation}
                className="absolute top-2.5 right-3 text-[10px] font-bold px-2 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-amber-950 flex items-center gap-1 shadow hover:scale-105 active:scale-95 transition disabled:opacity-40 cursor-pointer"
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>{isId ? 'Seduh Kilat' : 'Quick Brew'}</span>
              </button>
            )}

            {/* 3D-styled Interactive Cup Illustration */}
            <div className="relative w-28 h-32 mt-4 flex flex-col items-center justify-end">
              {/* Steam waves when brewing */}
              {isBrewingAnimation && (
                <div className="absolute -top-6 flex gap-2 animate-bounce">
                  <span className="text-xl opacity-80 animate-pulse">♨️</span>
                  <span className="text-lg opacity-60">☁️</span>
                </div>
              )}

              {/* Cup container */}
              <div className="relative w-24 h-28 border-4 border-amber-100/90 rounded-b-3xl bg-amber-50/20 backdrop-blur-xs overflow-hidden shadow-xl flex flex-col justify-end">
                {/* Liquid Layers */}
                {completedSteps.includes('chocolate') && (
                  <div className="w-full h-8 bg-[#3e2723] transition-all duration-500 border-t border-[#5d4037]" />
                )}
                {completedSteps.includes('tea_bag') && (
                  <div className="w-full h-12 bg-amber-700/80 transition-all duration-500" />
                )}
                {completedSteps.includes('espresso') && (
                  <div className="w-full h-10 bg-[#3b1d11] transition-all duration-500 relative">
                    {/* Golden Crema top layer */}
                    <div className="w-full h-2 bg-[#d7a15c] opacity-90" />
                  </div>
                )}
                {completedSteps.includes('water') && (
                  <div className="w-full h-8 bg-sky-300/40 transition-all duration-500" />
                )}
                {completedSteps.includes('milk') && (
                  <div className="w-full h-10 bg-amber-50/90 transition-all duration-500" />
                )}
                {completedSteps.includes('ice') && (
                  <div className="absolute top-8 left-2 right-2 flex justify-center gap-1">
                    <span className="text-xs">🧊</span>
                    <span className="text-xs">🧊</span>
                  </div>
                )}
                {completedSteps.includes('foam') && (
                  <div className="w-full h-5 bg-white transition-all duration-500 rounded-t-lg shadow-inner flex items-center justify-center">
                    <span className="text-[10px] text-amber-900/40 font-bold">☁️ foam</span>
                  </div>
                )}
                {completedSteps.includes('latte_art') && (
                  <div className="w-full h-5 bg-[#fff8e1] transition-all duration-500 flex items-center justify-center shadow-inner">
                    <span className="text-xs">🌿</span>
                  </div>
                )}
              </div>

              {/* Cup Handle */}
              <div className="absolute right-[-10px] top-12 w-4 h-12 border-4 border-amber-100/90 rounded-r-2xl pointer-events-none" />
            </div>

            <div className="mt-2 text-xs font-bold text-amber-200">
              {recipe.name}
            </div>
          </div>

          {/* Step-by-Step Recipe Checklist */}
          <div className="sm:col-span-6 flex flex-col gap-2">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
              {isId ? 'Langkah Pembuatan:' : 'Preparation Steps:'}
            </span>

            <div className="flex flex-col gap-2">
              {recipe.steps.map((stepId, index) => {
                const info = INGREDIENT_DETAILS[stepId] || { name: stepId, nameId: stepId, icon: '✨' };
                const isDone = completedSteps.includes(stepId);
                const isCurrent = stepId === nextStepId;

                return (
                  <button
                    key={stepId}
                    disabled={isDone || isBrewingAnimation}
                    onClick={() => handleStepClick(stepId)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-left flex items-center justify-between border transition cursor-pointer ${
                      isDone
                        ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-200 opacity-80'
                        : isCurrent
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700 border-amber-400 text-white font-bold shadow-lg animate-pulse scale-101'
                          : 'bg-black/30 border-amber-900/30 text-amber-200/50 hover:bg-black/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{info.icon}</span>
                      <div>
                        <span className="text-xs block font-bold">
                          {index + 1}. {isId ? info.nameId : info.name}
                        </span>
                      </div>
                    </div>

                    {isDone ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/80 text-emerald-950 flex items-center justify-center font-bold text-xs">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : isCurrent ? (
                      <span className="text-[11px] bg-amber-900/90 text-amber-200 px-2 py-0.5 rounded-md font-mono font-bold">
                        {isId ? 'Klik Disini' : 'Click Here'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400/40">#{index + 1}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer: Finish & Collect Drink Button */}
        <div className="flex items-center justify-between pt-3 border-t border-amber-900/60">
          <div className="text-xs text-amber-200/80">
            {isComplete ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {isId ? 'Minuman sempurna sudah siap!' : 'Drink is perfectly brewed & ready!'}
              </span>
            ) : (
              <span>
                {isId 
                  ? `Selesaikan ${recipe.steps.length - completedSteps.length} langkah lagi` 
                  : `${recipe.steps.length - completedSteps.length} steps remaining`}
              </span>
            )}
          </div>

          <button
            onClick={handleCollectDrink}
            disabled={!isComplete}
            id="collect-drink-btn"
            className={`px-6 py-2.5 rounded-xl font-black text-sm tracking-wide transition flex items-center gap-2 cursor-pointer ${
              isComplete
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-emerald-950 shadow-xl active:scale-95 animate-bounce'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <span>☕</span>
            <span>{isId ? 'Ambil Minuman' : 'Take Drink'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
