import { useEffect, useState } from "react";
import api from "../../api/axios";

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/reviews");
      setReviews(res.data.reviews || []);
    } catch {
      setError("Unable to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      setMessage("Review deleted successfully.");
      fetchReviews();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete review.");
    }
  };

  if (loading) return <p>Loading reviews...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reviews</h1>
      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>
      )}
      {message && (
        <p className="bg-green-100 text-green-700 text-sm p-2 rounded mb-4">{message}</p>
      )}
      {reviews.length === 0 && !error && (
        <p className="text-gray-600">No reviews found.</p>
      )}

      {reviews.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Menu Item</th>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Rating</th>
                <th className="text-left p-3">Comment</th>
                <th className="text-left p-3">Order</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review._id} className="border-t align-top">
                  <td className="p-3 font-medium">
                    {review.menuItem?.name || "—"}
                  </td>
                  <td className="p-3">
                    {review.user?.name || "—"}
                    <span className="block text-xs text-gray-500">
                      {review.user?.email || ""}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </td>
                  <td className="p-3 max-w-[280px] break-words">
                    {review.comment || "—"}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {review.order?.orderId || "—"}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDelete(review._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Reviews;
