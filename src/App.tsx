import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// --- UTILS & HOOKS ---
const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;

type Obstacle = { x: number, y: number, w: number, h: number };

const useMovement = (initialX: number, initialY: number, obstacles: Obstacle[] = []) => {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      const speed = 30;
      setPos(p => {
        let nextX = p.x;
        let nextY = p.y;
        if (e.key === 'ArrowUp') nextY -= speed;
        if (e.key === 'ArrowDown') nextY += speed;
        if (e.key === 'ArrowLeft') { nextX -= speed; setDir(-1); }
        if (e.key === 'ArrowRight') { nextX += speed; setDir(1); }
        
        nextX = Math.max(0, Math.min(nextX, GAME_WIDTH - 64));
        nextY = Math.max(0, Math.min(nextY, GAME_HEIGHT - 64));

        const checkCol = (cx: number, cy: number) => obstacles.some(obs => 
          cx < obs.x + obs.w && cx + 64 > obs.x &&
          cy < obs.y + obs.h && cy + 64 > obs.y
        );

        let finalX = p.x;
        let finalY = p.y;
        if (!checkCol(nextX, p.y)) finalX = nextX;
        if (!checkCol(finalX, nextY)) finalY = nextY;

        return { x: finalX, y: finalY };
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [obstacles]);

  return { pos, dir };
};

// Increased threshold and adjusted center points for easier interaction
const checkDist = (p1: {x: number, y: number}, p2: {x: number, y: number}, threshold = 150) => {
  const dx = (p1.x + 32) - (p2.x + 32);
  const dy = (p1.y + 32) - (p2.y + 32);
  return Math.sqrt(dx*dx + dy*dy) < threshold;
};

// --- DECORATIONS & OBSTACLES ---
const Lava = () => (
  <div className="absolute bottom-0 left-0 w-full h-16 bg-red-600 border-t-4 border-black flex overflow-hidden z-0">
    {[...Array(20)].map((_, i) => (
      <motion.div 
        key={i}
        animate={{ y: [0, -10, 0] }} 
        transition={{ repeat: Infinity, duration: 1 + Math.random(), delay: Math.random() }}
        className="w-16 h-16 bg-orange-500 rounded-full border-4 border-black -mt-8 -ml-4"
      />
    ))}
  </div>
);

const DevilDecor = ({ pos, flip }: { pos: {x: number, y: number}, flip?: boolean }) => (
  <div className="absolute w-12 h-16 z-0 opacity-40 pointer-events-none" style={{ left: pos.x, top: pos.y, transform: flip ? 'scaleX(-1)' : 'none' }}>
    <div className="w-10 h-10 bg-red-900 border-4 border-black absolute bottom-0 left-1 flex justify-center items-center">
      <div className="flex gap-1 mb-2">
        <div className="w-2 h-2 bg-black" />
        <div className="w-2 h-2 bg-black" />
      </div>
    </div>
    <div className="absolute top-2 left-1 w-2 h-4 bg-black" />
    <div className="absolute top-2 right-1 w-2 h-4 bg-black" />
    <div className="absolute -right-4 top-0 w-1 h-16 bg-black">
      <div className="absolute -top-2 -left-2 w-5 h-4 border-4 border-black border-t-0 rounded-b-full" />
      <div className="absolute -top-4 left-0 w-1 h-4 bg-black" />
    </div>
  </div>
);

const Rock = ({ obs, key }: { obs: Obstacle, key?: React.Key }) => (
  <div 
    className="absolute bg-zinc-800 border-4 border-black pixel-shadow z-10 flex items-center justify-center overflow-hidden" 
    style={{ left: obs.x, top: obs.y, width: obs.w, height: obs.h }}
  >
    <div className="w-full h-full opacity-30" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '12px 12px' }} />
  </div>
);

