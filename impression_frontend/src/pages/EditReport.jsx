import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import BASE_URL from "./config";

const availableFields = [
  "Sales Person",
  "Duration",
  "Products",
  "City",
  "Client",
  "Voucher",
  "Voucher Type",
];

const allFilterKeys = [
  "duration",
  "durationPeriod",
  "salesPerson",
  "city",
  "product",
  "viewType",
  "client",
  "vouchernumber",
  "vouchertype",
];

const fieldKeyMap = {
  "Sales Person": "salesPerson",
  Duration: "duration",
  Products: "product",
  City: "city",
  Client: "client",
  Voucher: "vouchernumber",
  "Voucher Type": "vouchertype",
};

const NO_DROPDOWN_KEYS = ["duration", "durationPeriod", "viewType"];

export default function EditReport() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    row_header: "",
    column_header: "",
    filters: allFilterKeys.reduce((a, k) => ({ ...a, [k]: false }), {}),
    filter_values: {
      city: [],
      product: [],
      salesPerson: [],
      client: [],
      vouchernumber: [],
      vouchertype: [],
      duration: "",
      durationPeriod: "",
      viewType: "",
      row: [],
      column: [],
    },
  });

  const [filterOptions, setFilterOptions] = useState({
    city: [],
    product: [],
    salesPerson: [],
    client: [],
    vouchernumber: [],
    vouchertype: [],
    duration: [],
    durationPeriod: ["daily", "weekly", "monthly", "yearly", "all"],
  });

useEffect(() => {
  // Step 1: Fetch report first
  axios.get(`${BASE_URL}/api/reports/${id}/`).then((res) => {
    const fetched = res.data;

    const fetchedFilterValues = {
      city: [],
      product: [],
      salesPerson: [],
      client: [],
      vouchernumber: [],
      vouchertype: [],
      duration: "",
      durationPeriod: "",
      viewType: "",
      ...fetched.filter_values,
      row: fetched.row_values || [],
      column: fetched.column_values || [],
    };

    const activeFilters = {};
    allFilterKeys.forEach((key) => {
      activeFilters[key] = fetched.filters?.[key] ?? false;
    });

    setForm({
      name: fetched.name || "",
      row_header: fetched.row_header || "",
      column_header: fetched.column_header || "",
      filters: activeFilters,
      filter_values: fetchedFilterValues,
    });

    // Step 2: Then fetch dropdown filter options
    axios.get(`${BASE_URL}/api/filters/`).then((resp) => {
      const data = resp.data;

      // Merge saved filter values to avoid missing options
      const mergeOptions = (savedValues, fetchedOptions) => {
        const set = new Set(fetchedOptions);
        (savedValues || []).forEach((val) => set.add(val));
        return Array.from(set);
      };

      setFilterOptions({
        city: mergeOptions(fetchedFilterValues.city, data.cities || []),
        product: mergeOptions(fetchedFilterValues.product, data.products || []),
        salesPerson: mergeOptions(fetchedFilterValues.salesPerson, data.salesPersons || []),
        client: mergeOptions(fetchedFilterValues.client, data.clients || []),
        vouchernumber: mergeOptions(fetchedFilterValues.vouchernumber, data.vouchernumber || data.vouchers || []),
        vouchertype: mergeOptions(fetchedFilterValues.vouchertype, data.vouchertype || data.voucherTypes || []),
        duration: mergeOptions(fetchedFilterValues.duration, data.durations || []),
        durationPeriod: ["daily", "weekly", "monthly", "yearly", "all"],
      });
    });
  });
}, [id]);


  const toggleFilter = (key) =>
    setForm((prev) => ({
      ...prev,
      filters: { ...prev.filters, [key]: !prev.filters[key] },
    }));

  const handleInputChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  
