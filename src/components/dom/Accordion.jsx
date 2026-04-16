import { useState, useRef, useEffect } from "react";
import { FaCaretDown } from "react-icons/fa";
import styles from "@/styles/dom/Accordion.module.css";
import CustomTooltip from "@/components/dom/CustomTooltip";

const debounceThreshold = 80;

function Accordion({
  children,
  title,
  tooltip,
  isOpenRef,
  debounceTimeRef,
  defaultOpen = false,
}) {
  const componentID = useRef(Math.random());
  const contentRef = useRef(null);

  // Initialize with defaultOpen prop (false by default)
  const [isOpen, setIsOpen] = useState(() => {
    // If isOpenRef already has a value, use it, otherwise use defaultOpen
    if (isOpenRef && typeof isOpenRef.current !== "undefined") {
      return isOpenRef.current;
    }
    if (isOpenRef) isOpenRef.current = defaultOpen;
    return defaultOpen;
  });

  const [maxHeight, setMaxHeight] = useState("0px"); // Start closed

  useEffect(() => {
    // When open, remove max-height constraint entirely to prevent clipping
    // When closed, set to 0
    setMaxHeight(isOpen ? "none" : "0px");
  }, [isOpen, children]);

  const onToggle = () => {
    if (Date.now() - debounceTimeRef.current >= debounceThreshold) {
      setIsOpen(!isOpenRef.current);
      isOpenRef.current = !isOpenRef.current;
      debounceTimeRef.current = Date.now();
    }
  };

  return (
    <section className={styles.accordion}>
      <div className={styles.header} onClick={onToggle}>
        <FaCaretDown
          className={`${styles.caret} ${isOpen ? styles.active : ""}`}
        />
        <div className={styles.labelContainer}>
          <p>{title}</p>

          {tooltip && <CustomTooltip content={tooltip} />}
        </div>
      </div>
      <div
        className={`${styles.content} ${isOpen ? styles.contentActive : ""}`}
        style={{ maxHeight }}
        ref={contentRef}
        aria-expanded={isOpen}
      >
        {children}
      </div>
      <hr className={styles.separatorRuler} />
    </section>
  );
}

export default Accordion;
