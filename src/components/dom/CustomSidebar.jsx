import styles from "@/styles/dom/CustomSidebar.module.scss";
import useAnimationStore from "@/stores/useAnimationStore";
import Accordion from "@/components/dom/Accordion";
import CustomCheckbox from "@/components/dom/CustomSidebarSubComponents/CustomCheckbox";
import CustomButton from "@/components/dom/CustomSidebarSubComponents/CustomButton";
import CustomRange from "@/components/dom/CustomSidebarSubComponents/CustomRange";
import CustomSelect from "@/components/dom/CustomSidebarSubComponents/CustomSelect";
import { useEffect, useState, useMemo } from "react";
import CustomColorPicker from "@/components/dom/CustomSidebarSubComponents/CustomColorPicker";
import CustomColorPickerPrismatic from "@/components/dom/CustomSidebarSubComponents/CustomColorPickerPrismatic";
import CustomImageChoice from "@/components/dom/CustomSidebarSubComponents/CustomImageChoice";
import CustomTextField from "@/components/dom/CustomSidebarSubComponents/CustomTextField";
import { FaSave, FaFileDownload, FaFileExport, FaCopy } from "react-icons/fa";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import SaveConfigurationModal from "./modals/SaveConfigurationModal";
import DownloadQuoteModal from "./modals/DownloadQuoteModal";
import DownloadCadFileModal from "./modals/DownloadCadFileModal";

// No need for external loader library

