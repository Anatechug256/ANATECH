import { Category } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'phones-electronics',
    name: 'Phones & Electronics',
    lugandaName: 'Amasimu n’Ebyuma',
    iconName: 'Smartphone',
    description: 'Smartphones, feature phones, chargers, smartwatches, and sound equipment',
    popular: true,
    subcategories: ['Smartphones', 'Keypad Phones', 'Accessories & Chargers', 'Audio & Speakers', 'Smart Watches', 'Tablets'],
    listingCount: 34
  },
  {
    id: 'computers-accessories',
    name: 'Computers & Accessories',
    lugandaName: 'Kkopyuta',
    iconName: 'Laptop',
    description: 'Laptops, desktops, monitors, storage devices, printers, and cables',
    popular: true,
    subcategories: ['Laptops', 'Desktops', 'Monitors & Displays', 'Printers & Scanners', 'Storage & Flash Drives', 'Computer Parts'],
    listingCount: 22
  },
  {
    id: 'vehicles-motorbikes',
    name: 'Vehicles & Boda Bodas',
    lugandaName: 'Emmotoka n’Eppikipiki',
    iconName: 'Car',
    description: 'Cars, Boda Bodas, bicycles, trucks, and spare parts',
    popular: true,
    subcategories: ['Motorcycles & Boda Bodas', 'Saloon Cars & SUVs', 'Vans & Commercial', 'Bicycles', 'Auto Spare Parts', 'Car Audio & Care'],
    listingCount: 18
  },
  {
    id: 'farm-produce-agriculture',
    name: 'Farm Produce & Agriculture',
    lugandaName: 'Eby’Obulimi n’Obulunzi',
    iconName: 'Wheat',
    description: 'Matooke, coffee beans, maize, dairy, animal feeds, seeds, and farm tools',
    popular: true,
    subcategories: ['Fresh Matooke & Bananas', 'Coffee & Tea', 'Cereals & Grains', 'Livestock & Poultry', 'Animal Feeds & Fertilizers', 'Farm Machinery & Tools'],
    listingCount: 29
  },
  {
    id: 'property-rentals',
    name: 'Property & Rentals',
    lugandaName: 'Ettaka n’Ennyumba',
    iconName: 'Building2',
    description: 'Houses for rent, plots of land with titles, apartments, and commercial rentals',
    popular: true,
    subcategories: ['Houses for Rent', 'Apartments for Rent', 'Land & Plots for Sale', 'Commercial Spaces', 'Hostels & Student Rooms', 'Offices'],
    listingCount: 15
  },
  {
    id: 'clothing-shoes',
    name: 'Clothing & Shoes',
    lugandaName: 'Engoye n’Engatto',
    iconName: 'Shirt',
    description: 'Men, women, and children fashion, footwear, traditional attire, and bags',
    popular: true,
    subcategories: ['Men’s Wear', 'Women’s Wear', 'Shoes & Footwear', 'Gomesi & Traditional Wear', 'Kids & Babies', 'Bags & Luggage'],
    listingCount: 41
  },
  {
    id: 'furniture-household',
    name: 'Furniture & Household',
    lugandaName: 'Ebikozesebwa mu Nnyumba',
    iconName: 'Armchair',
    description: 'Sofas, beds, mattresses, dining tables, kitchen appliances, and home decor',
    popular: false,
    subcategories: ['Living Room Furniture', 'Beds & Mattresses', 'Kitchen Appliances', 'Home Decor & Curtains', 'Lighting & Power Backup', 'Office Furniture'],
    listingCount: 19
  },
  {
    id: 'food-groceries',
    name: 'Food & Groceries',
    lugandaName: 'Eby’Okulya',
    iconName: 'Apple',
    description: 'Bulk food, cooking oil, rice, sugar, honey, and fresh market foods',
    popular: false,
    subcategories: ['Rice, Posho & Flour', 'Cooking Oils & Spices', 'Pure Honey & Organic', 'Beverages & Soft Drinks', 'Bakery & Snacks', 'Meat & Fish'],
    listingCount: 14
  },
  {
    id: 'beauty-personal-care',
    name: 'Beauty & Personal Care',
    lugandaName: 'Eby’Obulungi',
    iconName: 'Sparkles',
    description: 'Hair care, skincare, perfumes, salon equipment, and hygiene items',
    popular: false,
    subcategories: ['Hair & Wigs', 'Skincare & Lotions', 'Fragrances & Perfumes', 'Makeup & Cosmetics', 'Salon Equipment', 'Personal Hygiene'],
    listingCount: 16
  },
  {
    id: 'books-education',
    name: 'Books & Education',
    lugandaName: 'Ebitabo n’Eby’Okusoma',
    iconName: 'BookOpen',
    description: 'UNEB past papers, textbooks, stationery, religious books, and novels',
    popular: false,
    subcategories: ['Primary & PLE Materials', 'O & A Level Textbooks', 'University & College', 'Stationery & Pens', 'Novels & Fiction', 'Bibles & Religious'],
    listingCount: 11
  },
  {
    id: 'services',
    name: 'Services & Trades',
    lugandaName: 'Emirimu n’Obuweereza',
    iconName: 'Wrench',
    description: 'Electricians, plumbers, graphic designers, mechanics, delivery, and catering',
    popular: true,
    subcategories: ['Electrical & Wiring', 'Plumbing & Water', 'Web & Graphic Design', 'Motorcycle & Auto Repair', 'Events & Catering', 'Tutoring & Lessons'],
    listingCount: 25
  },
  {
    id: 'other-permitted',
    name: 'Other Permitted Goods',
    lugandaName: 'Ebirala Ebibaliddwaamu',
    iconName: 'Package',
    description: 'Musical instruments, sports equipment, pet supplies, and arts',
    popular: false,
    subcategories: ['Sports & Fitness', 'Musical Instruments', 'Pet Food & Supplies', 'Crafts & Art', 'Hardware & Tools'],
    listingCount: 8
  }
];

