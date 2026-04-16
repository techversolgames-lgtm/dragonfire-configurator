import useAnimationStore from "@/stores/useAnimationStore";
import CustomTooltip from "@/components/dom/CustomTooltip";

const CustomCheckbox = ({ key, styles, value, setData }) => {
  let condition = false;
  if (value.condition !== undefined) {
    condition = useAnimationStore((state) => state[value.condition]());
  }

  // Get the current value from the store
  const currentValue = useAnimationStore((state) => state[value.name]);

  return (
    <div key={key} className={styles.optionContainer}>
      <div className={styles.labelContainer}>
        <label>{value.label}</label>
        {value.tooltip && <CustomTooltip content={value.tooltip} />}
      </div>

      {/* <br /> */}
      <div className={styles.inputContainer} style={{ width: "20%" }}>
        <input
          type="checkbox"
          checked={currentValue !== undefined ? currentValue : value.defaultValue}
          disabled={condition}
          onChange={(e) => {
            setData(value.name, e.target.checked);
          }}
        />
      </div>
      {/* 
              <hr />*/}
      <br />
    </div>
  );
};

export default CustomCheckbox;
