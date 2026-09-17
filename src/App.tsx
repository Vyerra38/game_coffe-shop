import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameState, 
  PlayerStats, 
  GameSettings, 
  CustomerData, 
  CustomerOrder, 
  CustomerType, 
  HeldItem, 
  DailyGoal, 
  DayStats,
  DrinkId
} from './types';
import { CoffeeShopWorld, InteractiveTarget } from './game/threeScene';
import { ALL_DRINKS } from './game/drinkData';
import { soundManager } from './audio/soundManager';
import { HUD } from './components/HUD';
import { DrinkCraftingModal } from './components/DrinkCraftingModal';
import { ShopModal } from './components/ShopModal';
import { DaySummaryModal } from './components/DaySummaryModal';
import { IntroStoryModal } from './components/IntroStoryModal';
import { MainMenu } from './components/MainMenu';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { TouchControls } from './components/TouchControls';

// Default initial player statistics
const INITIAL_STATS: PlayerStats = {
  money: 50.0,
  reputation: 4.0,
  level: 1,
  day: 1,
  machineLevel: 1,
  tableCount: 2,
  decorLevel: 0,
  staffLevel: 0,
  unlockedDrinks: ['espresso', 'americano', 'cappuccino'],
  totalCustomersServed: 0
};

const INITIAL_SETTINGS: GameSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.7,
  graphicsQuality: 'high',
  language: 'id'
};

