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
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
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
        fontSize: 13,
        userSelect: "none",
        opacity: isDisabled ? 0.5 : 1,
        pointerEvents: isDisabled ? "none" : "auto",
      }}
    >
      {/* ===== SELECT BOX ===== */}
      <div
        onClick={() => setIsOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          padding: "8px 10px",
          borderRadius: 10,

          background: "rgba(106,144,153,0.18)",
          border: "1px solid rgba(106,144,153,0.25)",

          color: "#242424",
          cursor: "pointer",
          transition: "0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.background = "rgba(106,144,153,0.28)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.background = "rgba(106,144,153,0.18)";
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selected?.label ?? "Select…"}
        </span>

        <span style={{ fontSize: 10, color: "#9fb0bd" }}>▾</span>
      </div>

      {/* ===== DROPDOWN ===== */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,

            background: "rgba(106,144,153,0.18)",
            border: "1px solid rgba(106,144,153,0.25)",
            borderRadius: 12,
            color: "#242424",
            zIndex: 9999,
            maxHeight: 220,
            overflowY: "auto",

            boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
            backdropFilter: "blur(12px)",
          }}
        >
          {options.map((option) => {
            const isActive = option.value === selected?.value;

            return (
              <div
                key={option.value}
                onClick={() => handleSelect(option)}
                style={{
                  padding: "8px 10px",
                  cursor: "pointer",
                  fontSize: 13,

                  color: "#242424",
                  background: isActive
                    ? "rgb(106, 144, 153)"
                    : "transparent",

                  transition: "0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "rgb(106, 144, 153)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isActive
                    ? "rgba(106,144,153,0.30)"
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