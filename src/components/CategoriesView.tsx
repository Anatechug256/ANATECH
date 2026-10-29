import React from 'react';
import { 
  Smartphone, Laptop, Car, Wheat, Building2, 
  Shirt, Armchair, Apple, Sparkles, BookOpen, 
  Wrench, Package, ShieldAlert, ChevronRight 
} from 'lucide-react';
import { CATEGORIES, PROHIBITED_ITEMS } from '../data/categoriesAndDistricts';
import { Category } from '../types';

interface CategoriesViewProps {
  onSelectCategory: (categoryId: string) => void;
  onOpenSafeTrading: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Smartphone,
  Laptop,
  Car,
  Wheat,
  Building2,
  Shirt,
  Armchair,
  Apple,
  Sparkles,
  BookOpen,
  Wrench,
  Package
};

const CATEGORY_THEMES: Record<string, { gradient: string; iconColor: string; borderHover: string; badge: string }> = {
  'phones-electronics': {
    gradient: 'from-cyan-500/10 via-sky-500/5 to-transparent dark:from-cyan-950/30',
    iconColor: 'text-cyan-500 bg-cyan-500/15 dark:bg-cyan-950/60',
    borderHover: 'hover:border-cyan-500/60 hover:shadow-cyan-500/10',
    badge: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300'
  },
  'computers-accessories': {
    gradient: 'from-indigo-500/10 via-blue-500/5 to-transparent dark:from-indigo-950/30',
    iconColor: 'text-indigo-500 bg-indigo-500/15 dark:bg-indigo-950/60',
    borderHover: 'hover:border-indigo-500/60 hover:shadow-indigo-500/10',
    badge: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
  },
  'vehicles-motorbikes': {
    gradient: 'from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-950/30',
    iconColor: 'text-amber-500 bg-amber-500/15 dark:bg-amber-950/60',
    borderHover: 'hover:border-amber-500/60 hover:shadow-amber-500/10',
    badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
  },
  'farm-produce-agriculture': {
    gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/30',
    iconColor: 'text-emerald-500 bg-emerald-500/15 dark:bg-emerald-950/60',
    borderHover: 'hover:border-emerald-500/60 hover:shadow-emerald-500/10',
    badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
  },
  'property-rentals': {
    gradient: 'from-teal-500/10 via-emerald-500/5 to-transparent dark:from-teal-950/30',
    iconColor: 'text-teal-500 bg-teal-500/15 dark:bg-teal-950/60',
    borderHover: 'hover:border-teal-500/60 hover:shadow-teal-500/10',
    badge: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
  },
  'clothing-shoes': {
    gradient: 'from-rose-500/10 via-pink-500/5 to-transparent dark:from-rose-950/30',
    iconColor: 'text-rose-500 bg-rose-500/15 dark:bg-rose-950/60',
    borderHover: 'hover:border-rose-500/60 hover:shadow-rose-500/10',
    badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
  },
  'furniture-household': {
    gradient: 'from-amber-600/10 via-yellow-500/5 to-transparent dark:from-amber-950/30',
    iconColor: 'text-amber-600 bg-amber-600/15 dark:bg-amber-950/60',
    borderHover: 'hover:border-amber-600/60 hover:shadow-amber-600/10',
    badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
  },
  'food-groceries': {
    gradient: 'from-yellow-500/10 via-lime-500/5 to-transparent dark:from-yellow-950/30',
    iconColor: 'text-yellow-600 bg-yellow-500/15 dark:bg-yellow-950/60',
    borderHover: 'hover:border-yellow-500/60 hover:shadow-yellow-500/10',
    badge: 'bg-yellow-50 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300'
  },
  'beauty-personal-care': {
    gradient: 'from-fuchsia-500/10 via-purple-500/5 to-transparent dark:from-fuchsia-950/30',
    iconColor: 'text-fuchsia-500 bg-fuchsia-500/15 dark:bg-fuchsia-950/60',
    borderHover: 'hover:border-fuchsia-500/60 hover:shadow-fuchsia-500/10',
    badge: 'bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300'
  },
  'books-education': {
    gradient: 'from-sky-500/10 via-indigo-500/5 to-transparent dark:from-sky-950/30',
    iconColor: 'text-sky-500 bg-sky-500/15 dark:bg-sky-950/60',
    borderHover: 'hover:border-sky-500/60 hover:shadow-sky-500/10',
    badge: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
  }
};

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  onSelectCategory,
  onOpenSafeTrading
}) => {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 space-y-6 pb-24 md:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Browse Categories</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              Uganda Market
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explore verified local goods, electronics, produce, and trade services across all Ugandan districts
          </p>
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {CATEGORIES.map(cat => {
          const IconComponent = ICON_MAP[cat.iconName] || Package;
          const theme = CATEGORY_THEMES[cat.id] || {
            gradient: 'from-slate-500/10 to-transparent',
            iconColor: 'text-cyan-500 bg-cyan-500/15',
            borderHover: 'hover:border-cyan-500/50',
            badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700'
          };

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`group bg-white dark:bg-slate-900 bg-gradient-to-br ${theme.gradient} border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 ${theme.borderHover} hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between market-card-glow`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-2xl ${theme.iconColor} flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                    {cat.name}
                  </h3>
                  {cat.lugandaName && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5">
                      {cat.lugandaName}
                    </span>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>

              {/* Subcategories preview */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                {cat.subcategories.slice(0, 3).map((sub, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60"
                  >
                    {sub}
                  </span>
                ))}
                {cat.subcategories.length > 3 && (
                  <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold px-1 self-center">
                    +{cat.subcategories.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Prohibited Items Policy Warning Box */}
      <section className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
          <h2 className="text-sm font-bold">Strict Listing Policy & Prohibited Items</h2>
        </div>
        <p className="text-xs text-rose-900/80 dark:text-rose-300/80 leading-relaxed">
          ANATECH UG cooperates with Ugandan law enforcement and regulatory bodies (UCC, UNBS, Uganda Police). The following items are strictly prohibited and subject to immediate account termination:
        </p>
        <ul className="text-xs text-rose-900/80 dark:text-rose-300/80 grid grid-cols-1 sm:grid-cols-2 gap-2 list-disc list-inside">
          {PROHIBITED_ITEMS.map((item, idx) => (
            <li key={idx} className="leading-snug">{item}</li>
          ))}
        </ul>
        <div className="pt-2">
          <button
            onClick={onOpenSafeTrading}
            className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:underline"
          >
            Read Complete Marketplace Compliance & Terms →
          </button>
        </div>
      </section>
    </div>
  );
};
