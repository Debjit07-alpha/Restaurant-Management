const MenuItem = require("../models/MenuItem");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");
const {
  parseStatus,
  resolveStatus
} = require("../utils/menuAvailability");

// =============================
// IMAGE HELPERS
// =============================

// multipart/form-data sends every field as a string, so "true"/"false"
// must be converted back to a Boolean. Plain JSON callers send real
// booleans, which pass through unchanged.
const parseAvailability = (value, fallback = true) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
};

// Accept customizationOptions from JSON callers or as a JSON string from
// multipart/form-data. Returns undefined when absent/invalid so the field
// stays unset; throws with a message on structurally invalid input.
const sanitizeCustomizationOptions = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      throw new Error("customizationOptions must be valid JSON");
    }
  }
  if (!Array.isArray(parsed)) {
    throw new Error("customizationOptions must be an array");
  }
  if (parsed.length > 10) {
    throw new Error("A maximum of 10 customization groups is allowed");
  }
  return parsed.map((group) => {
    if (!group || typeof group.name !== "string" || !group.name.trim()) {
      throw new Error("Each customization group needs a name");
    }
    const type = group.type === "multiple" ? "multiple" : "single";
    if (!Array.isArray(group.options) || group.options.length === 0) {
      throw new Error(`"${group.name}" needs at least one option`);
    }
    if (group.options.length > 20) {
      throw new Error(`"${group.name}" allows a maximum of 20 options`);
    }
    return {
      name: group.name.trim().slice(0, 60),
      type,
      required: group.required === true,
      options: group.options.map((opt) => {
        if (!opt || typeof opt.name !== "string" || !opt.name.trim()) {
          throw new Error(`"${group.name}" has an option without a name`);
        }
        const price = Number(opt.price) || 0;
        if (price < 0) {
          throw new Error(`"${opt.name}" has an invalid price`);
        }
        return { name: opt.name.trim().slice(0, 60), price };
      })
    };
  });
};

// Upload a Multer memory-storage buffer to Cloudinary.
const uploadBufferToCloudinary = (file) => {
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  return cloudinary.uploader.upload(dataUri, {
    folder: "tastybites/menu-items"
  });
};

// Extract the Cloudinary public_id from a secure URL so the old
// image can be deleted when it is replaced.
const getCloudinaryPublicId = (url) => {
  try {
    const marker = "/upload/";
    const index = url.indexOf(marker);
    if (index === -1) return null;
    // e.g. "v123/tastybites/menu-items/abc.jpg" -> "tastybites/menu-items/abc"
    const path = url.slice(index + marker.length).replace(/^v\d+\//, "");
    return path.replace(/\.[^.]+$/, "");
  } catch {
    return null;
  }
};

// =============================
// GET ALL MENU ITEMS
// =============================
const getMenuItems = async (req, res) => {
  try {
    // Customer listing: hidden items never appear here. Admins use the
    // dedicated admin endpoint below so hidden items stay manageable.
    const menuItems = await MenuItem.find({
      availabilityStatus: { $ne: "hidden" }
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      menuItems
    });
  } catch (error) {
    console.error("Get menu items error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching menu items"
    });
  }
};

// =============================
// GET ALL MENU ITEMS (Admin, includes hidden)
// =============================
const getAllMenuItemsAdmin = async (req, res) => {
  try {
    const menuItems = await MenuItem.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      menuItems
    });
  } catch (error) {
    console.error("Get menu items error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching menu items"
    });
  }
};

// =============================
// GET SINGLE MENU ITEM
// =============================
const getMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    res.status(200).json({
      success: true,
      menuItem
    });
  } catch (error) {
    console.error("Get menu item error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching menu item"
    });
  }
};

// =============================
// CREATE MENU ITEM
// =============================
const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      availability,
      availabilityStatus,
      image
    } = req.body;

    // Check required fields
    if (!name || !description || !category || price === undefined || price === "") {
      return res.status(400).json({
        success: false,
        message: "Name, description, category and price are required"
      });
    }

    // Three-state availability wins when supplied; otherwise the legacy
    // boolean maps to available/sold_out.
    let status = parseStatus(availabilityStatus);
    if (availabilityStatus !== undefined && status === null) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability status"
      });
    }
    if (status === null) {
      status = parseAvailability(availability, true)
        ? "available"
        : "sold_out";
    }

    let customizationOptions;
    try {
      customizationOptions = sanitizeCustomizationOptions(
        req.body.customizationOptions
      );
    } catch (sanitizeError) {
      return res.status(400).json({
        success: false,
        message: sanitizeError.message
      });
    }

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice)) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid number"
      });
    }

    // Image priority: newly uploaded file wins over an image URL string.
    // The image stays optional; without either, an empty string is saved.
    let imageUrl = typeof image === "string" ? image : "";

    if (req.file) {
      if (!isCloudinaryConfigured()) {
        return res.status(500).json({
          success: false,
          message: "Image upload is not configured on the server"
        });
      }

      try {
        const result = await uploadBufferToCloudinary(req.file);
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError.message);

        return res.status(500).json({
          success: false,
          message: "Failed to upload image"
        });
      }
    }

    const menuItem = await MenuItem.create({
      name,
      description,
      category,
      price: numericPrice,
      availability: status === "available",
      availabilityStatus: status,
      image: imageUrl || "",
      ...(customizationOptions !== undefined ? { customizationOptions } : {})
    });

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      menuItem
    });
  } catch (error) {
    console.error("Create menu item error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while creating menu item"
    });
  }
};