// --- COMPONENTS ---
const Player = ({ pos, dir, item }: { pos: {x: number, y: number}, dir: number, item?: string }) => (
  <div 
    className="absolute w-16 h-16 z-50 transition-all duration-75 ease-linear"
    style={{ left: pos.x, top: pos.y, transform: `scaleX(${dir})` }}
  >
    {/* Demon Body */}
    <div className="w-12 h-12 bg-red-600 border-4 border-black pixel-shadow-sm absolute bottom-0 left-2 flex justify-center items-center">
      <div className="flex gap-2 mb-2">
        <div className="w-2 h-2 bg-yellow-400 border border-black" />
        <div className="w-2 h-2 bg-yellow-400 border border-black" />
      </div>
      <div className="absolute bottom-2 w-4 h-1 bg-black" />
    </div>
    {/* Horns */}
    <div className="absolute top-0 left-2 w-3 h-4 bg-red-900 border-2 border-black" />
    <div className="absolute top-0 right-2 w-3 h-4 bg-red-900 border-2 border-black" />
    
    {/* Held Item */}
    {item === 'pot' && (
      <div className="absolute -top-8 left-0 w-16 h-10 bg-zinc-800 border-4 border-black pixel-shadow-sm z-50 flex flex-col justify-between">
        <div className="w-full h-2 bg-zinc-900 border-b-4 border-black" />
      </div>
    )}
    {item === 'spoon' && (
      <div className="absolute -top-10 left-8 w-2 h-16 bg-amber-700 border-2 border-black rotate-45 z-50">
        <div className="absolute -top-4 -left-2 w-6 h-6 bg-amber-600 border-2 border-black rounded-full" />
      </div>
    )}
  </div>
);

const Pot = ({ pos }: { pos: {x: number, y: number} }) => (
  <div className="absolute w-16 h-10 bg-zinc-800 border-4 border-black pixel-shadow-sm z-20" style={{ left: pos.x, top: pos.y }}>
    <div className="w-full h-2 bg-zinc-900 border-b-4 border-black" />
    <div className="w-full text-center text-[8px] font-pixel text-zinc-400 mt-1">POT</div>
  </div>
);

const Stove = ({ pos, hasPot, isLit }: { pos: {x: number, y: number}, hasPot: boolean, isLit: boolean }) => (
  <div className="absolute w-32 h-24 bg-zinc-900 border-4 border-black pixel-shadow z-10" style={{ left: pos.x, top: pos.y }}>
    <div className="w-full h-6 bg-zinc-800 border-b-4 border-black flex justify-around items-center">
      <div className={`w-16 h-2 border-2 border-black rounded-full ${isLit ? 'bg-red-500 animate-pulse' : 'bg-zinc-700'}`} />
    </div>
    <div className="absolute -bottom-8 w-full text-center text-xl font-pixel text-red-500">STOVE</div>
    {hasPot && <Pot pos={{ x: 8, y: -20 }} />}
    {isLit && (
      <div className="absolute -top-12 left-8 flex gap-1">
        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.3 }} className="w-4 h-6 bg-orange-500 border-2 border-black" />
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 0.4 }} className="w-6 h-8 bg-yellow-400 border-2 border-black" />
        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-4 h-6 bg-red-500 border-2 border-black" />
      </div>
    )}
  </div>
);

// --- LEVEL OBSTACLES ---
const lvl1Obstacles: Obstacle[] = [
  { x: 300, y: 100, w: 64, h: 128 },
  { x: 500, y: 250, w: 128, h: 64 }
];

const lvl2Obstacles: Obstacle[] = [
  { x: 250, y: 0, w: 64, h: 250 },
  { x: 450, y: 150, w: 64, h: 250 }
];

const lvl3Obstacles: Obstacle[] = [
  { x: 150, y: 150, w: 128, h: 64 },
  { x: 350, y: 250, w: 64, h: 150 },
  { x: 650, y: 50, w: 64, h: 128 }
];

