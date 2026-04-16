import { useState, useRef, useEffect } from "react";

const Select = ({
  options = [],
  defaultValue,
  value,
  name,
  setData,
  className,
  isDisabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = value || defaultValue;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (option) => {
    setData(name, option.value);
    setIsOpen(false);
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        fontFamily: "Roboto, sans-serif",
        fontSize: 11,
        userSelect: "none",
        opacity: isDisabled ? 0.5 : 1,
        pointerEvents: isDisabled ? "none" : "auto",
      }}
    >
      <div
        onClick={() => setIsOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 8px",
          borderRadius: 4,
          background: "#2c333a",
          border: "1px solid #3e434f",
          cursor: "pointer",
          color: "#ddd",
          minHeight: 28,
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected?.label ?? "Select…"}
        </span>
        <span style={{ fontSize: 9, color: "#aaa" }}>▾</span>
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 2px)",
            left: 0,
            right: 0,
            background: "#1d252b",
            border: "1px solid #3e434f",
            borderRadius: 4,
            zIndex: 9999,
            maxHeight: 180,
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}
        >
          {options.map((option) => {
            const isActive = option.value === selected?.value;
            return (
              <div
                key={option.value}
                onClick={() => handleSelect(option)}
                style={{
                  padding: "5px 8px",
                  cursor: "pointer",
                  color: "#ddd",
                  background: isActive ? "rgba(44,111,173,0.25)" : "transparent",
                  fontSize: 11,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(44,111,173,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isActive
                    ? "rgba(44,111,173,0.25)"
                    : "transparent";
                }}
              >
                {option.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Select;
