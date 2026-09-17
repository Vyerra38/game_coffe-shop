import React, { useRef, useState, useEffect } from 'react';

interface TouchControlsProps {
  onMove: (dx: number, dy: number) => void;
  onStop: () => void;
  onInteract: () => void;
  hasInteractTarget: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onStop,
  onInteract,
  hasInteractTarget
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState<boolean>(false);
  const touchIdRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsActive(true);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isActive) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsActive(false);
        setKnobPos({ x: 0, y: 0 });
        onStop();
        break;
      }
    }
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const maxRadius = rect.width / 2 - 10;

    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX);

    const clampedDist = Math.min(dist, maxRadius);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setKnobPos({ x: knobX, y: knobY });

    // Normalized dx, dy
    const normX = knobX / maxRadius;
    const normY = knobY / maxRadius;
    onMove(normX, normY);
  };

  return (
    <div className="sm:hidden absolute inset-0 pointer-events-none z-30 select-none">
      {/* Virtual Joystick Bottom-Left */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="w-28 h-28 rounded-full bg-black/40 backdrop-blur-xs border-2 border-amber-500/40 relative flex items-center justify-center shadow-2xl active:border-amber-400"
        >
          {/* Center Knob */}
          <div
            className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 border border-amber-300 shadow-md transform transition-transform"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`
            }}
          />
        </div>
      </div>

      {/* Big Virtual Action Button Bottom-Right */}
      <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-center gap-2">
        <button
          onTouchStart={(e) => {
            e.stopPropagation();
            onInteract();
          }}
          onClick={onInteract}
          className={`w-20 h-20 rounded-full font-black text-xs flex flex-col items-center justify-center gap-1 shadow-2xl transition border-2 ${
            hasInteractTarget
              ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-amber-950 border-white animate-pulse'
              : 'bg-black/50 text-amber-200/50 border-amber-800/40'
          }`}
        >
          <span className="text-xl">☕</span>
          <span className="font-mono">TAP</span>
        </button>
      </div>
    </div>
  );
};
