import { useState } from "react";

// Reusable editor for a menu item's customizationOptions, embedded in the
// existing Add/Edit Menu Item admin pages (no separate admin system).
// Groups: { name, type: "single"|"multiple", required, options: [{name, price}] }
function CustomizationEditor({ value, onChange }) {
  const groups = Array.isArray(value) ? value : [];
  const [newGroupName, setNewGroupName] = useState("");

  const updateGroup = (index, patch) => {
    onChange(groups.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  };

  const removeGroup = (index) => {
    onChange(groups.filter((_, i) => i !== index));
  };

  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    onChange([
      ...groups,
      { name, type: "single", required: false, options: [] },
    ]);
    setNewGroupName("");
  };

  const updateOption = (gi, oi, patch) => {
    updateGroup(gi, {
      options: groups[gi].options.map((o, i) =>
        i === oi ? { ...o, ...patch } : o
      ),
    });
  };

  const removeOption = (gi, oi) => {
    updateGroup(gi, {
      options: groups[gi].options.filter((_, i) => i !== oi),
    });
  };

  const addOption = (gi) => {
    updateGroup(gi, {
      options: [...(groups[gi].options || []), { name: "", price: 0 }],
    });
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      <p className="block text-sm font-medium">
        Customization Groups{" "}
        <span className="font-normal text-gray-500">
          (optional — leave empty for one-click Add to Cart)
        </span>
      </p>

      <div className="mt-2 space-y-3">
        {groups.map((group, gi) => (
          <div key={gi} className="border rounded px-3 py-3 bg-gray-50">
            <div className="grid sm:grid-cols-[1fr_150px_auto] gap-2 items-center">
              <input
                type="text"
                value={group.name}
                onChange={(e) => updateGroup(gi, { name: e.target.value })}
                placeholder="Group name (e.g. Size)"
                maxLength={60}
                className="border rounded px-3 py-2 bg-white"
              />
              <select
                value={group.type === "multiple" ? "multiple" : "single"}
                onChange={(e) => updateGroup(gi, { type: e.target.value })}
                className="border rounded px-3 py-2 bg-white"
                aria-label="Group type"
              >
                <option value="single">Single Choice</option>
                <option value="multiple">Multiple Choice</option>
              </select>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={group.required === true}
                    onChange={(e) =>
                      updateGroup(gi, { required: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  Required
                </label>
                <button
                  type="button"
                  onClick={() => removeGroup(gi)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete group
                </button>
              </div>
            </div>

            <div className="mt-2 space-y-1.5">
              {(group.options || []).map((opt, oi) => (
                <div key={oi} className="grid grid-cols-[1fr_110px_auto] gap-2 items-center">
                  <input
                    type="text"
                    value={opt.name}
                    onChange={(e) =>
                      updateOption(gi, oi, { name: e.target.value })
                    }
                    placeholder="Option name"
                    maxLength={60}
                    className="border rounded px-3 py-1.5 bg-white text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={opt.price ?? 0}
                    onChange={(e) =>
                      updateOption(gi, oi, { price: e.target.value })
                    }
                    placeholder="₹"
                    aria-label="Option price"
                    className="border rounded px-3 py-1.5 bg-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(gi, oi)}
                    className="text-sm text-red-600 hover:underline whitespace-nowrap"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(gi)}
                className="text-sm text-orange-700 font-medium hover:underline"
              >
                + Add option
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="New group name (e.g. Crust)"
          maxLength={60}
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          type="button"
          onClick={addGroup}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 text-sm whitespace-nowrap"
        >
          + Add Group
        </button>
      </div>
    </div>
  );
}

export default CustomizationEditor;
