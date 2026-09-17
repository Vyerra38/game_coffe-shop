export type GameState = 'menu' | 'intro' | 'playing' | 'daySummary' | 'shop' | 'settings';

export type DrinkId = 
  | 'espresso' 
  | 'americano' 
  | 'cappuccino' 
  | 'latte' 
  | 'iced_coffee' 
  | 'tea' 
  | 'chocolate';

export interface IngredientStep {
  id: string;
  name: string;
  nameId: string;
  icon: string;
}

export interface DrinkRecipe {
  id: DrinkId;
  name: string;
  price: number;
  basePrepTime: number; // in seconds
  unlockLevel: number;
  icon: string;
  color: string;
  steps: string[]; // step IDs: 'cup', 'espresso', 'water', 'milk', 'foam', 'ice', 'tea_bag', 'chocolate', 'latte_art'
  description: string;
  descriptionId: string;
}

export interface CustomerOrder {
  orderId: string;
  drinkId: DrinkId;
  drinkName: string;
  price: number;
  maxPatience: number; // seconds
  currentPatience: number;
  tableIndex: number; // -1 for counter standing, 0..N for seated tables
}

export type CustomerType = 'student' | 'worker' | 'casual' | 'elderly' | 'enthusiast' | 'vip';

export interface CustomerData {
  id: string;
  name: string;
  type: CustomerType;
  order: CustomerOrder | null;
  state: 'entering' | 'walking_to_spot' | 'waiting_order' | 'waiting_drink' | 'drinking' | 'leaving' | 'left';
  targetPos: [number, number, number];
  currentPos: [number, number, number];
  rotation: number;
  tableIndex: number; // -1 if at counter
  clothesColor: string;
  hairColor: string;
  drinkProgress: number; // 0 to 1 when drinking
  patienceSpeed: number; // 1.0 standard, VIP or in a rush can be faster
  isPleased: boolean;
}

export interface DailyGoal {
  id: string;
  title: string;
  titleId: string;
  target: number;
  current: number;
  rewardMoney: number;
  completed: boolean;
  type: 'serve_count' | 'earn_money' | 'perfect_streak';
}

export interface DayStats {
  day: number;
  customersServed: number;
  moneyEarned: number;
  tipsEarned: number;
  mistakes: number;
  satisfactionRate: number; // 0 to 100%
  reputationChange: number;
}

export interface ShopUpgrade {
  id: string;
  category: 'machine' | 'furniture' | 'decor' | 'staff';
  name: string;
  nameId: string;
  description: string;
  descriptionId: string;
  level: number;
  maxLevel: number;
  cost: number;
  icon: string;
  unlocked: boolean;
  effectDescription: string;
}

export interface PlayerStats {
  money: number;
  reputation: number; // 1.0 to 5.0
  level: number;
  day: number;
  machineLevel: number;
  tableCount: number; // 2, 3, 4, 5
  decorLevel: number; // 0, 1, 2, 3
  staffLevel: number; // 0 = none, 1 = trainee, 2 = pro
  unlockedDrinks: DrinkId[];
  totalCustomersServed: number;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  language: 'id' | 'en';
}

export interface HeldItem {
  drinkId: DrinkId;
  drinkName: string;
  quality: 'perfect' | 'good' | 'average';
}
