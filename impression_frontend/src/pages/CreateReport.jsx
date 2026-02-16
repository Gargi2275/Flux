import React, { useEffect, useState } from "react";
import BASE_URL from "./config";
import Select from "react-select";

const availableFields = ["Sales Person", "Duration", "Products", "City", "Client", "Voucher", "Voucher Type"];

export default function CreateReport() {
  const [reportName, setReportName] = useState("");
  const [rowHeader, setRowHeader] = useState("");
  const [columnHeader, setColumnHeader] = useState("");
  const [headerValues, setHeaderValues] = useState({ row: [], column: [] });
const NO_DROPDOWN_KEYS = ["duration", "durationPeriod", "viewType"];

  const [filters, setFilters] = useState({
    duration: false,
    durationPeriod:false,
    salesPerson: false,
    city: false,
    product: false,
    viewType: false,
    client: false,
    vouchernumber: false,
    vouchertype: false,
  });
const durationPeriodOptions = ["daily", "weekly", "monthly", "yearly", "all"];

  const [filterValues, setFilterValues] = useState({
    city: [],
    product: [],
    salesPerson: [],
    client: [],
    vouchernumber: [],
    vouchertype: [],
    duration: "",
    durationPeriod: "",
  });

  const [filterOptions, setFilterOptions] = useState({
    city: [],
    product: [],
    salesPerson: [],
    client: [],
    vouchernumber: [],
    vouchertype: [],
    duration: [],
  });

useEffect(() => {
  fetch(`${BASE_URL}/api/filters/`)
    .then(res => res.json())
    .then(data => {
      setFilterOptions({
        city: data.cities || [],
        product: data.products || [],
        salesPerson: data.salesPersons || [],
        duration: data.durations || [],
        client: data.clients || [],
        vouchernumber: data.vouchernumber || data.vouchers || [],
        vouchertype: data.vouchertype || data.voucherTypes || [],
        durationPeriod: ["daily", "weekly", "monthly", "yearly", "all"], // ✅ Hardcoded duration periods
      });
    });
}, []);




  const toggleFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
  if (!reportName.trim()) {
    alert("Please enter report name.");
    return;
  }

  // Prepare filter values only for enabled filters
  const enabledFilterValues = {};
  Object.entries(filters).forEach(([key, isEnabled]) => {
    if (isEnabled && key !== "duration" && key !== "durationPeriod") {
      const val = filterValues[key];
      if (Array.isArray(val)) {
        enabledFilterValues[key] = val;
      } else if (typeof val === "string") {
        enabledFilterValues[key] = val.trim();
      }
    }
  });


  const newReport = {
    name: reportName.trim(),
    row_header: rowHeader,
    column_header: columnHeader,
    filters,  // still send the toggle states
    filter_values: enabledFilterValues,  // ✅ only enabled + selected values
    row_values: headerValues.row.map(val => val.trim()),
    column_values: headerValues.column.map(val => val.trim()),
    duration: filters.duration ? filterValues.duration : "",
  durationPeriod: filters.durationPeriod ? filterValues.durationPeriod : "",
  };

  fetch(`${BASE_URL}/api/reports/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newReport),
  })
    .then(res => res.json())
    .then(() => {
      alert("✅ Report created successfully");
      window.location.href = "/report-settings";
    })
    .catch(err => {
      console.error("❌ Failed to save report:", err);
      alert("Failed to save report");
    });
};



 const fieldKeyMap = {
  "Sales Person": "salesPerson",
  "Duration": "duration",
  "Products": "product",
  "City": "city",
  "Client": "client",
  "Voucher": "vouchernumber",
  "Voucher Type": "vouchertype",
};

const rowKey = fieldKeyMap[rowHeader];
const colKey = fieldKeyMap[columnHeader];

const rowValues = headerValues.row;
const columnValues = headerValues.column;




const renderDropdown = (header, type) => {
  const key = fieldKeyMap[header];
  const options = [
    { label: "All", value: "__all__" },
    ...(filterOptions[key] || []).map(opt => ({ label: opt, value: opt }))
  ];

  const selectedValues = headerValues[type];
  return (
    <div className="mt-2">
      <Select
        isMulti
        options={options}
        value={
          selectedValues.length === (filterOptions[key] || []).length
            ? [{ label: "All", value: "__all__" }]
            : selectedValues.map(val => ({ label: val, value: val }))
        }
        onChange={(selectedOptions) => {
          const selectedValues = selectedOptions.map(opt => opt.value);

          if (selectedValues.includes("__all__")) {
            // Select all values from backend
            setHeaderValues(prev => ({
              ...prev,
              [type]: filterOptions[key] || [],
            }));
          } else {
            setHeaderValues(prev => ({
              ...prev,
              [type]: selectedValues,
            }));
          }
        }}
        className="react-select-container text-sm"
        classNamePrefix="react-select"
        placeholder="Select..."
      />
    </div>
  );
};


  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-xl font-semibold mb-4">➕ Create New Report</h2>
      <div className="bg-white p-6 rounded shadow space-y-6 border border-gray-200">
        <div>
          <label className="block text-blue-700 font-semibold mb-1">Report Name</label>
          <input
            type="text"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            className="border border-gray-300 p-2 rounded w-full bg-gray-50"
            placeholder="Enter report name"
          />
        </div>

        {/* Row and Column Header Selects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-blue-700 font-semibold mb-1">Row Header</label>
            <select
              className="border border-gray-300 p-2 rounded w-full bg-gray-50"
              value={rowHeader}
              onChange={(e) => {
                setRowHeader(e.target.value);
                setHeaderValues(prev => ({ ...prev, row: [] }));
              }}
            >
              <option value="">Select</option>
              {availableFields.map((field) => (
                <option key={field} value={field} disabled={columnHeader === field}>
                  {field}
                </option>
              ))}
            </select>
            {rowHeader && renderDropdown(rowHeader, "row")}
          </div>

          <div>
            <label className="block text-blue-700 font-semibold mb-1">Column Header</label>
            <select
              className="border border-gray-300 p-2 rounded w-full bg-gray-50"
              value={columnHeader}
              onChange={(e) => {
                setColumnHeader(e.target.value);
                setHeaderValues(prev => ({ ...prev, column: [] }));
              }}
            >
              <option value="">Select</option>
              {availableFields.map((field) => (
                <option key={field} value={field} disabled={rowHeader === field}>
                  {field}
                </option>
              ))}
            </select>
            {columnHeader && renderDropdown(columnHeader, "column")}
          </div>
        </div>

        {/* Filters */}
      <div>
  <label className="block text-blue-700 font-semibold mb-2">Apply Filters</label>
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
   {Object.entries(filters).filter(([key]) => key !== "duration" && key !== "durationPeriod").map(([key, value]) => (

      <div key={key} className="bg-blue-50 p-2 rounded">
        <label className="flex items-center mb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value}
            onChange={() => toggleFilter(key)}
            className="mr-2"
          />
          <span className="text-sm capitalize">
            {key === "viewType" ? "Currency / Quantity" : key.replace(/([A-Z])/g, " $1")}
          </span>
        </label>

        {/* Show dropdown if filter is enabled and it's not a boolean filter */}
        {value && !NO_DROPDOWN_KEYS.includes(key) && (

<Select
  isMulti
  options={[
    { label: "All", value: "__all__" },
    ...(filterOptions[key] || []).map(opt => ({ label: opt, value: opt }))
  ]}
  value={
    (filterValues[key] || []).length === (filterOptions[key] || []).length
      ? [{ label: "All", value: "__all__" }]
      : (filterValues[key] || []).map(val => ({ label: val, value: val }))
  }
  onChange={(selected) => {
    const selectedValues = selected.map(opt => opt.value);
    if (selectedValues.includes("__all__")) {
      setFilterValues(prev => ({
        ...prev,
        [key]: filterOptions[key] || [],
      }));
    } else {
      setFilterValues(prev => ({
        ...prev,
        [key]: selectedValues,
      }));
    }
  }}
  className="text-sm"
  classNamePrefix="react-select"
  placeholder="Select..."
  getOptionLabel={(e) => (
    <div title={e.label}>
      {e.label}
    </div>
  )}
  styles={{
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    control: (base) => ({
      ...base,
      borderColor: "#d1d5db",
      minHeight: '32px',
      maxHeight: 'none',
      flexWrap: 'wrap',
      overflow: 'visible',
    }),
    valueContainer: (base) => ({
      ...base,
      maxHeight: '60px',
      overflowY: 'auto',
      overflowX: 'hidden',
      flexWrap: 'wrap',
      gap: '4px',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#e5e7eb",
      maxWidth: '100%',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
    }),
    multiValueLabel: (base) => ({
      ...base,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '160px',
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#f9fafb",
      zIndex: 20,
      width: "max-content",
      minWidth: "200px",
      maxHeight: "200px",
      overflow: "hidden",
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: "200px",
      overflowY: "auto",
      backgroundColor: "#f9fafb",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#2563eb"
        : state.isFocused
        ? "#e0e7ff"
        : "transparent",
      color: state.isSelected ? "white" : "black",
      fontWeight: state.isSelected ? "bold" : "normal",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#6b7280",
      whiteSpace: 'nowrap',
    }),
  }}
/>


        )}


      </div>
    ))}


    {/* Always show duration and durationPeriod dropdowns */}
{/* Duration + DurationPeriod checkboxes only */}
{["duration", "durationPeriod"].map((key) => (
  <div key={key} className="bg-blue-50 p-2 rounded">
    <label className="flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={filters[key]}
        onChange={() => toggleFilter(key)}
        className="mr-2"
      />
      <span className="text-sm capitalize">
        {key === "durationPeriod" ? "Duration Period" : "Duration"}
      </span>
    </label>
  </div>
))}



  </div>
</div>

        {/* Save Button */}
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
  );
}
