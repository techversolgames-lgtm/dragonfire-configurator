const CustomSeparator = ({ styles, value }) => {
  const type = value.mode === 'double' ? 'double' : 'single';
  return (
      <div className={styles.sepContainer}>
        <hr className={styles.separator} />
        {type === 'double' && (
	  <hr className={styles.separator} />
        )}
      </div>

  );
};

export default CustomSeparator;
