// src/section/TestimonialSection.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaStar,
  FaRegStar,
  FaFacebookF,
  FaGoogle,
  FaUserCircle,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext"; // make sure this exists in your project

const SAMPLE = [
  {
    _id: "1",
    user: { name: "Saket Patel", avatarUrl: null },
    rating: 5,
    text: "I am so happy to find affordable, efficient and super friendly support. Highly recommended!",
    source: "facebook",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "2",
    user: { name: "H R", avatarUrl: null },
    rating: 4,
    text: "Amazing service and fast delivery. The product quality is top notch.",
    source: "google",
    createdAt: new Date().toISOString(),
  },
];

export default function TestimonialSection({ reviews: reviewsProp = null, onSubmitReview = null }) {
  const navigate = useNavigate();
  const { user } = useAuth(); // must provide { user } from your AuthContext
  const isAuthenticated = Boolean(user);

  const [reviews, setReviews] = useState(reviewsProp || SAMPLE);
  useEffect(() => {
    if (reviewsProp) setReviews(reviewsProp);
  }, [reviewsProp]);

  const [activeFilter, setActiveFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    if (!reviews) return [];
    if (activeFilter === "all") return reviews;
    if (activeFilter === "facebook") return reviews.filter((r) => r.source === "facebook");
    if (activeFilter === "google") return reviews.filter((r) => r.source === "google");
    if (activeFilter === "4up") return reviews.filter((r) => Number(r.rating) >= 4);
    return reviews;
  }, [reviews, activeFilter]);

  const overallRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    return reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length;
  }, [reviews]);

  const openWrite = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setRating(null);
    setHoverRating(0);
    setComment("");
    setError("");
    setShowModal(true);
  };

  async function submitReview(e) {
    e.preventDefault();
    setError("");
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!comment.trim()) {
      setError("Please write something about your experience.");
      return;
    }
    if (!rating || rating < 1) {
      setError("Please provide a rating.");
      return;
    }

    setSubmitting(true);

    const payload = {
      user: {
        name: user.name || user.email || "Anonymous",
        avatarUrl: user.avatarUrl || null,
      },
      rating,
      text: comment.trim(),
      source: "website",
      createdAt: new Date().toISOString(),
    };

    try {
      let created;
      if (typeof onSubmitReview === "function") {
        created = await onSubmitReview(payload);
      } else {
        created = { ...payload, _id: `local-${Date.now()}` };
      }

      setReviews((prev) => [created, ...prev]);
      setShowModal(false);
      setComment("");
      setRating(5);
    } catch (err) {
      console.error("submit review error", err);
      setError("Could not submit review. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-md mt-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center ">
          <div>
            <h3 className="text-lg md:text-xl font-semibold">What our customers say</h3>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 font-semibold">{overallRating ? overallRating.toFixed(1) : "0.0"}</span>
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) =>
                    i < Math.round(overallRating || 0) ? (
                      <FaStar key={i} className="text-yellow-400 w-4 h-4" />
                    ) : (
                      <FaRegStar key={i} className="text-gray-300 w-4 h-4" />
                    )
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-500">{reviews ? reviews.length : 0} reviews</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex bg-gray-50 border rounded-full overflow-hidden text-sm">
            <button onClick={() => setActiveFilter("all")} className={`px-3 py-2 ${activeFilter === "all" ? "bg-blue-600 text-white" : "text-gray-600"}`}>All reviews</button>
            <button onClick={() => setActiveFilter("facebook")} className={`px-3 py-2 ${activeFilter === "facebook" ? "bg-blue-600 text-white" : "text-gray-600"}`}>Facebook</button>
            <button onClick={() => setActiveFilter("google")} className={`px-3 py-2 ${activeFilter === "google" ? "bg-blue-600 text-white" : "text-gray-600"}`}>Google</button>
            <button onClick={() => setActiveFilter("4up")} className={`px-3 py-2 ${activeFilter === "4up" ? "bg-blue-600 text-white" : "text-gray-600"}`}>4★ & up</button>
          </div>

          <button onClick={openWrite} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm shadow-sm hover:bg-blue-700">Write a review</button>
        </div>
      </div>

      {/* Responsive filters for mobile */}
      <div className="flex sm:hidden gap-2 mb-4 overflow-auto">
        <button onClick={() => setActiveFilter("all")} className={`px-3 py-2 rounded-md text-sm ${activeFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>All</button>
        <button onClick={() => setActiveFilter("facebook")} className={`px-3 py-2 rounded-md text-sm ${activeFilter === "facebook" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>Facebook</button>
        <button onClick={() => setActiveFilter("google")} className={`px-3 py-2 rounded-md text-sm ${activeFilter === "google" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>Google</button>
        <button onClick={() => setActiveFilter("4up")} className={`px-3 py-2 rounded-md text-sm ${activeFilter === "4up" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>4★+</button>
      </div>

      {/* --- HORIZONTAL SCROLLABLE REVIEWS --- */}
      <div
        role="list"
        aria-label="Customer reviews"
        className="flex gap-4 overflow-x-auto py-2 pb-6 -mx-2 px-2 hide-scrollbar "
      >
        {filtered.length === 0 ? (
          <div className="min-w-[260px] flex-shrink-0 snap-start text-center text-gray-500 py-8">No reviews found</div>
        ) : (
          filtered.map((r) => (
            <article
              key={r._id}
              role="listitem"
              className="min-w-[260px] max-w-xs flex-shrink-0 snap-start bg-white border border-gray-100 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {r.user?.avatarUrl ? (
                    <img src={r.user.avatarUrl} alt={r.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <FaUserCircle className="text-gray-400 w-8 h-8" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{r.user?.name || "Anonymous"}</div>
                      <div className="text-xs text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) =>
                          i < (Number(r.rating) || 0) ? (
                            <FaStar key={i} className="text-yellow-400 w-3.5 h-3.5" />
                          ) : (
                            <FaRegStar key={i} className="text-gray-200 w-3.5 h-3.5" />
                          )
                        )}
                      </div>

                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        {r.source === "facebook" && <FaFacebookF className="w-3 h-3 text-blue-600" />}
                        {r.source === "google" && <FaGoogle className="w-3 h-3 text-red-500" />}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-gray-700 text-sm">{r.text}</p>

                  <div className="mt-3 flex items-center gap-3">
                    <button className="text-xs text-blue-600 font-medium">Helpful</button>
                    <button className="text-xs text-gray-500">Report</button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Inline Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowModal(false)} />
          <form onSubmit={submitReview} className="relative bg-white rounded-lg p-6 w-full max-w-lg z-10 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">Write a review</h4>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>

            <div className="mb-3">
              <label className="block text-sm mb-2">Your rating</label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const idx = i + 1;
                  const active = (hoverRating && idx <= hoverRating) || (!hoverRating && rating && idx <= rating);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onMouseEnter={() => setHoverRating(idx)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(idx)}
                      className="p-1"
                      aria-label={`Rate ${idx} stars`}
                    >
                      {active ? (
                        <FaStar className="w-6 h-6 text-yellow-400" />
                      ) : (
                        <FaRegStar className="w-6 h-6 text-gray-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm mb-2">Your review</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full border rounded-md p-2 text-sm"
                placeholder="Share your experience..."
                required
              />
            </div>

            {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-3 py-2 border rounded-md text-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm shadow-sm hover:bg-blue-700">
                {submitting ? "Submitting..." : "Submit review"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
