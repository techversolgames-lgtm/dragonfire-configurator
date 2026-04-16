import Select from "@/components/dom/Select";
import { motion } from "framer-motion";
import useAnimationStore from "@/stores/useAnimationStore";
import { useState, useEffect } from "react";
import CustomTooltip from "@/components/dom/CustomTooltip";

const CustomSelect = ({
  key,
  styles,
  value,
  setData,
  menuPortal,
  renderItem,
}) => {
  const [open, setOpen] = useState(false);
  // Support both object and array paths in the store. For arrays (e.g., drawers/columns),
  // find the matching item by name and read its currentValue.
  const currentValue = useAnimationStore((state) => {
    if (!value.path) return state[value.name];
    const container = state[value.path];
    if (Array.isArray(container)) {
      const item = container.find((it) => it.name === value.name);
      return item?.currentValue ?? value.defaultValue;
    }
    if (container && typeof container === "object") {
      return container[value.name];
    }
    return value.defaultValue;
  });

  let condition = false;
  if (value.condition !== undefined) {
    condition = useAnimationStore((state) => state[value.condition]());
  }

  const options = Object.entries(value.options).map(
    ([optionKey, optionValue]) => ({
      label: optionKey,
      value: optionValue,
    }),
  );

  const defaultOption = options.find((opt) => opt.value === value.defaultValue);
  const currentOption = options.find((opt) => opt.value === currentValue);

  return (
    <>
      <div
        style={{ width: "100%", display: "block" }}
        key={key}
        className={styles.optionContainer}
        onMouseEnter={() =>
          value.trackHover && setData(`${value.name}IsHovered`, true)
        }
        onMouseLeave={() =>
          value.trackHover && setData(`${value.name}IsHovered`, false)
        }
      >
        <div className={styles.labelContainer}>
          <label>{value.label}</label>
          {value.tooltip && <CustomTooltip content={value.tooltip} />}
        </div>

        <div className={styles.inputContainer} onClick={() => setOpen(!open)}>
          <Select
            options={options}
            defaultValue={defaultOption}
            value={currentOption || defaultOption}
            name={value.name}
            setData={(name, newValue) => setData(name, newValue, value.path)}
            className={styles.select}
            isDisabled={condition}
          />
        </div>
        <br />
      </div>
      {value.children &&
        value.children.map((child, index) => renderItem(index, child))}
    </>
  );
};

export default CustomSelect;