export const UGANDAN_DISTRICTS = [
  { id: 'kampala', name: 'Kampala', region: 'Central', hubs: ['Nakawa', 'Central Division', 'Kawempe', 'Makindye', 'Rubaga', 'Ntinda', 'Kisaasi', 'Kololo', 'Bwaise', 'Kalerwe'] },
  { id: 'wakiso', name: 'Wakiso', region: 'Central', hubs: ['Kira', 'Nansana', 'Entebbe Town', 'Kasangati', 'Kyengera', 'Gayaza', 'Namugongo'] },
  { id: 'mukono', name: 'Mukono', region: 'Central', hubs: ['Mukono Town', 'Seeta', 'Goma', 'Mbalala', 'Katosi'] },
  { id: 'jinja', name: 'Jinja', region: 'Eastern', hubs: ['Jinja City', 'Bugembe', 'Walukuba', 'Mafubira', 'Kakira'] },
  { id: 'mbarara', name: 'Mbarara', region: 'Western', hubs: ['Mbarara City', 'Kamukuzi', 'Kakoba', 'Nyamitanga', 'Biharwe'] },
  { id: 'gulu', name: 'Gulu', region: 'Northern', hubs: ['Gulu City', 'Layibi', 'Pece', 'Laroo', 'Bardege'] },
  { id: 'masaka', name: 'Masaka', region: 'Central', hubs: ['Masaka City', 'Nyendo', 'Kimanya', 'Katwe', 'Kimaanya'] },
  { id: 'mbale', name: 'Mbale', region: 'Eastern', hubs: ['Mbale City', 'Industrial Area', 'Namakwekwe', 'Nkoma', 'Malukhu'] },
  { id: 'arua', name: 'Arua', region: 'Northern', hubs: ['Arua City', 'Ova', 'Awindiri', 'Dadamu', 'Pajulu'] },
  { id: 'lira', name: 'Lira', region: 'Northern', hubs: ['Lira City', 'Ojwina', 'Central Division', 'Adyel', 'Railway'] },
  { id: 'fort-portal', name: 'Fort Portal', region: 'Western', hubs: ['Tourism City', 'Kabarole', 'Kicwamba', 'Bazaar'] },
  { id: 'kabale', name: 'Kabale', region: 'Western', hubs: ['Kabale Municipality', 'Kigongi', 'Central', 'Bugongi'] },
  { id: 'soroti', name: 'Soroti', region: 'Eastern', hubs: ['Soroti City', 'Pioneer', 'Camp Swahili', 'Madera'] },
  { id: 'tororo', name: 'Tororo', region: 'Eastern', hubs: ['Tororo Town', 'Malaba Border', 'Osukuru'] },
  { id: 'kasese', name: 'Kasese', region: 'Western', hubs: ['Kasese Municipality', 'Hima', 'Bwera'] },
  { id: 'hoima', name: 'Hoima', region: 'Western', hubs: ['Oil City', 'Kahoora', 'Busiisi', 'Bujumbura'] },
  { id: 'mityana', name: 'Mityana', region: 'Central', hubs: ['Mityana Town', 'Busimbi', 'Ttamu'] },
  { id: 'luweero', name: 'Luweero', region: 'Central', hubs: ['Luweero Town', 'Wobulenzi', 'Bombo'] }
];

export const PROHIBITED_ITEMS = [
  'Illegal narcotics, prescription medicines without license, and controlled substances',
  'Firearms, ammunition, explosive devices, and prohibited military or police gear',
  'Stolen property, unverified counterfeit replicas, and pirated software/media',
  'Protected wildlife, ivory, game meat, and endangered timber species',
  'Forged academic transcripts, forged national IDs, and fraudulent documents',
  'Human organs, blood products, or unlicensed biological materials',
  'Multi-level marketing pyramid schemes or fraudulent loan offers'
];
