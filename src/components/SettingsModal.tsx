import React from 'react';
import { GameSettings } from '../types';
import { soundManager } from '../audio/soundManager';
import { X, Volume2, Music, Monitor, Globe, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetSave: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetSave,
  onClose
}) => {
  const isId = settings.language === 'id';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#2e1d14] via-[#241711] to-[#180e09] border-2 border-amber-600/70 rounded-3xl p-5 sm:p-7 shadow-2xl text-amber-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-900/60 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
              ⚙️
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                {isId ? 'Pengaturan Game' : 'Game Settings'}
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

        <div className="flex flex-col gap-4">
          {/* Music Volume */}
          <div className="bg-[#1c110b] border border-amber-900/40 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-200 flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400" />
                <span>{isId ? 'Volume Musik Lo-Fi' : 'Lo-Fi Cafe Music'}</span>
              </span>
              <span className="text-xs font-mono text-amber-300 font-bold">
                {Math.round(settings.musicVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                soundManager.setMusicVolume(val);
                onUpdateSettings({ musicVolume: val });
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div className="bg-[#1c110b] border border-amber-900/40 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-200 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>{isId ? 'Efek Suara (SFX)' : 'Sound Effects (SFX)'}</span>
              </span>
              <span className="text-xs font-mono text-amber-300 font-bold">
                {Math.round(settings.sfxVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                soundManager.setSfxVolume(val);
                onUpdateSettings({ sfxVolume: val });
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Language Toggle */}
          <div className="bg-[#1c110b] border border-amber-900/40 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-200 flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>{isId ? 'Bahasa' : 'Language'}</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateSettings({ language: 'id' })}
                className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  settings.language === 'id'
                    ? 'bg-amber-500 text-amber-950 font-black'
                    : 'bg-black/40 text-amber-200/70 hover:bg-black/60'
                }`}
              >
                🇮🇩 Bahasa Indonesia
              </button>
              <button
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  settings.language === 'en'
                    ? 'bg-amber-500 text-amber-950 font-black'
                    : 'bg-black/40 text-amber-200/70 hover:bg-black/60'
                }`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>

          {/* Graphics Quality */}
          <div className="bg-[#1c110b] border border-amber-900/40 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-200 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-amber-400" />
                <span>{isId ? 'Kualitas Grafik 3D' : '3D Graphics Quality'}</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdateSettings({ graphicsQuality: q })}
                  className={`py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'bg-amber-500 text-amber-950 font-black'
                      : 'bg-black/40 text-amber-200/70 hover:bg-black/60'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Save Progress */}
          <div className="pt-2 flex justify-between items-center">
            <button
              onClick={() => {
                if (window.confirm(isId ? 'Yakin ingin mereset progres kafe dari awal?' : 'Reset cafe progress from Day 1?')) {
                  onResetSave();
                  onClose();
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer underline decoration-rose-500/40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isId ? 'Mulai Ulang Progres Kafe' : 'Reset Save Data'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-amber-500 text-amber-950 font-bold text-xs shadow hover:bg-amber-400 transition cursor-pointer"
            >
              {isId ? 'Tutup' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
