const User = require("../models/User");
const MenuItem = require("../models/MenuItem");
const mongoose = require("mongoose");

// =====================================
// GET ALL USERS
// =====================================
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error("Get users error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching users"
    });
  }
};

// =====================================
// DELETE USER
// =====================================
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Delete user error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while deleting user"
    });
  }
};

// =====================================
// GET MY FAVORITES (authenticated user)
// =====================================
// Returns populated menu items. Deleted menu items resolve to null
// after populate and are filtered out so the page never crashes.
const getMyFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate("favorites");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const favorites = (user.favorites || []).filter(Boolean);

    res.status(200).json({
      success: true,
      count: favorites.length,
      favorites
    });
  } catch (error) {
    console.error("Get favorites error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching favorites"
    });
  }
};

// Helper: load a menu item or send 404. Returns the item or null.
const findMenuItemOr404 = async (res, menuItemId) => {
  let menuItem = null;
  try {
    menuItem = await MenuItem.findById(menuItemId);
  } catch {
    menuItem = null;
  }

  if (!menuItem) {
    res.status(404).json({
      success: false,
      message: "Menu item not found"
    });
    return null;
  }

  return menuItem;
};

const favoriteIds = (user) =>
  (user.favorites || []).map((fav) => fav.toString());

// =====================================
// ADD MY FAVORITE (authenticated user)
// =====================================
const addMyFavorite = async (req, res) => {
  try {
    const { menuItem } = req.body;

    if (!menuItem) {
      return res.status(400).json({
        success: false,
        message: "A menu item id is required"
      });
    }

    const existing = await findMenuItemOr404(res, menuItem);
    if (!existing) return;

    // $addToSet prevents duplicates at the database level.
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $addToSet: { favorites: existing._id } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Added to favorites",
      favorited: true,
      favorites: favoriteIds(user)
    });
  } catch (error) {
    console.error("Add favorite error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while adding favorite"
    });
  }
};

// =====================================
// REMOVE MY FAVORITE (authenticated user)
// =====================================
const removeMyFavorite = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.menuItemId)) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $pull: { favorites: req.params.menuItemId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Removed from favorites",
      favorited: false,
      favorites: favoriteIds(user)
    });
  } catch (error) {
    console.error("Remove favorite error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while removing favorite"
    });
  }
};

// =====================================
// TOGGLE MY FAVORITE (authenticated user)
// =====================================
const toggleMyFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const alreadyFavorite = favoriteIds(user).includes(
      String(req.params.menuItemId)
    );

    if (alreadyFavorite) {
      await User.updateOne(
        { _id: req.user.userId },
        { $pull: { favorites: req.params.menuItemId } }
      );

      const updated = await User.findById(req.user.userId);
      return res.status(200).json({
        success: true,
        message: "Removed from favorites",
        favorited: false,
        favorites: favoriteIds(updated)
      });
    }

    const existing = await findMenuItemOr404(res, req.params.menuItemId);
    if (!existing) return;

    await User.updateOne(
      { _id: req.user.userId },
      { $addToSet: { favorites: existing._id } }
    );

    const updated = await User.findById(req.user.userId);
    return res.status(200).json({
      success: true,
      message: "Added to favorites",
      favorited: true,
      favorites: favoriteIds(updated)
    });
  } catch (error) {
    console.error("Toggle favorite error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while updating favorite"
    });
  }
};

module.exports = {
  getUsers,
  deleteUser,
  getMyFavorites,
  addMyFavorite,
  removeMyFavorite,
  toggleMyFavorite
};