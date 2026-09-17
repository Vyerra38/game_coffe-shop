import { DrinkRecipe, DrinkId } from '../types';

export const ALL_DRINKS: Record<DrinkId, DrinkRecipe> = {
  espresso: {
    id: 'espresso',
    name: 'Espresso',
    price: 4,
    basePrepTime: 3.5,
    unlockLevel: 1,
    icon: '☕',
    color: '#3e2723',
    steps: ['cup', 'espresso'],
    description: 'Rich, concentrated coffee shot with a dense golden crema.',
    descriptionId: 'Suntikan kopi pekat dan nikmat dengan lapisan crema keemasan.'
  },
  americano: {
    id: 'americano',
    name: 'Americano',
    price: 5,
    basePrepTime: 4.0,
    unlockLevel: 1,
    icon: '☕',
    color: '#4e342e',
    steps: ['cup', 'espresso', 'water'],
    description: 'Fresh espresso shot diluted with crystal hot water.',
    descriptionId: 'Espresso segar dipadukan dengan air panas murni.'
  },
  cappuccino: {
    id: 'cappuccino',
    name: 'Cappuccino',
    price: 6,
    basePrepTime: 5.0,
    unlockLevel: 1,
    icon: '☕',
    color: '#8d6e63',
    steps: ['cup', 'espresso', 'milk', 'foam'],
    description: 'Equal harmony of rich espresso, velvety steamed milk, and dense foam.',
    descriptionId: 'Harmoni espresso kaya rasa, susu hangat lembut, dan busa tebal.'
  },
  latte: {
    id: 'latte',
    name: 'Caffe Latte',
    price: 6.5,
    basePrepTime: 5.2,
    unlockLevel: 2,
    icon: '☕',
    color: '#d7ccc8',
    steps: ['cup', 'espresso', 'milk', 'latte_art'],
    description: 'Creamy steamed milk with an espresso foundation and poured latte art.',
    descriptionId: 'Susu lembut dengan dasar espresso dan hiasan seni latte indah.'
  },
  iced_coffee: {
    id: 'iced_coffee',
    name: 'Iced Coffee',
    price: 7,
    basePrepTime: 4.8,
    unlockLevel: 2,
    icon: '🧊',
    color: '#5d4037',
    steps: ['cup', 'ice', 'espresso', 'milk'],
    description: 'Chilled iced coffee with refreshing milk over cold crystal cubes.',
    descriptionId: 'Kopi dingin menyegarkan dengan susu dan es batu kristal.'
  },
  tea: {
    id: 'tea',
    name: 'Herbal Tea',
    price: 4.5,
    basePrepTime: 3.8,
    unlockLevel: 3,
    icon: '🍵',
    color: '#558b2f',
    steps: ['cup', 'water', 'tea_bag'],
    description: 'Fragrant aromatic herbal tea steeped in hot soothing water.',
    descriptionId: 'Teh herbal harum diseduh dengan air panas yang menenangkan.'
  },
  chocolate: {
    id: 'chocolate',
    name: 'Hot Chocolate',
    price: 5.5,
    basePrepTime: 4.5,
    unlockLevel: 3,
    icon: '🍫',
    color: '#3e2723',
    steps: ['cup', 'milk', 'chocolate', 'foam'],
    description: 'Decadent dark chocolate melted in steamed whole milk with foam.',
    descriptionId: 'Cokelat pekat lezat dilelehkan dalam susu hangat berbuih.'
  }
};

export const INGREDIENT_DETAILS: Record<string, { name: string; nameId: string; icon: string; color: string }> = {
  cup: { name: 'Paper Cup', nameId: 'Ambil Cup', icon: '🥛', color: '#f5f5dc' },
  espresso: { name: 'Pull Espresso', nameId: 'Tarik Espresso', icon: '☕', color: '#4a2511' },
  water: { name: 'Hot Water', nameId: 'Air Panas', icon: '💧', color: '#81d4fa' },
  milk: { name: 'Steamed Milk', nameId: 'Susu Hangat', icon: '🥛', color: '#fff9c4' },
  foam: { name: 'Milk Foam', nameId: 'Busa Susu', icon: '☁️', color: '#ffffff' },
  ice: { name: 'Ice Cubes', nameId: 'Es Batu', icon: '🧊', color: '#b3e5fc' },
  tea_bag: { name: 'Tea Leaves', nameId: 'Kantong Teh', icon: '🍃', color: '#aed581' },
  chocolate: { name: 'Choco Syrup', nameId: 'Saus Cokelat', icon: '🍫', color: '#3e2723' },
  latte_art: { name: 'Latte Art', nameId: 'Seni Latte', icon: '🌿', color: '#efebe9' }
};
