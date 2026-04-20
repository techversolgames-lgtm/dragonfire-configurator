import { useState, useRef, useMemo } from "react";
import styles from "@/styles/dom/DragonfireTools/CabinetOptionsToDrag.module.scss";
import useDragNDropStore from "@/stores/useDragNDropStore";
import {
  mainCategories,
  cabinetSubCategories,
  shortCabinetOptions,
  mediumCabinetOptions,
  standingCabinetOptions,
  roomItemsOptions,
  withoutCabinetOptions,
} from "@/data/DragonfireTools/cabinetItems";

/* ICONS */
const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path
      d="M15 6L9 12L15 18"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path
      d="M9 6L15 12L9 18"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CabinetOptionsToDrag = () => {
  /* ---------------- STATE ---------------- */
  const [step, setStep] = useState(1);

  const [selection, setSelection] = useState({
    category: null,
    subCategory: null,
    item: null,
  });

  const sliderRef = useRef(null);

  const setSelectedDeckItem = useDragNDropStore(
    (state) => state.setSelectedDeckItem
  );

  /* ---------------- HELPERS ---------------- */
  const slideLeft = () =>
    sliderRef.current?.scrollBy({ left: -160, behavior: "smooth" });

  const slideRight = () =>
    sliderRef.current?.scrollBy({ left: 160, behavior: "smooth" });

  const handleDragStart = (option) => setSelectedDeckItem(option);

  const updateSelection = (key, value) => {
    setSelection((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const goNext = () => setStep((s) => Math.min(s + 1, 3));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  /* ---------------- OPTIONS LOGIC ---------------- */
  const optionsToShow = useMemo(() => {
    if (step === 1) return mainCategories;

    if (step === 2) {
      if (selection.category === "cabinet") return cabinetSubCategories;

      if (selection.category === "workbench") {
        return [
          {
            label: "7ft Workbench",
            type: "7ft",
            image: "/images/dragonfire-tools/7ft_workbench/12D.png",
          },
          {
            label: "9ft Workbench",
            type: "9ft",
            image: "/images/dragonfire-tools/9ft_workbenches/18D.png",
          },
          { label: "With Cabinet", type: "with", image: "/images/dragonfire-tools/combo/worktable_package.png", },
          { label: "Without Cabinet", type: "without", image: "/images/dragonfire-tools/pro-series-worktable.png", },

        ];
      }
    }

    if (step === 3) {
      if (selection.category === "room") {
        return roomItemsOptions;
      }
      switch (selection.subCategory) {
        case "7ft":
          return shortCabinetOptions;

        case "9ft":
          return mediumCabinetOptions;

        case "without":
          return withoutCabinetOptions;

        case "drawer":
          return standingCabinetOptions.filter((i) =>
            i.label.toLowerCase().includes("drawer")
          );

        case "wall":
          return standingCabinetOptions.filter((i) => i.itemType === "wall");

        case "corner":
          return standingCabinetOptions.filter((i) => i.bIsCornerCabinet);


        default:
          return [];
      }

    }

    return [];
  }, [step, selection]);

  /* ---------------- RENDER HELPERS ---------------- */
  const isActive = (option) => {
    if (step === 1) return selection.category === option.type;
    if (step === 2) return selection.subCategory === option.type;
    if (step === 3) return selection.item === option;
    return false;
  };

  /* ---------------- CLICK HANDLER ---------------- */
  const handleClick = (option) => {
    if (step === 1) {
      updateSelection("category", option.type);

      if (option.type === "room") {
        setSelection({
          category: "room",
          subCategory: null,
          item: null,
        });
        setStep(3);
      }

      return;
    }


    if (step === 2) {
      updateSelection("subCategory", option.type);

      // UX smooth transition
      setTimeout(() => {
        setStep(3);
      }, 180);

      return;
    }

    if (step === 3) {
      updateSelection("item", option);
      handleDragStart(option);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.panel}>
        {/* HEADER */}
        <div className={styles.header}>
          {step > 1 && (
            <button className={styles.backBtn} onClick={goBack}>
              Back
            </button>
          )}

          <h3 className={styles.title}>
            {step === 1 && "Select Category"}
            {step === 2 && "Choose Configuration"}
            {step === 3 && "Drag & Place Item"}
          </h3>
        </div>

        {/* SLIDER */}
        <div className={styles.sliderWrapper}>
          <button onClick={slideLeft} className={styles.navBtnLeft}>
            <ChevronLeft />
          </button>

          <div className={styles.slider} ref={sliderRef}>
            {optionsToShow.map((option, index) => (
              <div
                key={index}
                className={`${styles.card} ${isActive(option) ? styles.active : ""
                  }`}
                onClick={() => handleClick(option)}
                onMouseDown={() => step === 3 && handleDragStart(option)}
                onTouchStart={() => step === 3 && handleDragStart(option)}
              >
                <img
                  src={option.image || "/images/placeholder.png"}
                  alt={option.label}
                />
                <p>{option.label}</p>
              </div>
            ))}
          </div>

          <button onClick={slideRight} className={styles.navBtnRight}>
            <ChevronRight />
          </button>
        </div>

        {/* BOTTOM */}
        <div className={styles.bottomArea}>
          {(step === 1 || step === 2) && (
            <button
              className={styles.exploreBtn}
              disabled={step === 1 && !selection.category}
              onClick={() => {
                if (step === 1 && selection.category) goNext();
                else if (step === 2 && selection.subCategory) goNext();
              }}
            >
              Continue
            </button>
          )}

          {step === 3 && (
            <div className={styles.dragInfo}>
              Click & drag item to place it on layout
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CabinetOptionsToDrag;
