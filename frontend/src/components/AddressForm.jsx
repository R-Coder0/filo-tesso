import React, { useState, useEffect } from "react";

const AddressForm = ({ onSave, onClose, initialData }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address)
      return alert("Please fill all required fields");
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
        >
          ✕
        </button>
        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Edit Address" : "Add New Address"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { label: "Full Name", name: "fullName" },
            { label: "Phone Number", name: "phone", type: "tel" },
            { label: "Address", name: "address" },
            { label: "City", name: "city" },
            { label: "State", name: "state" },
            { label: "Pincode", name: "pincode" },
            { label: "Country", name: "country" },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm text-gray-700 mb-1">
                {f.label}
              </label>
              <input
                type={f.type || "text"}
                name={f.name}
                value={formData[f.name]}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          ))}
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Save Address
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddressForm;
