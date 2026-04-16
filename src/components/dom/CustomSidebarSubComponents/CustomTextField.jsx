import { useState, useEffect } from "react";
import CustomTooltip from "@/components/dom/CustomTooltip";

const CustomTextField = ({ styles, value, setData }) => {
  const [localValue, setLocalValue] = useState(value.currentValue || "");

  useEffect(() => {
    setLocalValue(value.currentValue || "");
  }, [value.currentValue]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setData(value.name, newValue, value.path);
  };

  const renderContent = () => {
    if (value.displayAsText) {
      return (
        <div
          className={value.inline ? {} : styles.text}
          style={value.color ? { color: value.color, fontSize: 12 } : {}}
          dangerouslySetInnerHTML={{ __html: localValue }}
        />
      );
    } else {
      return (
        <input
          type="text"
          placeholder={value.placeholder || ""}
          value={localValue}
          onChange={handleChange}
          className={styles.textField}
        />
      );
    }
  };

  if (value.inline) {
    return (
      <div
        className={`${styles.optionContainer} ${styles.inlineContainer || ""}`}
      >
        <div className={styles.labelContainer}>
          <label style={value.labelColor ? { color: value.labelColor } : {}}>
            {value.label}
          </label>
          {value.tooltip && <CustomTooltip content={value.tooltip} />}
          <div>{renderContent()}</div>
        </div>
        <br />
      </div>
    );
  }

  return (
    <div className={styles.optionContainer}>
      <div className={styles.labelContainer}>
        <label style={value.labelColor ? { color: value.labelColor } : {}}>
          {value.label}
        </label>
        {value.tooltip && <CustomTooltip content={value.tooltip} />}
      </div>
      <div className={styles.inputContainer}>{renderContent()}</div>
      <br />
    </div>
  );
};

export default CustomTextField;