// --- LEVELS ---
const Level1 = ({ onComplete }: { onComplete: () => void }) => {
  const { pos, dir } = useMovement(100, 200, lvl1Obstacles);
  const [hasPot, setHasPot] = useState(false);
  const [potOnStove, setPotOnStove] = useState(false);
  const [isLit, setIsLit] = useState(false);

  const potPos = { x: 200, y: 200 };
  const stovePos = { x: 600, y: 150 };

  // Auto-pickup pot when touching
  useEffect(() => {
    if (!hasPot && !potOnStove && checkDist(pos, potPos, 80)) {
      setHasPot(true);
    }
  }, [pos, hasPot, potOnStove]);

  // Auto-place and light when touching stove
  useEffect(() => {
    if (hasPot && checkDist(pos, stovePos, 150)) {
      setHasPot(false);
      setPotOnStove(true);
      setIsLit(true);
      setTimeout(onComplete, 1500);
    }
  }, [pos, hasPot, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-pixel text-red-500 drop-shadow-[4px_4px_0_#000]">LEVEL 1</h2>
        <p className="text-2xl font-vt text-orange-300 mt-4">Arrows to move.</p>
        <p className="text-xl font-vt text-white">1. Touch Pot to pick up &rarr; 2. Touch Stove to cook!</p>
      </div>
      
      <div className="relative bg-zinc-950 border-8 border-red-900 pixel-shadow overflow-hidden" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
        <DevilDecor pos={{ x: 50, y: 50 }} />
        <DevilDecor pos={{ x: 400, y: 80 }} flip />
        <DevilDecor pos={{ x: 700, y: 250 }} />
        <Lava />
        
        {lvl1Obstacles.map((obs, i) => <Rock key={i} obs={obs} />)}
        
        <Player pos={pos} dir={dir} item={hasPot ? 'pot' : undefined} />
        {!hasPot && !potOnStove && <Pot pos={potPos} />}
        <Stove pos={stovePos} hasPot={potOnStove} isLit={isLit} />
      </div>
    </div>
  );
};

const Level2 = ({ onComplete }: { onComplete: () => void }) => {
  const { pos, dir } = useMovement(100, 200, lvl2Obstacles);
  const [showQR, setShowQR] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const doorPos = { x: 600, y: 100 };

  useEffect(() => {
    if (!showQR && checkDist(pos, doorPos, 150)) {
      setShowQR(true);
    }
  }, [pos, showQR]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const words = input.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 2) {
      onComplete();
    } else {
      setError("YOU NEED AT LEAST 2 WORDS!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-pixel text-red-500 drop-shadow-[4px_4px_0_#000]">LEVEL 2</h2>
        <p className="text-2xl font-vt text-orange-300 mt-4">Navigate the maze and touch the DOOR.</p>
      </div>

      <div className="relative bg-zinc-950 border-8 border-red-900 pixel-shadow overflow-hidden" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
        <DevilDecor pos={{ x: 150, y: 250 }} flip />
        <DevilDecor pos={{ x: 500, y: 50 }} />
        <Lava />

        {lvl2Obstacles.map((obs, i) => <Rock key={i} obs={obs} />)}

        {!showQR && <Player pos={pos} dir={dir} />}
        
        {/* Door */}
        <div className="absolute w-24 h-32 bg-amber-900 border-4 border-black pixel-shadow z-10 flex justify-end items-center pr-2" style={{ left: doorPos.x, top: doorPos.y }}>
          <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-black" />
          <div className="absolute -top-8 w-full text-center text-xl font-pixel text-red-500">DOOR</div>
        </div>

        {/* QR Popup */}
        {showQR && (
          <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-8">
            <div className="bg-zinc-900 border-4 border-black pixel-shadow p-8 flex flex-col items-center max-w-lg w-full">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://hell-s-enigma.vercel.app/" 
                alt="QR Code"
                className="w-32 h-32 pixelated border-4 border-white mb-6"
              />
              <p className="text-2xl font-vt text-orange-300 mb-4 text-center">Scan to find ingredients. Enter at least 2.</p>
              <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setError(""); }}
                  placeholder="INGREDIENTS..."
                  className="w-full p-4 bg-black border-4 border-white text-white font-vt text-2xl uppercase focus:border-red-500 outline-none"
                  autoFocus
                />
                {error && <p className="text-red-500 font-pixel text-sm">{error}</p>}
                <button type="submit" className="bg-red-600 text-white font-pixel p-4 border-4 border-black hover:bg-red-500">
                  SUBMIT
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Level3 = ({ onComplete }: { onComplete: () => void }) => {
  const { pos, dir } = useMovement(100, 200, lvl3Obstacles);
  const [hasSpoon, setHasSpoon] = useState(false);
  const [stirProgress, setStirProgress] = useState(0);

  const lastPos = useRef({ x: 0, y: 0 });
  const isStirring = useRef(false);

  const spoonPos = { x: 200, y: 300 };
  const potPos = { x: 500, y: 150 };

  // Auto-pickup spoon when touching
  useEffect(() => {
    if (!hasSpoon && checkDist(pos, spoonPos, 80)) {
      setHasSpoon(true);
    }
  }, [pos, hasSpoon]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!hasSpoon || !checkDist(pos, potPos, 250)) return;
    isStirring.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isStirring.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isStirring.current || !hasSpoon || !checkDist(pos, potPos, 250)) return;

    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      setStirProgress((prev) => {
        const next = prev + (dist / 15);
        if (next >= 100 && prev < 100) {
          setTimeout(onComplete, 500);
        }
        return next;
      });
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-pixel text-red-500 drop-shadow-[4px_4px_0_#000]">LEVEL 3</h2>
        <p className="text-2xl font-vt text-orange-300 mt-4">1. Touch Spoon to pick up &rarr; 2. Stand by Pot &rarr; 3. Click & Drag to stir!</p>
      </div>

      <div className="relative bg-zinc-950 border-8 border-red-900 pixel-shadow overflow-hidden" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
        <DevilDecor pos={{ x: 80, y: 80 }} />
        <DevilDecor pos={{ x: 350, y: 200 }} flip />
        <Lava />

        {lvl3Obstacles.map((obs, i) => <Rock key={i} obs={obs} />)}

        <Player pos={pos} dir={dir} item={hasSpoon ? 'spoon' : undefined} />
        
        {/* Spoon on ground */}
        {!hasSpoon && (
          <div className="absolute w-12 h-4 bg-amber-700 border-2 border-black z-10 flex items-center" style={{ left: spoonPos.x, top: spoonPos.y }}>
            <div className="w-6 h-6 bg-amber-600 border-2 border-black rounded-full -ml-2" />
            <div className="absolute -bottom-6 w-full text-center text-sm font-pixel text-amber-500">SPOON</div>
          </div>
        )}

        {/* Big Pot */}
        <div 
          className={`absolute w-48 h-48 bg-zinc-900 rounded-full border-8 border-black pixel-shadow z-10 flex items-center justify-center overflow-hidden ${hasSpoon ? 'cursor-pointer' : ''}`}
          style={{ left: potPos.x, top: potPos.y, touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerMove={handlePointerMove}
        >
          <div 
            className="w-40 h-40 rounded-full bg-red-600 border-4 border-red-800 relative pointer-events-none"
            style={{ transform: `rotate(${stirProgress * 15}deg)` }}
          >
            <div className="w-8 h-8 bg-red-800 border-2 border-black absolute top-4 left-4" />
            <div className="w-10 h-6 bg-orange-700 border-2 border-black absolute bottom-8 right-8" />
            <div className="w-6 h-6 bg-green-700 border-2 border-black absolute top-12 right-10" />
            
            <div className="w-full h-full rounded-full border-8 border-t-red-400 border-r-transparent border-b-red-800 border-l-transparent absolute" />
          </div>
          <div className="absolute -bottom-8 w-full text-center text-xl font-pixel text-red-500">TOMATO SOUP</div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-96 h-8 bg-black border-4 border-white pixel-shadow z-50">
          <div className="h-full bg-red-500 transition-all duration-75" style={{ width: `${Math.min(100, stirProgress)}%` }} />
        </div>
      </div>
    </div>
  );
};

const StartScreen = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: -50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.5, duration: 1 }}
        className="space-y-8 relative z-10"
      >
        <h1 className="text-6xl md:text-8xl font-pixel text-red-600 drop-shadow-[8px_8px_0_#000] leading-tight">
          HELL'S<br/>KITCHEN
        </h1>
        <p className="text-2xl md:text-4xl font-vt text-orange-400 mt-8 font-bold bg-black/80 inline-block px-8 py-4 border-4 border-red-900 pixel-shadow-sm">
          Escape the underworld through cooking!
        </p>
      </motion.div>
      
      <motion.button 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        onClick={onStart}
        className="mt-16 px-12 py-6 bg-red-600 hover:bg-red-500 text-white font-pixel text-3xl border-4 border-black pixel-shadow hover:translate-y-1 hover:shadow-[4px_4px_0_#000] transition-all cursor-pointer relative z-10 animate-pulse"
      >
        PLAY
      </motion.button>
    </div>
  );
};

const WinScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.5, duration: 1 }}
        className="space-y-8 relative z-10"
      >
        <motion.div 
          animate={{ y: [-10, 10, -10] }} 
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="w-40 h-16 border-[12px] border-yellow-300 rounded-[100%] mx-auto mb-8 shadow-[0_0_30px_#fde047]"
        />
        <h1 className="text-6xl md:text-8xl font-pixel text-yellow-300 drop-shadow-[8px_8px_0_#d97706] leading-tight">
          HAPPY<br/>FTOUR
        </h1>
        <p className="text-3xl md:text-5xl font-vt text-blue-900 mt-8 font-bold bg-white/80 inline-block px-8 py-4 border-4 border-blue-900 pixel-shadow-sm">
          You have ascended to Heaven!
        </p>
      </motion.div>
      <motion.button 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        onClick={() => window.location.reload()}
        className="mt-16 px-10 py-5 bg-white hover:bg-yellow-100 text-blue-900 font-pixel text-2xl border-4 border-blue-900 pixel-shadow-sm hover:translate-y-1 hover:shadow-[2px_2px_0_#1e3a8a] transition-all cursor-pointer relative z-10"
      >
        PLAY AGAIN
      </motion.button>
    </div>
  );
};

