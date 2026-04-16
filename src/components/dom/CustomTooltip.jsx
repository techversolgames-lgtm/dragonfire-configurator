import * as React from "react";
import { Tooltip } from "radix-ui";
import { FaInfoCircle } from "react-icons/fa";
import styles from "@/styles/dom/CustomTooltip.module.css";

const CustomTooltip = ({ content }) => {

  const formatContent = (content) => {
  return content.split("\n").map((line, index) => (
    <React.Fragment key={index}>
      {line}
      <br />
    </React.Fragment>
  ));
};
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
	<Tooltip.Trigger asChild>
	  <button className={styles.IconButton}>
	    <FaInfoCircle className={styles.Icon} />
	  </button>
	</Tooltip.Trigger>
	<Tooltip.Portal>
	  <Tooltip.Content side={"bottom"} className={styles.Content} sideOffset={5}>
	    {formatContent(content)}
	    <Tooltip.Arrow className={styles.Arrow} />
	  </Tooltip.Content>
	</Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default CustomTooltip;
