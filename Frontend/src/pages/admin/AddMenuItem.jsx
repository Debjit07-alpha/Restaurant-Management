import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import CustomizationEditor from "./CustomizationEditor";

const CATEGORIES = ["Starter", "Main Course", "Dessert", "Beverage"];
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (matches backend limit)

function AddMenuItem() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Starter",
    price: "",
    availability: "inStock",
    foodType: "",
    image: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [customizations, setCustomizations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Local preview of the selected file (cleaned up to avoid memory leaks)
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only image files are allowed (jpg, jpeg, png, webp).");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image file is too large. Maximum size is 5MB.");
      return;
    }

    setError("");
    setImageFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // FormData lets the browser set multipart/form-data with the
      // correct boundary automatically. The Admin JWT is attached
      // by the Axios interceptor.
      const data = new FormData();
      data.append("name", form.name);
      data.append("description", form.description);
      data.append("category", form.category);
      data.append("price", form.price);
      data.append(
        "availability",
        form.availability === "inStock" ? "true" : "false"
      );
      if (form.foodType) {
        data.append("foodType", form.foodType);
      }
      if (imageFile) {
        // A newly uploaded file takes priority over the image URL.
        data.append("image", imageFile);
      } else {
        data.append("image", form.image.trim());
      }
      if (customizations.length > 0) {
        data.append("customizationOptions", JSON.stringify(customizations));
      }

      await api.post("/menu-items", data);
      navigate("/admin/menu-items");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add menu item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Add Menu Item</h1>
      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Item Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows="3"
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-3 py-2"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Price</label>
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Availability</label>
          <select
            name="availability"
            value={form.availability}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-3 py-2"
          >
            <option value="inStock">In Stock</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">
            Food Type{" "}
            <span className="font-normal text-gray-500">(for veg/non-veg filters)</span>
          </label>
          <select
            name="foodType"
            value={form.foodType}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-3 py-2"
          >
            <option value="">Unspecified</option>
            <option value="veg">Vegetarian</option>
            <option value="non_veg">Non-Vegetarian</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Item Image</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="mt-1 w-full border rounded px-3 py-2"
          />
          {imageFile && (
            <p className="text-xs text-gray-600 mt-1">
              Selected: {imageFile.name}
            </p>
          )}
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Selected preview"
              className="mt-2 h-40 w-full object-cover rounded border"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">OR Image URL</label>
          <input
            type="url"
            name="image"
            value={form.image}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            className="mt-1 w-full border rounded px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload a file or paste an image URL. If both are provided, the
            uploaded file is used. Leave both empty to save without an image.
          </p>
        </div>

        <CustomizationEditor value={customizations} onChange={setCustomizations} />

        <button
          type="submit"
          disabled={loading}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Menu Item"}
        </button>
      </form>
    </div>
  );
}

export default AddMenuItem;
