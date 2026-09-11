import { CATEGORY_TABS } from "../../utils/categories";

const iconClass = "w-8 h-8";

const ICONS = {
  All: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  Pizza: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21l-7.5-13.5A1.5 1.5 0 015.9 5.2c2.9-1.3 6-2 9.1-1.4 1.5.3 2.6 1.1 3.4 2.3.4.7.3 1.5-.1 2.1L12 21zm0 0c.3-2 .3-4.5 0-7m-3.2-5.4a1 1 0 101.4 1.4m3.6.6a1 1 0 101.4 1.4M9.7 15l1-1m3.6-1.6l1-1" />
    </svg>
  ),
  Burgers: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10a7 7 0 0114 0H5zm-1 3.5h16M6.5 16.5h11a3 3 0 01-3 3h-5a3 3 0 01-3-3zM12 6.5c0-1 .8-1.2.8-2M9 7c0-1 .8-1.2.8-2M15 7c0-1 .8-1.2.8-2" />
    </svg>
  ),
  Indian: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 13h16a1 1 0 011 1.4l-1 2A5 5 0 0115.5 19h-7a5 5 0 01-4.5-2.6l-1-2A1 1 0 014 13zm4-2c0-1.2 1-1.6 2-2.2.9-.6 2-1.3 2-2.8m3 5c0-1.2 1-1.6 2-2.2.9-.6 2-1.3 2-2.8M9 19.5V21m6-1.5V21" />
    </svg>
  ),
  Chinese: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16v1.5A5.5 5.5 0 0114.5 19h-5A5.5 5.5 0 014 13.5V12zm0 0c1-2.5 3-4 5-4.5m4 .5l5-3m-2 5l4-2" />
    </svg>
  ),
  Desserts: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 13h12l-1.2 5.2a2 2 0 01-2 1.6H9.2a2 2 0 01-2-1.6L6 13zm0 0a2.5 2.5 0 01-1-2C5 9.5 6.5 9 8 9c1 0 1.5.5 2 1 .5-1.5 2-2.5 4-2.5s3.5 1 4 2.5c.5-.5 1-1 2-1 1.5 0 3 .5 3 2a2.5 2.5 0 01-1 2M12 9V7m0 0c-1 0-1.5-.8-1.5-1.5M12 7c1 0 1.5-.8 1.5-1.5" />
    </svg>
  ),
  Drinks: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10l-1.2 15.2a2 2 0 01-2 1.8H10.2a2 2 0 01-2-1.8L7 4zm0 0h10M15.5 8.5l4-1M9 12h6" />
    </svg>
  ),
  Healthy: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.5-2.5-7-6-7-11 4.5 0 8 1.5 10.5 4C18 11.5 19.5 9 20 6c-1 5-3.5 11-8 15zm0 0c0-4 1-7 3-9M7 21h10" />
    </svg>
  ),
};

function CategoryFilter({ active, onChange }) {
  return (
    <div className="flex gap-5 sm:gap-8 overflow-x-auto no-scrollbar py-2 -mx-6 px-6 lg:mx-0 lg:px-0 lg:justify-center">
      {CATEGORY_TABS.map((tab) => {
        const selected = active === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className="shrink-0 flex flex-col items-center gap-2.5 group"
          >
            <span
              className={`w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-full flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 ${
                selected
                  ? "bg-burgundy text-white shadow-[0_14px_28px_-12px_rgba(217,45,32,0.7)]"
                  : "bg-white text-charcoal/70 border border-charcoal/10 shadow-sm group-hover:border-burgundy group-hover:text-burgundy"
              }`}
            >
              {ICONS[tab.value]}
            </span>
            <span
              className={`text-[14px] whitespace-nowrap transition-colors ${
                selected ? "font-bold text-charcoal" : "font-medium text-charcoal/60"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default CategoryFilter;
