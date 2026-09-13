// Shared one-line summaries of a customized cart/order entry.
// Works for cart entries (entry.customization) and order items
// (item.customization) — both share the same snapshot shape.
function CustomizationLines({ customization, compact = false }) {
  if (!customization) return null;
  const selections = customization.selections || [];
  const instructions = customization.specialInstructions || "";
  if (selections.length === 0 && !instructions) return null;

  return (
    <div className={compact ? "mt-0.5 space-y-0.5" : "mt-1.5 space-y-0.5"}>
      {selections.map((sel) => (
        <p
          key={sel.group}
          className="text-[13px] text-charcoal/60 leading-snug"
        >
          <span className="font-medium text-charcoal/75">{sel.group}:</span>{" "}
          {(sel.choices || []).map((c) => c.name).join(", ")}
        </p>
      ))}
      {instructions && (
        <p className="text-[13px] italic text-charcoal/55 leading-snug">
          “{instructions}”
        </p>
      )}
    </div>
  );
}

export default CustomizationLines;
