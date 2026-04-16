const Range = ({
  name,
  min = 0,
  max = 100,
  step = 1,
  defaultValue,
  value,
  disabled,
  onChange,
}) => {
  const handleChange = (e) => {
    if (onChange) onChange(name, e.target.value);
  };

  return (
    <input
      type="range"
      name={name}
      min={min}
      max={max}
      step={step}
      defaultValue={defaultValue}
      value={value}
      disabled={disabled}
      onChange={handleChange}
    />
  );
};

export default Range;
