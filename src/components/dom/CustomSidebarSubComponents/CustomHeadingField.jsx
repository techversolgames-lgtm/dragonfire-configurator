const CustomHeadingField = ({ styles, value }) => {
  if(value.mode === "subtitle"){
    return(
      
      <div className={styles.subtitle}>
	  {value.currentValue}
	</div>
      
    )
  }
  
  return (
    <div className={styles.title}>
      {value.currentValue}	
    </div>
  )
  
};

export default CustomHeadingField;
