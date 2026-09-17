import React, { useState } from 'react';
import { GameSettings } from '../types';
import { soundManager } from '../audio/soundManager';
import { ArrowRight, Coffee, Sparkles } from 'lucide-react';

interface IntroStoryModalProps {
  settings: GameSettings;
  onFinishIntro: () => void;
}

export const IntroStoryModal: React.FC<IntroStoryModalProps> = ({
  settings,
  onFinishIntro
}) => {
  const isId = settings.language === 'id';
  const [dialogueIndex, setDialogueIndex] = useState<number>(0);

  const dialogues = [
    {
      speaker: isId ? 'Narator' : 'Narrator',
      avatar: '☕',
      textId: 'Akhirnya... coffee shop impianmu resmi dibuka hari ini!',
      textEn: 'At last... your dream coffee shop has officially opened its doors today!'
    },
    {
      speaker: isId ? 'Kamu (Pemilik Kafe)' : 'You (Cafe Owner)',
      avatar: '👨‍🍳',
      textId: 'Meskipun tempat ini masih sederhana dengan meja terbatas dan mesin kecil, aku yakin bisa mengembangkannya.',
      textEn: 'Though it is still humble with limited tables and a modest espresso machine, I know we can make it flourish.'
    },
    {
      speaker: isId ? 'Tips Barista' : 'Barista Guide',
      avatar: '✨',
      textId: 'Layani setiap pelanggan dengan ramah, buat pesanan tepat waktu, kumpulkan uang, dan upgrade tokomu hingga terkenal!',
      textEn: 'Serve each guest warmly, brew orders on time, gather cash, and upgrade your shop until it becomes everyone\'s favorite hangout!'
    }
  ];

  const current = dialogues[dialogueIndex];

  const handleNext = () => {
    soundManager.playClick();
    if (dialogueIndex < dialogues.length - 1) {
      setDialogueIndex(prev => prev + 1);
    } else {
      soundManager.playBell();
      onFinishIntro();
    }
  };

  const handleSkip = () => {
    soundManager.playBell();
    onFinishIntro();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#2d1c13] to-[#1c110b] border-2 border-amber-500/70 rounded-3xl p-5 sm:p-7 shadow-2xl text-amber-50 overflow-hidden">
        {/* Top gold line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{current.avatar}</span>
            <span className="font-bold text-amber-300 text-sm tracking-wide">
              {current.speaker}
            </span>
          </div>

          <button
            onClick={handleSkip}
            className="text-xs text-amber-200/50 hover:text-amber-200 underline decoration-amber-500/40 cursor-pointer"
          >
            {isId ? 'Lewati Cerita' : 'Skip Story'}
          </button>
        </div>

        <div className="min-h-[75px] flex items-center mb-6">
          <p className="text-sm sm:text-base text-amber-100 font-medium leading-relaxed">
            "{isId ? current.textId : current.textEn}"
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-amber-900/60">
          <div className="flex gap-1.5">
            {dialogues.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === dialogueIndex ? 'w-6 bg-amber-400' : 'w-2 bg-amber-900'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-amber-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg active:scale-95 cursor-pointer"
          >
            <span>{dialogueIndex === dialogues.length - 1 ? (isId ? 'Buka Pintu Kafe!' : 'Open Cafe Doors!') : (isId ? 'Lanjut' : 'Next')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