export default function App() {
  const [level, setLevel] = useState(0);
  const isHeaven = level === 4;

  return (
    <div className={`min-h-screen font-vt overflow-hidden relative selection:bg-black selection:text-white transition-colors duration-1000 flex flex-col items-center justify-center ${isHeaven ? 'bg-sky-300 text-blue-900' : 'bg-[#1a0505] text-white'}`}>
      {!isHeaven ? (
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(#330000 4px, transparent 4px), linear-gradient(90deg, #330000 4px, transparent 4px)', backgroundSize: '64px 64px' }} />
        </div>
      ) : (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute top-20 left-[10%] w-48 h-16 bg-white border-4 border-blue-200 pixel-shadow-sm" />
          <motion.div animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 4, delay: 1 }} className="absolute top-40 right-[15%] w-48 h-16 bg-white border-4 border-blue-200 pixel-shadow-sm" />
        </div>
      )}

      <main className="relative z-10 container mx-auto px-6 h-screen flex flex-col items-center justify-center">
        <div className="w-full max-w-[800px] flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={level}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              {level === 0 && <StartScreen onStart={() => setLevel(1)} />}
              {level === 1 && <Level1 onComplete={() => setLevel(2)} />}
              {level === 2 && <Level2 onComplete={() => setLevel(3)} />}
              {level === 3 && <Level3 onComplete={() => setLevel(4)} />}
              {level === 4 && <WinScreen />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
