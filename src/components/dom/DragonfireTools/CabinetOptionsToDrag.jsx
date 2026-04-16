import { useState } from "react";
import styles from "@/styles/dom/DragonfireTools/CabinetOptionsToDrag.module.scss";
import useDragNDropStore from "@/stores/useDragNDropStore";
import { tabs, tabsDataMap } from "@/data/DragonfireTools/cabinetItems";

const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const CabinetOptionsToDrag = () => {
  // Default category should be "Cabinets" (not the first tab "Room items").
  const defaultCabinetTabIndex = Math.max(0, tabs.indexOf("Cabinets"));
  const [activeTab, setActiveTab] = useState(defaultCabinetTabIndex);
  const [isOpen, setIsOpen] = useState(true);

  const setSelectedDeckItem = useDragNDropStore(
    (state) => state.setSelectedDeckItem,
  );

  const handleStart = (option) => {
    setSelectedDeckItem(option);
  };

  const handleEnd = () => {
    setSelectedDeckItem(null);
  };

  const currentCategory = tabs[activeTab];
  const optionsInCategory = tabsDataMap[currentCategory] || [];

  return (
    <div className={styles.wrapper} data-dragonfire-tutorial="items-library">
      <div className={`${styles.contentArea} ${isOpen ? styles.contentOpen : styles.contentClosed}`}>
        <div className={styles.logoArea}>
          <img
            className={styles.logo}
            src="/logos/Dragon%20Fire%20UI%20Logo.png"
            alt="Dragon Fire"
          />
        </div>

        <div className={styles.inner}>
          <div className={styles.title}>Items library</div>
          <div className={styles.subtitle}>
            Choose a category, then click an item to pick it and place it in the
            room (or drag onto the floor or wall).
          </div>

          <section className={styles.stepSection} aria-label="Choose category">
            <label className={styles.stepLabel} htmlFor="category-select">
              Choose category
            </label>
            <select
              id="category-select"
              className={styles.categorySelect}
              value={currentCategory}
              onChange={(e) => {
                const idx = tabs.indexOf(e.target.value);
                if (idx !== -1) setActiveTab(idx);
              }}
            >
              {tabs.map((tab) => (
                <option key={tab} value={tab}>
                  {tab}
                </option>
              ))}
            </select>
          </section>

          <section
            className={styles.stepSection}
            aria-label="Choose item in category"
            aria-describedby="items-grid-hint"
          >
            <span className={styles.stepLabel}>In this category</span>
            <p id="items-grid-hint" className={styles.srOnly}>
              Click an item to select it, then click in the room to place it, or
              drag it onto the floor or wall.
            </p>
            <div className={styles.optionsGrid}>
              {optionsInCategory.map((option, index) => (
                <div
                  className={styles.option}
                  key={index}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleStart(option);
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEnd();
                  }}
                  onMouseDown={(e) => {
                    // Safari sometimes fails pointer events on small screens; mouse events are more reliable.
                    e.preventDefault();
                    e.stopPropagation();
                    handleStart(option);
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEnd();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleStart(option);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEnd();
                  }}
                  onTouchCancel={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEnd();
                  }}
                >
                  <img src={option.image} alt={option.label} />
                  <div className={styles.imageLabel}>{option.label}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <button
        type="button"
        className={styles.toggleTab}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close items library" : "Open items library"}
        title="Items library"
      >
        {isOpen ? <ChevronLeft /> : <ChevronRight />}
      </button>
    </div>
  );
};

export default CabinetOptionsToDrag;
