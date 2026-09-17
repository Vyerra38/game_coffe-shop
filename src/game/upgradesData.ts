import { ShopUpgrade } from '../types';

export const SHOP_UPGRADES: ShopUpgrade[] = [
  // Coffee Machines
  {
    id: 'machine_upgrade',
    category: 'machine',
    name: 'Espresso Machine',
    nameId: 'Mesin Kopi',
    description: 'Upgraded heating element and pressure gauge speeds up drink preparation.',
    descriptionId: 'Elemen pemanas dan tekanan lebih tinggi mempercepat pembuatan kopi.',
    level: 1,
    maxLevel: 4,
    cost: 80,
    icon: '☕',
    unlocked: true,
    effectDescription: '+25% Brewing Speed per level'
  },
  // Tables & Seating
  {
    id: 'tables_upgrade',
    category: 'furniture',
    name: 'Bistro Seating',
    nameId: 'Meja & Kursi',
    description: 'Add charming handcrafted wooden tables so more customers can dine in.',
    descriptionId: 'Tambahkan meja dan kursi kayu agar lebih banyak pelanggan bisa duduk.',
    level: 1,
    maxLevel: 4,
    cost: 65,
    icon: '🪑',
    unlocked: true,
    effectDescription: '+1 Customer Seating capacity per level'
  },
  // Cozy Decor
  {
    id: 'decor_upgrade',
    category: 'decor',
    name: 'Cozy Atmosphere Decor',
    nameId: 'Dekorasi Kafe',
    description: 'Potted monsteras, warm Edison string lights, and a vintage cafe rug boost customer patience and tips.',
    descriptionId: 'Tanaman hias, lampu gantung hangat, dan karpet vintage membuat pelanggan lebih sabar dan memberi tip.',
    level: 0,
    maxLevel: 3,
    cost: 50,
    icon: '🌱',
    unlocked: true,
    effectDescription: '+15% Customer Patience & Tip size'
  },
  // Staff
  {
    id: 'staff_upgrade',
    category: 'staff',
    name: 'Barista Assistant',
    nameId: 'Rekrut Barista',
    description: 'Hire an energetic barista who automatically crafts incoming orders and assists at the counter.',
    descriptionId: 'Pekerjakan barista handal yang otomatis membantu meracik pesanan pelanggan.',
    level: 0,
    maxLevel: 2,
    cost: 150,
    icon: '👨‍🍳',
    unlocked: true,
    effectDescription: 'Auto-brews drinks and assists service'
  }
];

export function getUpgradeCost(upgradeId: string, currentLevel: number): number {
  const baseCosts: Record<string, number> = {
    machine_upgrade: 80,
    tables_upgrade: 65,
    decor_upgrade: 50,
    staff_upgrade: 160
  };
  const base = baseCosts[upgradeId] || 75;
  return Math.round(base * Math.pow(1.8, currentLevel));
}