// =============================
// UPDATE MENU ITEM
// =============================
const updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    const {
      name,
      description,
      category,
      price,
      availability,
      availabilityStatus,
      image
    } = req.body;

    menuItem.name = name ?? menuItem.name;
    menuItem.description = description ?? menuItem.description;
    menuItem.category = category ?? menuItem.category;
    if (req.body.customizationOptions !== undefined) {
      let nextOptions;
      try {
        nextOptions = sanitizeCustomizationOptions(
          req.body.customizationOptions
        );
      } catch (sanitizeError) {
        return res.status(400).json({
          success: false,
          message: sanitizeError.message
        });
      }
      // Empty array (or empty value) clears customization; otherwise replace.
      menuItem.customizationOptions =
        !nextOptions || nextOptions.length === 0 ? undefined : nextOptions;
    }
    if (price !== undefined && price !== "") {
      const numericPrice = Number(price);
      if (Number.isNaN(numericPrice)) {
        return res.status(400).json({
          success: false,
          message: "Price must be a valid number"
        });
      }
      menuItem.price = numericPrice;
    }
    if (availabilityStatus !== undefined) {
      // Explicit three-state change (quick toggle or full edit form).
      const status = parseStatus(availabilityStatus);
      if (status === null) {
        return res.status(400).json({
          success: false,
          message: "Invalid availability status"
        });
      }
      menuItem.availabilityStatus = status;
      menuItem.availability = status === "available";
    } else if (availability !== undefined) {
      // Legacy boolean edit: maps to available/sold_out and never
      // silently unhides a hidden item.
      if (resolveStatus(menuItem) !== "hidden") {
        const available = parseAvailability(
          availability,
          menuItem.availability
        );
        menuItem.availabilityStatus = available ? "available" : "sold_out";
        menuItem.availability = available;
      }
    }

    if (req.file) {
      if (!isCloudinaryConfigured()) {
        return res.status(500).json({
          success: false,
          message: "Image upload is not configured on the server"
        });
      }

      try {
        const result = await uploadBufferToCloudinary(req.file);

        // Delete the previous Cloudinary image to avoid unused files.
        // Failures here must not break the update.
        if (menuItem.image && menuItem.image.includes("res.cloudinary.com")) {
          const publicId = getCloudinaryPublicId(menuItem.image);
          if (publicId) {
            try {
              await cloudinary.uploader.destroy(publicId);
            } catch (deleteError) {
              console.error(
                "Old Cloudinary image delete error:",
                deleteError.message
              );
            }
          }
        }

        menuItem.image = result.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError.message);

        return res.status(500).json({
          success: false,
          message: "Failed to upload image"
        });
      }
    } else if (image !== undefined) {
      // No new file: keep the existing image unless a URL value was sent.
      menuItem.image = image;
    }

    await menuItem.save();

    res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      menuItem
    });
  } catch (error) {
    console.error("Update menu item error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while updating menu item"
    });
  }
};

// =============================
// UPDATE AVAILABILITY (Admin quick toggle)
// PATCH /api/menu-items/:id/availability { availabilityStatus }
// =============================
const updateAvailability = async (req, res) => {
  try {
    const status = parseStatus(req.body.availabilityStatus);
    if (status === null) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability status"
      });
    }
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }
    menuItem.availabilityStatus = status;
    menuItem.availability = status === "available";
    await menuItem.save();
    res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      menuItem
    });
  } catch (error) {
    console.error("Update availability error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while updating availability"
    });
  }
};

// =============================
// DELETE MENU ITEM
// =============================
const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    await menuItem.deleteOne();

    res.status(200).json({
      success: true,
      message: "Menu item deleted successfully"
    });
  } catch (error) {
    console.error("Delete menu item error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while deleting menu item"
    });
  }
};

module.exports = {
  getMenuItems,
  getAllMenuItemsAdmin,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  updateAvailability,
  deleteMenuItem
};