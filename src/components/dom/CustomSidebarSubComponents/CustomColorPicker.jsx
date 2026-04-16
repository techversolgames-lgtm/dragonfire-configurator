import Select from "@/components/dom/ColorPicker";
import { motion } from "framer-motion";
import useAnimationStore from "@/stores/useAnimationStore";
import CustomTooltip from "@/components/dom/CustomTooltip";
import { useState } from "react";
import styles from "@/styles/dom/CustomSidebar.module.scss"

const CustomColorPicker = ({
  key,
  value,
  setData,
  menuPortal,
  renderItem,
}) => {
  const [open, setOpen] = useState(false);
  const currentValue = useAnimationStore((state) => state[value.name]);

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
      >
        <div className={styles.labelContainer}>
          <label>{value.label}</label>
          {value.tooltip && <CustomTooltip content={value.tooltip} />}
        </div>

        {/* <br /> */}
        <div className={styles.inputContainer} onClick={() => setOpen(!open)}>
          <Select
            options={options}
            defaultValue={defaultOption}
            value={currentOption || defaultOption}
            name={value.name}
            setData={setData}
            className={styles.select}
            isDisabled={condition}
          />
        </div>
        {/* 
        <hr />*/}
        <br />
      </div>
      {value.children &&
        value.children.map((child, index) => renderItem(index, child))}
    </>
  );
};

export default CustomColorPicker;
