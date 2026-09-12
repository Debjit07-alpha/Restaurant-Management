import { CATEGORY_TABS } from "../../utils/categories";

function FoodIcon({ value }) {
  const cls = "w-11 h-11";
  switch (value) {
    case "Pizza":
      return (
        <svg className={cls} viewBox="0 0 32 32">
          <path d="M6 5 L16 27 L26 5 Q16 2 6 5 Z" fill="#F5B942" />
          <path d="M6 5 Q16 2 26 5 L25 8 Q16 5.5 7 8 Z" fill="#E8930C" />
          <circle cx="14" cy="12" r="2.2" fill="#D92D20" />
          <circle cx="19" cy="16" r="2.2" fill="#D92D20" />
          <circle cx="15" cy="20" r="2.2" fill="#D92D20" />
        </svg>
      );
    case "Burgers":
      return (
        <svg className={cls} viewBox="0 0 32 32">
          <path d="M5 14 Q5 7 16 7 Q27 7 27 14 Z" fill="#E8A94F" />
          <path d="M4 15 Q8 13 12 15 Q16 17 20 15 Q24 13 28 15 L28 17 L4 17 Z" fill="#5FA860" />
          <path d="M5 18 H27 V20 H5 Z" fill="#F5C93F" />
          <path d="M6 21 H26 V22.5 Q26 25 23 25 H9 Q6 25 6 22.5 Z" fill="#8A5A33" />
          <path d="M7 26 H25 V27 Q25 28.5 23 28.5 H9 Q7 28.5 7 27 Z" fill="#E8A94F" />
        </svg>
      );
    case "Indian":
      return (
        <svg className={cls} viewBox="0 0 32 32">
          <path d="M5 16 H27 L25 25 Q24.5 28 21 28 H11 Q7.5 28 7 25 Z" fill="#C96F2E" />
          <ellipse cx="16" cy="16" rx="11" ry="3.2" fill="#E8930C" />
          <ellipse cx="16" cy="15.4" rx="8" ry="2" fill="#F5B942" />
          <circle cx="12" cy="15" r="1" fill="#5FA860" />
          <circle cx="19" cy="15.6" r="1" fill="#5FA860" />
          <circle cx="16" cy="14.6" r="1" fill="#D92D20" />
          <path d="M11 9 Q12 6 11 4 M16 9 Q17 6 16 4 M21 9 Q22 6 21 4" stroke="#B9B0A4" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "Chinese":
      return (
        <svg className={cls} viewBox="0 0 32 32">
          <path d="M5 17 H27 L25 25 Q24.5 28 21 28 H11 Q7.5 28 7 25 Z" fill="#D92D20" />
          <ellipse cx="16" cy="17" rx="11" ry="3.2" fill="#A82318" />
          <path d="M8 16 Q12 13 16 16 Q20 19 24 16" stroke="#F5D67B" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M9 17.5 Q13 15 17 17.5 Q21 20 25 17" stroke="#F5D67B" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.8" />
          <path d="M20 4 L27 12 M23 3 L30 11" stroke="#8A5A33" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "Desserts":
      return (
        <svg className={cls} viewBox="0 0 32 32">
          <path d="M10 15 H22 L20.5 27 Q20.3 29 18 29 H14 Q11.7 29 11.5 27 Z" fill="#E86A92" />
          <path d="M10 15 Q10 9 16 9 Q22 9 22 15 Z" fill="#F49AC1" />
          <circle cx="16" cy="7" r="2" fill="#D92D20" />
          <path d="M13 20 H19 M13.5 23 H18.5" stroke="#C4507A" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "Drinks":
      return (
        <svg className={cls} viewBox="0 0 32 32">
          <path d="M10 9 H22 L20.5 27 Q20.3 29 18 29 H14 Q11.7 29 11.5 27 Z" fill="#3E9BE0" />
          <path d="M10 9 H22 L21.6 13 H10.4 Z" fill="#7CC0F2" />
          <circle cx="14" cy="20" r="1.3" fill="#BFE3FA" />
          <circle cx="18" cy="23" r="1.3" fill="#BFE3FA" />
          <circle cx="15.5" cy="24.5" r="1" fill="#BFE3FA" />
          <path d="M19 9 L23 3" stroke="#D92D20" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "Healthy":
      return (
        <svg className={cls} viewBox="0 0 32 32">
          <path d="M16 28 C9 24 6 17 7 8 C14 9 20 13 22 19 C23 15 23 10 22 5 C28 10 29 19 24 25 C22 27 19 28 16 28 Z" fill="#5FA860" />
          <path d="M10 25 C13 19 17 15 23 12" stroke="#3E7D44" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </svg>
      );
    default:
      return null;
  }
}

function CategoryFilter({ active, onChange }) {
  return (
    <div className="max-w-[1520px] mx-auto px-6 lg:px-12">
        <div className="flex gap-6 sm:gap-9 overflow-x-auto no-scrollbar py-6 -mx-6 px-6 lg:mx-0 lg:px-0 lg:justify-center">
          {CATEGORY_TABS.map((tab) => {
            const selected = active === tab.value;
            const isAll = tab.value === "All";
            return (
              <button
                key={tab.value}
                onClick={() => onChange(tab.value)}
                className="shrink-0 flex flex-col items-center gap-2.5 group"
              >
                <span
                  className={`w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-300 group-hover:-translate-y-1 ${
                    selected
                      ? "bg-burgundy text-white shadow-[0_14px_28px_-12px_rgba(217,45,32,0.7)]"
                      : "bg-cream text-charcoal/70 border border-charcoal/10 shadow-sm group-hover:border-burgundy"
                  }`}
                >
                  {isAll ? (
                    <>
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                      </svg>
                      <span className="text-[13px] font-bold leading-none">All</span>
                    </>
                  ) : (
                    <FoodIcon value={tab.value} />
                  )}
                </span>
                {!isAll && (
                  <span className="text-[14px] font-bold text-charcoal whitespace-nowrap">
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
    </div>
  );
}

export default CategoryFilter;
