import React from 'react';
import { GameSettings } from '../types';
import { soundManager } from '../audio/soundManager';
import { Play, Settings as SettingsIcon, HelpCircle, Coffee, Sparkles, Volume2 } from 'lucide-react';

interface MainMenuProps {
  settings: GameSettings;
  onPlay: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  settings,
  onPlay,
  onOpenSettings,
  onOpenHelp
}) => {
  const isId = settings.language === 'id';

  const handleStart = () => {
    soundManager.playBell();
    soundManager.startMusic();
    onPlay();
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-6 sm:p-10 pointer-events-none select-none">
      {/* Top Tagline */}
      <div className="flex items-center gap-2 bg-[#241711]/80 backdrop-blur-md px-4 py-2 rounded-full border border-amber-600/30 text-amber-200/90 text-xs font-semibold shadow-lg">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>{isId ? 'Game Simulasi & Manajemen Kafe 3D' : '3D Cozy Cafe Simulation & Management'}</span>
      </div>

      {/* Hero Branding Center */}
      <div className="flex flex-col items-center text-center max-w-lg">
        {/* Animated Cafe Cup Icon */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-900 border-2 border-amber-300/60 flex items-center justify-center text-4xl sm:text-5xl shadow-2xl mb-4 animate-bounce">
          ☕
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] font-sans">
          Coffee Shop <span className="text-amber-400">Story</span>
        </h1>

        <p className="text-xs sm:text-sm text-amber-100/90 mt-2 max-w-md drop-shadow-md font-medium">
          {isId
            ? 'Racik kopi nikmat, layani pelanggan ramah, dan kembangkan kedai kopi impianmu sedikit demi sedikit.'
            : 'Brew delicious coffee, serve cozy guests, and grow your dream coffee shop cup by cup.'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-64 sm:w-72 mt-8 pointer-events-auto">
          <button
            onClick={handleStart}
            id="main-play-btn"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-amber-950 font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/30 border-2 border-amber-200/60 transition transform hover:scale-103 active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{isId ? 'MULAI MAIN' : 'PLAY GAME'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenSettings();
              }}
              className="py-3 rounded-xl bg-[#241711]/90 hover:bg-[#342218] border border-amber-700/50 text-amber-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
            >
              <SettingsIcon className="w-4 h-4" />
              <span>{isId ? 'Pengaturan' : 'Settings'}</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onOpenHelp();
              }}
              className="py-3 rounded-xl bg-[#241711]/90 hover:bg-[#342218] border border-amber-700/50 text-amber-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{isId ? 'Petunjuk' : 'How to Play'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-[11px] text-amber-200/60 bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-full border border-amber-900/30">
        {isId ? 'Versi 1.0 • Musik Santai Lo-Fi & Grafik 3D' : 'Version 1.0 • Cozy Lo-Fi Vibes & Full 3D'}
      </div>
    </div>
  );
};
