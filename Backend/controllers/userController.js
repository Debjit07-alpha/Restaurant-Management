const User = require("../models/User");

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

module.exports = {
  getUsers,
  deleteUser
};