const handleMultiChange = (key, selected) => {
  const values = (selected || []).map((o) => o.value);
  const isAllSelected = values.includes("__all__");
  const finalValues = isAllSelected ? [...filterOptions[key]] : values;

  setForm((prev) => ({
    ...prev,
    filter_values: {
      ...prev.filter_values,
      [key]: finalValues,
    },
  }));
};


 const renderDropdown = (headerLabel, typeKey) => {
  const key = fieldKeyMap[headerLabel];
  const opts = filterOptions[key] || [];
  const cur = form.filter_values[typeKey] || [];

  const options = [
    { label: "All", value: "__all__" },
    ...opts.map((val) => ({ label: val, value: val })),
  ];

  const selectedOptions =
    cur.length === opts.length
      ? [{ label: "All", value: "__all__" }]
      : opts
          .filter((val) => cur.includes(val))
          .map((val) => ({ label: val, value: val }));

  return (
    <div className="mt-2">
      <Select
        isMulti
        options={options}
        value={selectedOptions}
        onChange={(sel) => {
          const vals = (sel || []).map((o) => o.value);
          handleMultiChange(typeKey, sel);
        }}
        classNamePrefix="react-select"
        placeholder="Select..."
      />
    </div>
  );
};


  const handleSave = () => {
    if (!form.name.trim()) {
      alert("Enter report name");
      return;
    }
    const activeFilters = Object.fromEntries(
      Object.entries(form.filters).filter(([_, v]) => v)
    );
    const payload = {
      name: form.name.trim(),
      row_header: form.row_header,
      column_header: form.column_header,
      filters: activeFilters,
      filter_values: Object.fromEntries(
        Object.entries(form.filter_values).filter(([k]) =>
          form.filters[k]
        )
      ),
      row_values: form.filter_values.row.map((v) => v.trim()),
      column_values: form.filter_values.column.map((v) => v.trim()),
      duration:
        form.filters.duration && form.filter_values.duration
          ? form.filter_values.duration
          : "",
      durationPeriod:
        form.filters.durationPeriod && form.filter_values.durationPeriod
          ? form.filter_values.durationPeriod
          : "",
    };

    axios
      .put(`${BASE_URL}/api/reports/${id}/`, payload)
      .then(() => navigate("/report-settings"))
      .catch((e) => console.error("Update failed", e));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-6 rounded shadow border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">
          ✏️ Edit Report
        </h2>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-blue-700 font-semibold mb-1">
              Report Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded w-full bg-gray-50"
              placeholder="Enter report name"
            />
          </div>

          {/* Row/Column header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-blue-700 font-semibold mb-1">
                Row Header
              </label>
              <select
                name="row_header"
                value={form.row_header}
                className="border border-gray-300 p-2 rounded w-full bg-gray-50"
                onChange={handleInputChange}
              >
                <option value="">Select</option>
                {availableFields.map((f) => (
                  <option
                    key={f}
                    value={f}
                    disabled={form.column_header === f}
                  >
                    {f}
                  </option>
                ))}
              </select>
              {form.row_header &&
                renderDropdown(form.row_header, "row")}
            </div>
            <div>
              <label className="block text-blue-700 font-semibold mb-1">
                Column Header
              </label>
              <select
                name="column_header"
                value={form.column_header}
                className="border border-gray-300 p-2 rounded w-full bg-gray-50"
                onChange={handleInputChange}
              >
                <option value="">Select</option>
                {availableFields.map((f) => (
                  <option
                    key={f}
                    value={f}
                    disabled={form.row_header === f}
                  >
                    {f}
                  </option>
                ))}
              </select>
              {form.column_header &&
                renderDropdown(form.column_header, "column")}
            </div>
          </div>

          {/* Filters */}
          <div>
            <label className="block text-blue-700 font-semibold mb-2">
              Apply Filters
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {allFilterKeys.map((key) => (
                <div
                  key={key}
                  className="bg-blue-50 p-2 rounded"
                >
                  <label className="flex items-center mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.filters[key]}
                      onChange={() => toggleFilter(key)}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {key === "viewType"
                        ? "Currency / Quantity"
                        : key === "durationPeriod"
                        ? "Duration Period"
                        : key
                      }
                    </span>
                  </label>

                  {!NO_DROPDOWN_KEYS.includes(key) &&
                    form.filters[key] && (
                      <div className="mt-1">
                        <Select
                          isMulti
                          options={[
                            { label: "All", value: "__all__" },
                            ...(filterOptions[key] || []).map((opt) => ({
                              label: opt,
                              value: opt,
                            })),
                          ]}
        value={
  (form.filter_values[key] || []).length === (filterOptions[key] || []).length
    ? [{ label: "All", value: "__all__" }]
    : (filterOptions[key] || [])
        .filter((val) => form.filter_values[key]?.includes(val))
        .map((val) => ({ label: val, value: val }))
}


          onChange={(sel) => {
  if (!sel) {
    handleMultiChange(key, []);
    return;
  }

  const values = sel.map((o) => o.value);
  const isAllSelected = values.includes("__all__");

  handleMultiChange(key, isAllSelected
    ? filterOptions[key].map((val) => ({ value: val }))
    : sel
  );
}}


                          classNamePrefix="react-select"
                          placeholder="Select..."
                        />
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* Save */}
          <div>
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
            >
              Save Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
