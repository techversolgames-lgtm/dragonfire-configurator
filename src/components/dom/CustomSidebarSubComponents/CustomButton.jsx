import useAnimationStore from "@/stores/useAnimationStore";
import CustomTooltip from "@/components/dom/CustomTooltip";

const CustomButton = ({ key, styles, value }) => {
  let condition = false;
  if (value.condition !== undefined) {
    condition = useAnimationStore((state) => state[value.condition]());
  }

  return (
    <div key={key} className={styles.optionContainer}>
      <div className={styles.labelContainer}>
        {value.label && <label>{value.label}</label>}
        {value.tooltip && <CustomTooltip content={value.tooltip} />}
      </div>

      <div className={styles.inputContainer}>
        <div style={{ display: 'flex', width: "100%", alignItems: 'center', gap: 10 }}>
          {value.inlineAdornment}
          <button
           
            className={styles.normalButton}
            onClick={value.defaultValue}
            disabled={condition}
          >
            {value.text}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomButton;
