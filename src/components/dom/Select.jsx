import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

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
  const [menuStyle, setMenuStyle] = useState({});
  const ref = useRef(null);
  const triggerRef = useRef(null);

  const selected = value || defaultValue;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        ref.current && !ref.current.contains(e.target) &&
        !(e.target.closest && e.target.closest('[data-select-portal]'))
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reposition portal menu whenever open
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [isOpen]);

  const handleSelect = (option) => {
    setData(name, option.value);
    setIsOpen(false);
  };

  const menuNode = isOpen
    ? createPortal(
        <div
          data-select-portal="true"
          style={{
            ...menuStyle,
            background: "#f0f4f6",
            border: "1px solid rgba(106,144,153,0.35)",
            borderRadius: 12,
            color: "#242424",
            maxHeight: 220,
            overflowY: "auto",
            boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
          }}
        >
          {options.map((option) => {
            const isActive = option.value === selected?.value;
            return (
              <div
                key={option.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(option);
                }}
                style={{
                  padding: "8px 10px",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#242424",
                  background: isActive ? "rgba(106,144,153,0.35)" : "transparent",
                  transition: "0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(106,144,153,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isActive
                    ? "rgba(106,144,153,0.35)"
                    : "transparent";
                }}
              >
                {option.label}
              </div>
            );
          })}
        </div>,
        document.body,
      )
    : null;

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
        ref={triggerRef}
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

      {menuNode}
    </div>
  );
};

export default Select;