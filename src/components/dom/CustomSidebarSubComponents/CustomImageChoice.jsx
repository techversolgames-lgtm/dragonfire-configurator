import { useState, useEffect } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import styles from "@/styles/dom/CustomImageChoice.module.css";
import useAnimationStore from "@/stores/useAnimationStore";
import CustomTooltip from "@/components/dom/CustomTooltip";

const CustomImageChoice = ({
  key,
  keyLocal,
  value,
  setData,
  renderItem,
  useKey = false,
  disabledChoices = [],
}) => {
  const [selectedImage, setSelectedImage] = useState(null);

  let condition = false;
  const conditionBackup = useAnimationStore((state) => state[value.condition]);
  if (value.condition !== undefined) {
    condition = conditionBackup;
  }

  const currentStoreValue = useAnimationStore((state) => state[value.name]);

  const options =
    value.options && typeof value.options === "object"
      ? Object.entries(value.options).map(([optionKey, optionValue]) => ({
          label: optionKey,
          value: optionValue,
        }))
      : [{ label: "Default Option", value: "default" }];

  // Update selectedImage when store value changes
  useEffect(() => {
    if (currentStoreValue) {
      setSelectedImage(currentStoreValue);
    } else if (value.defaultValue) {
      setSelectedImage(value.defaultValue);

      if (setData && value.name && !currentStoreValue) {
        setData(value.name, value.defaultValue);
      }
    }
  }, [currentStoreValue, value.defaultValue, value.name, setData]);

  const handleImageSelect = (option) => {
    if (condition || disabledChoices.includes(option.label)) return;

    setSelectedImage(option.value);

    if (setData && value.name) {
      const dataToSet = useKey ? option.label : option.value;
      setData(value.name, dataToSet);
    }
  };

  return (
    <div
      style={{ width: "100%", display: "block" }}
      key={keyLocal}
      className={styles.optionContainer}
    >
      <div className={styles.labelContainer}>
        <label>{value.label}</label>
        {value.tooltip && <CustomTooltip content={value.tooltip} />}
      </div>
      <div
        className={`${styles.imageGridContainer} ${
          condition ? styles.disabled : ""
        }`}
      >
        {options.map((option, index) => {
          const placeholder = "/placeholder.png";
          const imgSrc = option.value || placeholder;

          return (
            <div
              key={index}
              className={styles.imageContainer}
              onClick={() => handleImageSelect(option)}
            >
              <div
                className={`${styles.imageWrapper} ${
                  selectedImage === option.value ? styles.selected : ""
                } ${disabledChoices.includes(option.label) ? styles.disabled : ""}`}
              >
                <img
                  src={imgSrc}
                  alt={option.label}
                  className={styles.choiceImage}
                  onError={(e) => {
                    e.currentTarget.src = placeholder;
                  }}
                />
              </div>
              <div
                className={`${styles.imageLabel} ${disabledChoices.includes(option.label) ? styles.disabled : ""}`}
              >
                {option.label.replace(/[-_]/g, " ")}
              </div>
            </div>
          );
        })}
      </div>

      {value.children &&
        value.children.map((child, index) => renderItem(index, child))}
    </div>
  );
};

export default CustomImageChoice;
