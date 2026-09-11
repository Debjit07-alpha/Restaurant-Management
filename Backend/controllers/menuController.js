const MenuItem = require("../models/MenuItem");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

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
      image
    } = req.body;

    // Check required fields
    if (!name || !description || !category || price === undefined || price === "") {
      return res.status(400).json({
        success: false,
        message: "Name, description, category and price are required"
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
      availability: parseAvailability(availability, true),
      image: imageUrl || ""
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
      image
    } = req.body;

    menuItem.name = name ?? menuItem.name;
    menuItem.description = description ?? menuItem.description;
    menuItem.category = category ?? menuItem.category;
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
    if (availability !== undefined) {
      menuItem.availability = parseAvailability(
        availability,
        menuItem.availability
      );
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
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};