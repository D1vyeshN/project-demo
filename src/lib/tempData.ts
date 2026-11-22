import type { Item, Party } from './types';
import { GST_RATES, UNITS, CATEGORIES } from './constants';

// Random generators
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomItem(): Omit<Item, 'id' | 'createdAt' | 'updatedAt'> {
  const categories = CATEGORIES.filter((c) => c !== 'Other');
  const category = categories[randomInt(0, categories.length - 1)];
  const unit = UNITS[randomInt(0, UNITS.length - 1)];
  const gstRate = GST_RATES[randomInt(0, GST_RATES.length - 1)];
  const skuNum = randomInt(1, 9999).toString().padStart(4, '0');

  let name: string;
  let sellingPrice: number;
  let currentStock: number;

  switch (category) {
    case 'Electronics':
      name = `Electronics Item ${skuNum}`;
      sellingPrice = randomFloat(1000, 50000);
      currentStock = randomInt(0, 100);
      break;
    case 'Furniture':
      name = `Furniture ${skuNum}`;
      sellingPrice = randomFloat(2000, 15000);
      currentStock = randomInt(1, 50);
      break;
    case 'Groceries':
      name = `Grocery ${skuNum}`;
      sellingPrice = randomFloat(50, 500);
      currentStock = randomInt(10, 200);
      break;
    case 'Accessories':
      name = `Accessory ${skuNum}`;
      sellingPrice = randomFloat(200, 2000);
      currentStock = randomInt(0, 150);
      break;
    case 'Stationery':
      name = `Stationery ${skuNum}`;
      sellingPrice = randomFloat(10, 500);
      currentStock = randomInt(5, 100);
      break;
    default:
      name = `Other Item ${skuNum}`;
      sellingPrice = randomFloat(100, 1000);
      currentStock = randomInt(0, 50);
  }

  const openingStock = currentStock + randomInt(0, 50);

  return {
    sku: `SKU-${skuNum}`,
    name,
    category,
    sellingPrice,
    gstRate,
    unit,
    openingStock,
    currentStock,
    description: `${name} - Random test item`,
    imageUrl: '',
  };
}

const firstNames = [
  'Amit', 'Priya', 'Raj', 'Sneha', 'Kumar', 'Anjali', 'Vikram', 'Pooja',
  'Deepak', 'Neha', 'Ramesh', 'Kavita', 'Suresh', 'Meet', 'Harsh', 'Ishita',
  'Rahul', 'Shreya', 'Mohit', 'Riya', 'Vishal', 'Nandini', 'Arjun', 'Sia',
  'Kunal', 'Tara', 'Manoj', 'Esha', 'Dinesh', 'Latika', 'Guruvayurappa', 'Meera',
];

const lastNames = [
  'Sharma', 'Patel', 'Kumar', 'Singh', 'Desai', 'Mehta', 'Joshi', 'Reddy',
  'Iyer', 'Chauhan', 'Verma', 'Shroff', 'Gupta', 'Chatterjee', 'Banerjee',
  'Saxena', 'Trivedi', 'Patwardhan', 'Deshmukh', 'Kulkarni',
];

function randomParty(): Omit<Party, 'id' | 'createdAt' | 'updatedAt'> {
  const firstName = firstNames[randomInt(0, firstNames.length - 1)];
  const lastName = lastNames[randomInt(0, lastNames.length - 1)];
  const name = `${firstName} ${lastName}`;
  const phone = `9${randomInt(800000000, 999999999)}`;

  const hasGstin = Math.random() > 0.4;
  const gstin = hasGstin
    ? `${randomInt(20, 29)}${Array(5).fill(0).map(() => randomInt(0, 9)).join('')}${firstName.substring(0, 3).toUpperCase()}${randomInt(0, 99999)}${randomInt(0, 9)}`
    : undefined;

  const openingOutstanding = Math.abs(randomFloat(-50000, 50000));

  return {
    name,
    phone,
    gstin,
    address: `${randomInt(1, 100)}, ${Array(4).fill(0).map(() => String.fromCharCode(randomInt(65, 90))).join('')} Road, City`,
    openingOutstanding,
    currentOutstanding: openingOutstanding,
  };
}

/**
 * Generate 10 random items
 */
export function generateTempItems(): Omit<Item, 'id' | 'createdAt' | 'updatedAt'>[] {
  return Array.from({ length: 10 }, () => randomItem());
}

/**
 * Generate 10 random parties
 */
export function generateTempParties(): Omit<Party, 'id' | 'createdAt' | 'updatedAt'>[] {
  return Array.from({ length: 10 }, () => randomParty());
}