const DAY_DURATION_SECONDS = 100; // ~1.5 minutes per cafe shift

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<CoffeeShopWorld | null>(null);

  // Persistent Game State
  const [gameState, setGameState] = useState<GameState>('menu');
  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem('coffee_shop_stats_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_STATS;
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('coffee_shop_settings_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SETTINGS;
  });

  // Active Day Runtime State
  const [dayTimeRemaining, setDayTimeRemaining] = useState<number>(DAY_DURATION_SECONDS);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [heldItem, setHeldItem] = useState<HeldItem | null>(null);
  const [currentInteractiveTarget, setCurrentInteractiveTarget] = useState<InteractiveTarget | null>(null);

  // Modals visibility
  const [isCraftingOpen, setIsCraftingOpen] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [selectedBrewDrinkId, setSelectedBrewDrinkId] = useState<DrinkId | undefined>(undefined);

  // Day tracking & statistics
  const [dayStats, setDayStats] = useState<DayStats>({
    day: 1,
    customersServed: 0,
    moneyEarned: 0,
    tipsEarned: 0,
    mistakes: 0,
    satisfactionRate: 100,
    reputationChange: 0
  });

  // Daily Goal
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>({
    id: 'goal_day_1',
    title: 'Serve 5 Cozy Customers',
    titleId: 'Layani 5 Pelanggan Kafe',
    target: 5,
    current: 0,
    rewardMoney: 40,
    completed: false,
    type: 'serve_count'
  });

  // Toasts / Feedback alerts
  const [toast, setToast] = useState<{ id: string; text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Input state
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const touchInput = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Save progress
  useEffect(() => {
    try {
      localStorage.setItem('coffee_shop_stats_v1', JSON.stringify(stats));
    } catch {}
  }, [stats]);

  useEffect(() => {
    try {
      localStorage.setItem('coffee_shop_settings_v1', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Show quick toast notification
  const showToast = useCallback((text: string, type: 'success' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString();
    setToast({ id, text, type });
    setTimeout(() => {
      setToast(prev => (prev && prev.id === id ? null : prev));
    }, 2400);
  }, []);

  // Initialize Three.js 3D World once
  useEffect(() => {
    if (!canvasContainerRef.current) return;
    const world = new CoffeeShopWorld(canvasContainerRef.current);
    worldRef.current = world;
    world.updateUpgradesVisuals(stats);

    return () => {
      world.destroy();
      worldRef.current = null;
    };
  }, []);

  // Sync upgrade visuals when stats change
  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.updateUpgradesVisuals(stats);
      worldRef.current.isHoldingDrink = !!heldItem;
    }
  }, [stats, heldItem]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;

      // Handle interaction key 'e' or ' '
      if ((e.key.toLowerCase() === 'e' || e.key === ' ') && gameState === 'playing') {
        if (!isCraftingOpen && !isShopOpen && !isSettingsOpen && !isHelpOpen) {
          handleInteraction();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, isCraftingOpen, isShopOpen, isSettingsOpen, isHelpOpen, currentInteractiveTarget, heldItem, customers]);

  // Main 60FPS Game Movement & Physics loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (worldRef.current) {
        // Compute input vector
        let dx = 0;
        let dz = 0;

        if (keysPressed.current['w'] || keysPressed.current['arrowup']) dz -= 1;
        if (keysPressed.current['s'] || keysPressed.current['arrowdown']) dz += 1;
        if (keysPressed.current['a'] || keysPressed.current['arrowleft']) dx -= 1;
        if (keysPressed.current['d'] || keysPressed.current['arrowright']) dx += 1;

        // Add touch joystick input
        if (Math.abs(touchInput.current.x) > 0.05 || Math.abs(touchInput.current.y) > 0.05) {
          dx += touchInput.current.x;
          dz += touchInput.current.y;
        }

        // Normalize vector
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len > 1) {
          dx /= len;
          dz /= len;
        }

        const isRunning = !!keysPressed.current['shift'];
        worldRef.current.movePlayer(dx, dz, isRunning, dt);

        // Update active closest target
        setCurrentInteractiveTarget(worldRef.current.currentClosestTarget);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  // --- Customer Spawner & Patience Timer ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Day timer countdown
    const dayInterval = window.setInterval(() => {
      setDayTimeRemaining(prev => {
        if (prev <= 1) {
          handleDayEnded();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Customer Spawning loop
    const customerInterval = window.setInterval(() => {
      setCustomers(prev => {
        // Max concurrent customers based on unlocked tables + 1 counter spot
        const maxCapacity = stats.tableCount + 1;
        if (prev.filter(c => c.state !== 'leaving' && c.state !== 'left').length >= maxCapacity) {
          return prev;
        }

        // Spawn probability based on reputation (higher reputation = more frequent customers)
        const spawnChance = 0.35 + (stats.reputation / 5.0) * 0.35;
        if (Math.random() > spawnChance) return prev;

        return [...prev, createNewCustomer(prev)];
      });
    }, 3800);

    // Customer AI & Patience Tick loop
    const patienceInterval = window.setInterval(() => {
      setCustomers(prev => {
        return prev.map(c => {
          // Walk towards target spot
          if (c.state === 'entering' || c.state === 'walking_to_spot') {
            const tx = c.targetPos[0];
            const tz = c.targetPos[2];
            const cx = c.currentPos[0];
            const cz = c.currentPos[2];
            const dist = Math.sqrt((tx - cx) ** 2 + (tz - cz) ** 2);

            if (dist < 0.25) {
              return {
                ...c,
                state: 'waiting_drink',
                currentPos: c.targetPos
              };
            } else {
              // Step towards target
              const speed = 0.12;
              const angle = Math.atan2(tx - cx, tz - cz);
              return {
                ...c,
                currentPos: [
                  cx + Math.sin(angle) * speed,
                  c.currentPos[1],
                  cz + Math.cos(angle) * speed
                ],
                rotation: angle
              };
            }
          }

          // Waiting for drink -> patience ticks
          if (c.state === 'waiting_drink' && c.order) {
            const decorPatienceBonus = 1 + stats.decorLevel * 0.15;
            const newPatience = c.order.currentPatience - (1.0 / decorPatienceBonus);

            if (newPatience <= 0) {
              // Customer lost patience and leaves angrily
              soundManager.playWrong();
              showToast(
                settings.language === 'id' 
                  ? `${c.name} kehabisan kesabaran dan pergi! (-0.2 Reputasi)` 
                  : `${c.name} lost patience and left! (-0.2 Rep)`,
                'warning'
              );

              setStats(s => ({
                ...s,
                reputation: Math.max(1.0, s.reputation - 0.2)
              }));

              setDayStats(ds => ({
                ...ds,
                mistakes: ds.mistakes + 1,
                reputationChange: ds.reputationChange - 0.2,
                satisfactionRate: Math.max(20, Math.round(ds.satisfactionRate * 0.85))
              }));

              return {
                ...c,
                state: 'leaving',
                targetPos: [7.5, 0, 4.5], // exit door
                order: null
              };
            }

            return {
              ...c,
              order: {
                ...c.order,
                currentPatience: newPatience
              }
            };
          }

          // Drinking coffee
          if (c.state === 'drinking') {
            const newProg = c.drinkProgress + 0.08;
            if (newProg >= 1.0) {
              // Finished drinking, stands up and leaves happily
              return {
                ...c,
                state: 'leaving',
                targetPos: [7.5, 0, 4.5] // exit door
              };
            }
            return {
              ...c,
              drinkProgress: newProg
            };
          }

          // Leaving the cafe
          if (c.state === 'leaving') {
            const tx = c.targetPos[0];
            const tz = c.targetPos[2];
            const cx = c.currentPos[0];
            const cz = c.currentPos[2];
            const dist = Math.sqrt((tx - cx) ** 2 + (tz - cz) ** 2);

            if (dist < 0.3) {
              return { ...c, state: 'left' };
            } else {
              const speed = 0.14;
              const angle = Math.atan2(tx - cx, tz - cz);
              return {
                ...c,
                currentPos: [
                  cx + Math.sin(angle) * speed,
                  c.currentPos[1],
                  cz + Math.cos(angle) * speed
                ],
                rotation: angle
              };
            }
          }

          return c;
        }).filter(c => c.state !== 'left');
      });
    }, 300);

    // Staff Barista Assistant Helper: auto-crafts/serves if hired
    const staffInterval = window.setInterval(() => {
      if (stats.staffLevel <= 0) return;
      setCustomers(prev => {
        const waitingCustomer = prev.find(c => c.state === 'waiting_drink' && c.order);
        if (!waitingCustomer || !waitingCustomer.order) return prev;

        // Barista assistant serves customer automatically!
        soundManager.playSuccess();
        const earned = waitingCustomer.order.price;
        setStats(s => ({
          ...s,
          money: s.money + earned,
          reputation: Math.min(5.0, s.reputation + 0.05),
          totalCustomersServed: s.totalCustomersServed + 1
        }));

        setDayStats(ds => ({
          ...ds,
          customersServed: ds.customersServed + 1,
          moneyEarned: ds.moneyEarned + earned
        }));

        setDailyGoal(g => {
          const next = g.current + 1;
          return {
            ...g,
            current: next,
            completed: next >= g.target
          };
        });

        showToast(
          settings.language === 'id'
            ? `Asisten Barista menyajikan ${waitingCustomer.order.drinkName}! (+$${earned})`
            : `Staff Barista served ${waitingCustomer.order.drinkName}! (+$${earned})`,
          'success'
        );

        return prev.map(c => c.id === waitingCustomer.id ? { ...c, state: 'drinking', drinkProgress: 0 } : c);
      });
    }, stats.staffLevel === 1 ? 9000 : 5500);

    return () => {
      clearInterval(dayInterval);
      clearInterval(customerInterval);
      clearInterval(patienceInterval);
      clearInterval(staffInterval);
    };
  }, [gameState, stats]);

  // Sync customers to 3D Three.js world
  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.updateCustomers(customers);
    }
  }, [customers]);

  // Helper to generate a new customer
  const createNewCustomer = (currentList: CustomerData[]): CustomerData => {
    soundManager.playBell();

    const names = [
      'Emma', 'Oliver', 'Sophie', 'Liam', 'Maya', 'Lucas', 'Zara', 'Alex',
      'Rico', 'Nadia', 'Budi', 'Sarah', 'Kenji', 'Chloe', 'Daniel', 'Mia'
    ];
    const customerTypes: CustomerType[] = ['casual', 'student', 'worker', 'elderly', 'enthusiast'];
    if (stats.level >= 4) customerTypes.push('vip');

    const type = customerTypes[Math.floor(Math.random() * customerTypes.length)];
    const name = names[Math.floor(Math.random() * names.length)];

    // Find available table or counter
    const takenTables = new Set(currentList.map(c => c.tableIndex));
    let assignedTable = -1; // default standing counter

    for (let i = 0; i < stats.tableCount; i++) {
      if (!takenTables.has(i)) {
        assignedTable = i;
        break;
      }
    }

    // Determine target coordinate
    let targetPos: [number, number, number] = [1.6, 0, -1.2]; // standing at order counter
    if (assignedTable >= 0 && worldRef.current?.tablePositions[assignedTable]) {
      const chairPos = worldRef.current.tablePositions[assignedTable].chairPos;
      targetPos = [chairPos.x, 0, chairPos.z];
    }

    // Choose drink from unlocked drinks
    const drinkId = stats.unlockedDrinks[Math.floor(Math.random() * stats.unlockedDrinks.length)];
    const recipe = ALL_DRINKS[drinkId] || ALL_DRINKS.espresso;

    // Patience based on customer type
    const basePatience = type === 'vip' ? 55 : type === 'worker' ? 38 : 48;

    const order: CustomerOrder = {
      orderId: Math.random().toString(),
      drinkId: recipe.id,
      drinkName: recipe.name,
      price: recipe.price * (type === 'vip' ? 2.5 : 1.0),
      maxPatience: basePatience,
      currentPatience: basePatience,
      tableIndex: assignedTable
    };

    const clothesColors = ['#1976d2', '#d32f2f', '#388e3c', '#fbc02d', '#7b1fa2', '#00796b', '#e64a19'];
    const hairColors = ['#212121', '#4e342e', '#8d6e63', '#d7ccc8', '#ffb74d'];

    return {
      id: Math.random().toString(),
      name,
      type,
      order,
      state: 'entering',
      currentPos: [7.5, 0, 4.5], // entrance door coordinates
      targetPos,
      rotation: -Math.PI / 2,
      tableIndex: assignedTable,
      clothesColor: clothesColors[Math.floor(Math.random() * clothesColors.length)],
      hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
      drinkProgress: 0,
      patienceSpeed: 1.0,
      isPleased: false
    };
  };

  // --- Interaction Dispatcher ---
  const handleInteraction = () => {
    if (!currentInteractiveTarget) return;

    // 1. Espresso Machine interaction
    if (currentInteractiveTarget.type === 'machine') {
      soundManager.playClick();
      // Auto-suggest first waiting order's drink if any
      const waitingCust = customers.find(c => c.state === 'waiting_drink' && c.order);
      setSelectedBrewDrinkId(waitingCust?.order?.drinkId || stats.unlockedDrinks[0]);
      setIsCraftingOpen(true);
      return;
    }

    // 2. Order Counter or Table Serving interaction
    if (currentInteractiveTarget.type === 'counter' || currentInteractiveTarget.type === 'table') {
      const tableIdx = currentInteractiveTarget.tableIndex ?? -1;

      // Find customer at this spot
      const targetCustomer = customers.find(c => {
        if (c.state !== 'waiting_drink' || !c.order) return false;
        if (tableIdx >= 0) return c.tableIndex === tableIdx;
        return c.tableIndex === -1; // counter
      });

      if (!targetCustomer || !targetCustomer.order) {
        showToast(
          settings.language === 'id' ? 'Tidak ada pesanan di meja ini.' : 'No active order at this table.',
          'info'
        );
        return;
      }

      // Check if player is holding the required drink
      if (heldItem && heldItem.drinkId === targetCustomer.order.drinkId) {
        // Perfect Match Serve!
        serveDrinkToCustomer(targetCustomer);
      } else if (heldItem) {
        // Wrong Drink!
        soundManager.playWrong();
        showToast(
          settings.language === 'id' 
            ? `Pesanan salah! ${targetCustomer.name} memesan ${targetCustomer.order.drinkName}.` 
            : `Wrong drink! ${targetCustomer.name} ordered a ${targetCustomer.order.drinkName}.`,
          'warning'
        );
      } else {
        // Player has no drink in hand -> prompt them to brew it
        showToast(
          settings.language === 'id'
            ? `Pesanan: ${targetCustomer.order.drinkName}. Seduh di mesin kopi!`
            : `Order: ${targetCustomer.order.drinkName}. Brew it at the espresso machine!`,
          'info'
        );
        setSelectedBrewDrinkId(targetCustomer.order.drinkId);
        setIsCraftingOpen(true);
      }
    }
  };

  // Serve drink logic
  const serveDrinkToCustomer = (customer: CustomerData) => {
    if (!customer.order) return;

    soundManager.playCash();
    const isVip = customer.type === 'vip';
    const patienceRatio = customer.order.currentPatience / customer.order.maxPatience;
    const speedBonus = patienceRatio > 0.6 ? 2.0 : 0.5;
    const decorTipBonus = 1 + stats.decorLevel * 0.2;
    const totalEarned = Number((customer.order.price + (isVip ? 5.0 : 0) + speedBonus * decorTipBonus).toFixed(2));

    // Clear held drink
    setHeldItem(null);

    // Update customer to drinking state
    setCustomers(prev => prev.map(c => {
      if (c.id === customer.id) {
        return {
          ...c,
          state: 'drinking',
          drinkProgress: 0,
          isPleased: true
        };
      }
      return c;
    }));

    // Update player financial & reputation stats
    setStats(s => {
      const newRep = Math.min(5.0, s.reputation + (patienceRatio > 0.5 ? 0.1 : 0.02));
      const newCount = s.totalCustomersServed + 1;
      
      // Auto level up shop as customers served grow
      let newLevel = s.level;
      let newUnlocked = [...s.unlockedDrinks];
      if (newCount >= 18 && s.level < 4) {
        newLevel = 4;
      } else if (newCount >= 10 && s.level < 3) {
        newLevel = 3;
        if (!newUnlocked.includes('tea')) newUnlocked.push('tea');
        if (!newUnlocked.includes('chocolate')) newUnlocked.push('chocolate');
      } else if (newCount >= 4 && s.level < 2) {
        newLevel = 2;
        if (!newUnlocked.includes('latte')) newUnlocked.push('latte');
        if (!newUnlocked.includes('iced_coffee')) newUnlocked.push('iced_coffee');
      }

      return {
        ...s,
        money: s.money + totalEarned,
        reputation: newRep,
        level: newLevel,
        unlockedDrinks: newUnlocked,
        totalCustomersServed: newCount
      };
    });

    // Update Day Stats
    setDayStats(ds => ({
      ...ds,
      customersServed: ds.customersServed + 1,
      moneyEarned: ds.moneyEarned + totalEarned,
      reputationChange: ds.reputationChange + 0.1
    }));

    // Update Daily Goal
    setDailyGoal(g => {
      const next = g.current + 1;
      const isMet = next >= g.target;
      if (isMet && !g.completed) {
        soundManager.playSuccess();
        showToast(
          settings.language === 'id' 
            ? `🎉 Target Harian Tercapai! Bonus +$${g.rewardMoney}` 
            : `🎉 Daily Goal Met! Bonus +$${g.rewardMoney}`, 
          'success'
        );
        setStats(s => ({ ...s, money: s.money + g.rewardMoney }));
      }
      return {
        ...g,
        current: next,
        completed: isMet
      };
    });

    showToast(
      settings.language === 'id'
        ? `Sempurna! +$${totalEarned} (${customer.name} senang!)`
        : `Perfect! +$${totalEarned} (${customer.name} is happy!)`,
      'success'
    );
  };

  // When day time runs out
  const handleDayEnded = () => {
    setIsCraftingOpen(false);
    setGameState('daySummary');
  };

  // Start Next Day
  const handleStartNextDay = () => {
    const nextDay = stats.day + 1;
    setStats(s => ({ ...s, day: nextDay }));
    setDayTimeRemaining(DAY_DURATION_SECONDS);
    setCustomers([]);
    setHeldItem(null);

    // Create new daily goal
    const targetCount = 5 + nextDay * 2;
    const reward = 35 + nextDay * 15;
    setDailyGoal({
      id: `goal_day_${nextDay}`,
      title: `Serve ${targetCount} Customers`,
      titleId: `Layani ${targetCount} Pelanggan`,
      target: targetCount,
      current: 0,
      rewardMoney: reward,
      completed: false,
      type: 'serve_count'
    });

    setDayStats({
      day: nextDay,
      customersServed: 0,
      moneyEarned: 0,
      tipsEarned: 0,
      mistakes: 0,
      satisfactionRate: 100,
      reputationChange: 0
    });

    setGameState('playing');
    soundManager.playBell();
  };

  // Retry same day
  const handleRetryDay = () => {
    setDayTimeRemaining(DAY_DURATION_SECONDS);
    setCustomers([]);
    setHeldItem(null);
    setDailyGoal(g => ({ ...g, current: 0, completed: false }));
    setDayStats({
      day: stats.day,
      customersServed: 0,
      moneyEarned: 0,
      tipsEarned: 0,
      mistakes: 0,
      satisfactionRate: 100,
      reputationChange: 0
    });
    setGameState('playing');
  };

  // Purchasing upgrades
  const handlePurchaseUpgrade = (upgradeId: string, cost: number) => {
    setStats(s => {
      let newMachine = s.machineLevel;
      let newTables = s.tableCount;
      let newDecor = s.decorLevel;
      let newStaff = s.staffLevel;

      if (upgradeId === 'machine_upgrade') newMachine += 1;
      if (upgradeId === 'tables_upgrade') newTables += 1;
      if (upgradeId === 'decor_upgrade') newDecor += 1;
      if (upgradeId === 'staff_upgrade') newStaff += 1;

      return {
        ...s,
        money: s.money - cost,
        machineLevel: newMachine,
        tableCount: newTables,
        decorLevel: newDecor,
        staffLevel: newStaff
      };
    });

    showToast(
      settings.language === 'id' ? 'Upgrade berhasil dipasang di kafe!' : 'Upgrade installed in your cafe!',
      'success'
    );
  };

  const handleResetSave = () => {
    localStorage.removeItem('coffee_shop_stats_v1');
    setStats(INITIAL_STATS);
    setDayTimeRemaining(DAY_DURATION_SECONDS);
    setCustomers([]);
    setHeldItem(null);
    setGameState('menu');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1c140e] select-none font-sans">
      {/* 3D WebGL Canvas Container */}
      <div 
        ref={canvasContainerRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fadeIn">
          <div className={`px-4 py-2 rounded-2xl shadow-2xl font-bold text-xs sm:text-sm flex items-center gap-2 border ${
            toast.type === 'success' 
              ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500/60' 
              : toast.type === 'warning'
                ? 'bg-rose-900/90 text-rose-200 border-rose-500/60'
                : 'bg-[#2e1d14]/90 text-amber-200 border-amber-600/60'
          }`}>
            <span>{toast.type === 'success' ? '✨' : toast.type === 'warning' ? '⚠️' : '☕'}</span>
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Main Menu Screen */}
      {gameState === 'menu' && (
        <MainMenu
          settings={settings}
          onPlay={() => {
            if (stats.day === 1 && stats.totalCustomersServed === 0) {
              setGameState('intro');
            } else {
              setGameState('playing');
            }
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
        />
      )}

      {/* Intro Story Modal */}
      {gameState === 'intro' && (
        <IntroStoryModal
          settings={settings}
          onFinishIntro={() => setGameState('playing')}
        />
      )}

      {/* In-Game Active HUD */}
      {gameState === 'playing' && (
        <>
          <HUD
            stats={stats}
            dayTimeRemaining={dayTimeRemaining}
            dayTotalTime={DAY_DURATION_SECONDS}
            currentOrders={customers.filter(c => c.state === 'waiting_drink' && c.order)}
            dailyGoal={dailyGoal}
            heldItem={heldItem}
            interactiveTarget={currentInteractiveTarget}
            settings={settings}
            onOpenShop={() => setIsShopOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenHelp={() => setIsHelpOpen(true)}
            onToggleMusic={() => {
              const newVol = settings.musicVolume > 0 ? 0 : 0.5;
              soundManager.setMusicVolume(newVol);
              setSettings(s => ({ ...s, musicVolume: newVol }));
            }}
            onInteract={handleInteraction}
            onDiscardItem={() => {
              soundManager.playClick();
              setHeldItem(null);
            }}
            onSelectCustomer={(c) => {
              if (c.order) {
                setSelectedBrewDrinkId(c.order.drinkId);
                setIsCraftingOpen(true);
              }
            }}
          />

          {/* Virtual Touch Joystick & D-pad for mobile/tablet screens */}
          <TouchControls
            onMove={(dx, dy) => {
              touchInput.current = { x: dx, y: dy };
            }}
            onStop={() => {
              touchInput.current = { x: 0, y: 0 };
            }}
            onInteract={handleInteraction}
            hasInteractTarget={!!currentInteractiveTarget}
          />
        </>
      )}

      {/* Day Summary Screen */}
      {gameState === 'daySummary' && (
        <DaySummaryModal
          stats={dayStats}
          isGoalMet={dailyGoal.completed}
          rewardMoney={dailyGoal.rewardMoney}
          settings={settings}
          onOpenShop={() => setIsShopOpen(true)}
          onNextDay={handleStartNextDay}
          onRetryDay={handleRetryDay}
        />
      )}

      {/* Drink Crafting Mini-Station Modal */}
      {isCraftingOpen && (
        <DrinkCraftingModal
          unlockedDrinks={stats.unlockedDrinks}
          machineLevel={stats.machineLevel}
          initialDrinkId={selectedBrewDrinkId}
          settings={settings}
          onFinishDrink={(item) => {
            setHeldItem(item);
          }}
          onClose={() => setIsCraftingOpen(false)}
          onTriggerSteam={() => worldRef.current?.triggerBrewSteam()}
          onStopSteam={() => worldRef.current?.stopBrewSteam()}
        />
      )}

      {/* Shop & Upgrades Modal */}
      {isShopOpen && (
        <ShopModal
          stats={stats}
          settings={settings}
          onPurchaseUpgrade={handlePurchaseUpgrade}
          onClose={() => setIsShopOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newVals) => setSettings(s => ({ ...s, ...newVals }))}
          onResetSave={handleResetSave}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Help & Tutorial Modal */}
      {isHelpOpen && (
        <HelpModal
          settings={settings}
          onClose={() => setIsHelpOpen(false)}
        />
      )}
    </div>
  );
}