function Sidebar({
  data,
  children,
  price = 0,
  isPriceLoading = false,
  hasPrice = false,
  customStyles = "",
  jsonDataRef,
  showSaveModal = false,
  setShowSaveModal,
  showDownloadQuoteModal = false,
  setShowDownloadQuoteModal,
  showDownloadCadFileModal = false,
  setShowDownloadCadFileModal,
}) {
  const [menuPortal, setMenuPortal] = useState(null);

  useEffect(() => {
    setMenuPortal(document.body); // Only runs in the browser
  }, []);

  const setData = (name, value, path = null) => {
    // console.log("Setting ", name, "to ", value);
    // console.log("Store contents", useAnimationStore.getState());
    useAnimationStore.setState((state) => {
      if (path) {
        if (Array.isArray(state[path])) {
          return {
            [path]: state[path].map((item) =>
              item.name === name ? { ...item, currentValue: value } : item,
            ),
          };
        } else if (typeof state[path] === "object") {
          return {
            [path]: {
              ...state[path],
              [name]: value,
            },
          };
        }
      } else {
        return {
          [name]: value,
        };
      }
    });
  };

  // Collect all showIf fields
  const showIfFields = useMemo(() => {
    const fields = new Set();
    const collect = (items) => {
      Object.values(items).forEach((value) => {
        if (value.showIf) fields.add(value.showIf.field);
        if (value.children) collect(value.children);
      });
    };
    collect(data);
    return [...fields];
  }, [data]);

  // Subscribe only to those fields
  const watchedValues = useAnimationStore((state) =>
    Object.fromEntries(showIfFields.map((f) => [f, state[f]])),
  );

  // Create a stable renderItem function with useMemo
  const renderItem = useMemo(() => {
    return function (key, value) {
      // Check showIf condition before rendering
      if (value.showIf) {
        const { field, value: expected } = value.showIf;
        const actual = watchedValues[field];
        const matches = Array.isArray(expected)
          ? expected.includes(actual)
          : actual === expected;
        if (!matches) return null;
      }

      let uiFinal = null;

      switch (value.type) {
        case "boolean":
          uiFinal = (
            <CustomCheckbox
              key={key}
              keyLocal={key}
              styles={styles}
              value={value}
              setData={setData}
            />
          );
          break;

        case "button":
          uiFinal = (
            <CustomButton
              key={key}
              keyLocal={key}
              styles={styles}
              value={value}
              setData={setData}
            />
          );
          break;

        case "range":
          uiFinal = (
            <CustomRange
              key={key}
              keyLocal={key}
              styles={styles}
              value={value}
              setData={setData}
              measurementUnits={value.measurementUnits}
            />
          );
          break;

        case "select":
          uiFinal = (
            <CustomSelect
              key={key}
              keyLocal={key}
              styles={styles}
              value={value}
              setData={setData}
              renderItem={renderItem}
              menuPortal={menuPortal}
            />
          );
          break;

        case "color":
          uiFinal = (
            <CustomColorPicker
              key={key}
              keyLocal={key}
              styles={styles}
              value={value}
              setData={setData}
              menuPortal={menuPortal}
            />
          );

          break;

        case "prismaticColor":
          uiFinal = (
            <CustomColorPickerPrismatic
              key={key}
              keyLocal={key}
              styles={styles}
              value={value}
              setData={setData}
              menuPortal={menuPortal}
            />
          );

          break;

        case "imageChoice":
          uiFinal = (
            <CustomImageChoice
              key={key}
              keyLocal={key}
              value={value}
              setData={setData}
              menuPortal={menuPortal}
              useKey={value.useKey}
              disabledChoices={value.disabledChoices}
            />
          );

          break;

        case "text":
          uiFinal = (
            <CustomTextField
              key={key}
              keyLocal={key}
              styles={styles}
              value={value}
              setData={setData}
            />
          );

          break;

        case "invisgroup":
          uiFinal = (
            <div
              title={value.label}
              tooltip={value.tooltip}
              key={value.label}
              isOpenRef={value.isOpenRef}
              debounceTimeRef={value.debounceTimeRef}
            >
              {Object.entries(value.children).map(([childKey, childValue]) =>
                renderItem(childKey, childValue),
              )}
              {children}
            </div>
          );
          break;

        case "group":
          uiFinal = (
            <Accordion
              title={value.label}
              tooltip={value.tooltip}
              key={value.label}
              keyLocal={value.label}
              isOpenRef={value.isOpenRef}
              debounceTimeRef={value.debounceTimeRef}
            >
              {Object.entries(value.children).map(([childKey, childValue]) =>
                renderItem(childKey, childValue),
              )}
              {children}
            </Accordion>
          );
          break;

        default:
          break;
      }

      return uiFinal;
    };
  }, [menuPortal, children, watchedValues]);

  const sidebarContent = useMemo(() => {
    return Object.entries(data).map(([key, value]) => renderItem(key, value));
  }, [data, renderItem]);

  return (
    <div className={styles.sidebarContainer}>
      <div
        className={`${styles.sidebar} ${
          hasPrice ? styles.hasPricing : ""
        } ${customStyles}`}
      >
        {hasPrice && (
          <div className={styles.pricing}>
            <div className={styles.iconsContainer}>
              {/* <FaCopy className={styles.icon} title="Copy JSON" />
              <FaFileExport className={styles.icon} title="Export JSON" /> */}
              <FaSave
                className={styles.icon}
                title="Save Configuration"
                onClick={() => {
                  useAnimationStore.setState({ shouldDownload: true });
                  setShowSaveModal(true);
                }}
              />
              <FaFileInvoiceDollar
                className={styles.icon}
                title="Download Quote"
                onClick={() => {
                  useAnimationStore.setState({ shouldDownload: true });
                  setShowDownloadQuoteModal(true);
                }}
              />
              <FaFileDownload
                className={styles.icon}
                title="Download CAD File"
                onClick={() => {
                  setShowDownloadCadFileModal(true);
                }}
              />

              {/* Save Configuration Modal */}
              {showSaveModal && !isPriceLoading && (
                <SaveConfigurationModal
                  configuration={jsonDataRef.current}
                  open={showSaveModal}
                  onClose={() => setShowSaveModal(false)}
                  price={price}
                />
              )}

              {/* Download Quote Modal */}
              {showDownloadQuoteModal && (
                <DownloadQuoteModal
                  configuration={jsonDataRef.current}
                  open={showDownloadQuoteModal}
                  onClose={() => setShowDownloadQuoteModal(false)}
                  price={price}
                />
              )}

              {/* Download CAD File Modal */}
              {showDownloadCadFileModal && (
                <DownloadCadFileModal
                  configuration={jsonDataRef.current}
                  open={showDownloadCadFileModal}
                  onClose={() => setShowDownloadCadFileModal(false)}
                />
              )}
            </div>
            <div className={styles.priceContainer}>
              <p>Price</p>
              <div className={styles.price}>
                {isPriceLoading ? (
                  <div className={styles.skeletonContainer}>
                    <div className={styles.dollarSkeleton}>
                      <div className={styles.skeletonShimmer}></div>
                    </div>
                    <div className={styles.priceSkeleton}>
                      <div className={styles.skeletonShimmer}></div>
                    </div>
                  </div>
                ) : (
                  <>$ {price}</>
                )}
              </div>
            </div>
          </div>
        )}

        {sidebarContent}
        {children}
        <br />
        <br />
        <div className={styles.poweredBy}>
          Powered by{" "}
          <img
            className={styles.spokbeeLogo}
            alt="spokbee logo"
            src="/logos/spokbee.png"
          />
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
