export const categories = [
  { id: 1, name: "Starters", status: "active", count: 12 },
  { id: 2, name: "Main Course", status: "active", count: 24 },
  { id: 3, name: "Breads", status: "active", count: 8 },
  { id: 4, name: "Rice & Biryani", status: "active", count: 10 },
  { id: 5, name: "Beverages", status: "active", count: 15 },
  { id: 6, name: "Desserts", status: "active", count: 7 },
  { id: 7, name: "Chinese", status: "inactive", count: 6 },
];

export const items = [
  { id: 1, cat: 1, name: "Paneer Tikka", price: 240, tax: 5, type: "veg", available: true },
  { id: 2, cat: 1, name: "Chicken 65", price: 280, tax: 5, type: "nonveg", available: true },
  { id: 3, cat: 1, name: "Veg Spring Roll", price: 180, tax: 5, type: "veg", available: true },
  { id: 4, cat: 2, name: "Butter Chicken", price: 320, tax: 5, type: "nonveg", available: true },
  { id: 5, cat: 2, name: "Paneer Butter Masala", price: 280, tax: 5, type: "veg", available: true },
  { id: 6, cat: 2, name: "Dal Makhani", price: 220, tax: 5, type: "veg", available: true },
  { id: 7, cat: 2, name: "Mutton Rogan Josh", price: 380, tax: 5, type: "nonveg", available: false },
  { id: 8, cat: 3, name: "Butter Naan", price: 60, tax: 5, type: "veg", available: true },
  { id: 9, cat: 3, name: "Garlic Naan", price: 80, tax: 5, type: "veg", available: true },
  { id: 10, cat: 3, name: "Tandoori Roti", price: 40, tax: 5, type: "veg", available: true },
  { id: 11, cat: 4, name: "Chicken Biryani", price: 290, tax: 5, type: "nonveg", available: true },
  { id: 12, cat: 4, name: "Veg Biryani", price: 220, tax: 5, type: "veg", available: true },
  { id: 13, cat: 5, name: "Masala Chai", price: 40, tax: 5, type: "veg", available: true },
  { id: 14, cat: 5, name: "Fresh Lime Soda", price: 80, tax: 5, type: "veg", available: true },
  { id: 15, cat: 5, name: "Cold Coffee", price: 120, tax: 5, type: "veg", available: true },
  { id: 16, cat: 6, name: "Gulab Jamun", price: 90, tax: 5, type: "veg", available: true },
  { id: 17, cat: 6, name: "Ice Cream", price: 110, tax: 5, type: "veg", available: true },
];

export const tables = [
  { id: 1, name: "T-01", capacity: 2, status: "available" },
  { id: 2, name: "T-02", capacity: 4, status: "occupied" },
  { id: 3, name: "T-03", capacity: 4, status: "available" },
  { id: 4, name: "T-04", capacity: 6, status: "billing" },
  { id: 5, name: "T-05", capacity: 2, status: "reserved" },
  { id: 6, name: "T-06", capacity: 4, status: "occupied" },
  { id: 7, name: "T-07", capacity: 8, status: "available" },
  { id: 8, name: "T-08", capacity: 4, status: "available" },
  { id: 9, name: "T-09", capacity: 2, status: "occupied" },
  { id: 10, name: "T-10", capacity: 6, status: "available" },
  { id: 11, name: "T-11", capacity: 4, status: "reserved" },
  { id: 12, name: "T-12", capacity: 4, status: "available" },
];

export const recentOrders = [
  { id: "ORD-1042", table: "T-02", items: 6, total: 1240, status: "Paid", time: "12:42 PM" },
  { id: "ORD-1041", table: "T-06", items: 3, total: 680, status: "Billed", time: "12:30 PM" },
  { id: "ORD-1040", table: "T-09", items: 4, total: 920, status: "Paid", time: "12:18 PM" },
  { id: "ORD-1039", table: "T-04", items: 8, total: 1820, status: "Pending", time: "12:05 PM" },
  { id: "ORD-1038", table: "T-01", items: 2, total: 320, status: "Paid", time: "11:54 AM" },
];

export const kots = [
  { id: "KOT-201", table: "T-02", items: 4, status: "preparing", time: "12:45 PM" },
  { id: "KOT-200", table: "T-06", items: 2, status: "pending", time: "12:42 PM" },
  { id: "KOT-199", table: "T-04", items: 5, status: "completed", time: "12:20 PM" },
  { id: "KOT-198", table: "T-09", items: 3, status: "completed", time: "12:10 PM" },
];

export const bills = [
  { id: "BILL-501", order: "ORD-1042", table: "T-02", amount: 1240, mode: "UPI", status: "Paid", date: "Today 12:50 PM" },
  { id: "BILL-500", order: "ORD-1041", table: "T-06", amount: 680, mode: "Cash", status: "Paid", date: "Today 12:35 PM" },
  { id: "BILL-499", order: "ORD-1040", table: "T-09", amount: 920, mode: "Card", status: "Paid", date: "Today 12:22 PM" },
  { id: "BILL-498", order: "ORD-1039", table: "T-04", amount: 1820, mode: "-", status: "Unpaid", date: "Today 12:10 PM" },
];

export const topItems = [
  { name: "Butter Chicken", qty: 42, revenue: 13440 },
  { name: "Paneer Tikka", qty: 38, revenue: 9120 },
  { name: "Chicken Biryani", qty: 35, revenue: 10150 },
  { name: "Butter Naan", qty: 96, revenue: 5760 },
  { name: "Masala Chai", qty: 72, revenue: 2880 },
];

export const backups = [
  { id: 1, file: "adaptpos_2026-05-18.sql", size: "4.2 MB", type: "Manual", date: "2026-05-18 10:30" },
  { id: 2, file: "adaptpos_2026-05-17.sql", size: "4.1 MB", type: "Auto", date: "2026-05-17 23:00" },
  { id: 3, file: "adaptpos_2026-05-16.sql", size: "4.0 MB", type: "Auto", date: "2026-05-16 23:00" },
];