// commonSelectStyles.js

export const commonSelectStyles = {
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

  multiValueLabel: (base, { data }) => ({
    ...base,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '160px',
    title: data.label,
  }),

  menu: (base) => ({
    ...base,
    backgroundColor: "#f9fafb",
    zIndex: 20,
    width: "max-content",
    minWidth: "200px",
    maxHeight: "200px",
    overflow: "hidden", // Prevent double scrollbars
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
};

export const formatLabelEllipsis = (data) => (
  <div title={data.label} style={{
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }}>
    {data.label}
  </div>
);
