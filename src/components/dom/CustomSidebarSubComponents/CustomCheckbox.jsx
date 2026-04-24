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
    <div key={key} className={styles.checkboxRow}>
      <div className={styles.labelContainer}>
        <label>{value.label}</label>
        {value.tooltip && <CustomTooltip content={value.tooltip} />}
      </div>
      <input
        type="checkbox"
        checked={currentValue !== undefined ? currentValue : value.defaultValue}
        disabled={condition}
        onChange={(e) => {
          setData(value.name, e.target.checked);
        }}
        className={styles.checkboxInput}
      />
    </div>
  );
};

export default CustomCheckbox;
