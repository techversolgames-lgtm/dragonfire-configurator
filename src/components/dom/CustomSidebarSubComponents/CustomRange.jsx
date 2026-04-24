import CustomTooltip from "@/components/dom/CustomTooltip";
import Range from "@/components/dom/Range";
import { useState, useEffect } from "react";

const CustomRange = ({ key, styles, value, setData, measurementUnits }) => {
  const currentValue = value.currentValue ?? value.defaultValue ?? 0;
  // Default to "m" (no conversion) if measurementUnits is not specified
  const effectiveUnits = measurementUnits || "m";
  const conversionFactor =
    effectiveUnits === "ft" ? 3.28084 : effectiveUnits === "in" ? 39.3701 : 1;

  // Stored values remain in meters; convert only for display/editing.
  const displayValue = (currentValue * conversionFactor).toFixed(2);
  const [inputValue, setInputValue] = useState(displayValue);

  useEffect(() => {
    const newDisplayValue = (currentValue * conversionFactor).toFixed(2);
    setInputValue(newDisplayValue);
  }, [currentValue, conversionFactor]);

  let condition = false;
  // Note: condition logic removed as it was tied to useAnimationStore

  const inputStyle = {
    backgroundColor: condition ? "#040404" : "#9aa4aa4d",
    // padding: "2px 4px",
    paddingLeft: "10px",
    // marginTop: "0px",
    borderRadius: "3px",
    fontSize: "11px",
    // width: "45px",
    border: "none",
    color: "inherit",
    textAlign: "center",
    MozAppearance: "textfield",
    WebkitAppearance: "none",
    appearance: "none",
  };

  return (
    <div key={key} className={styles.optionContainer}>
      <div className={styles.labelContainer}>
        <label>{value.label}</label>
        {value.tooltip && <CustomTooltip content={value.tooltip} />}
      </div>
      <div className={styles.inputContainer}>
        <Range
          style={{ flex: 1, minWidth: 0 }}
          name={value.name}
          min={value.min}
          step={value.step || defaults.step}
          max={value.max}
          defaultValue={value.defaultValue}
          value={currentValue}
          disabled={condition}
          onChange={(name, val) => setData(name, Number(val))}
        />

        <input
          type="number"
          value={inputValue}
          step={value.step || 1}
          min={value.min * conversionFactor}
          max={value.max * conversionFactor}
          onChange={(e) => {
            const val = Number(e.target.value);
            setInputValue(e.target.value);

            if (!isNaN(val)) {
              let meterValue = val / conversionFactor;

              if (meterValue < value.min) meterValue = value.min;
              if (meterValue > value.max) meterValue = value.max;

              setData(value.name, meterValue);
            }
          }}
          onBlur={(e) => {
            let val = Number(e.target.value);
            if (isNaN(val)) {
              val = value.defaultValue * conversionFactor;
            }

            let meterValue = val / conversionFactor;

            if (meterValue < value.min) meterValue = value.min;
            if (meterValue > value.max) meterValue = value.max;

            const newDisplayValue = (meterValue * conversionFactor).toFixed(2);
            setInputValue(newDisplayValue);
            setData(value.name, meterValue);
          }}
          disabled={condition}
          className={styles.numberInput}
          style={inputStyle}
        />
      </div>
    </div>
  );
};

export default CustomRange;
