import { useRef, useState } from "react";
import { FaFileUpload, FaTimes } from "react-icons/fa";
import CustomTooltip from "@/components/dom/CustomTooltip";

const CustomFileUpload = ({ styles, value, setData }) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(value.currentValue || null);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file); 
      setData(value.name, file, value.path);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setData(value.name, null, value.path);
  };

  return (
    <div className={styles.optionContainer}>
      <div className={styles.labelContainer}>
        {value.label && <label>{value.label}</label>}
        {value.tooltip && <CustomTooltip content={value.tooltip} />}
      </div>

      <div className={styles.inputContainer}>
        <div
          onClick={handleClick}
          style={{
            border: '2px dashed #ccc',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            borderRadius: '4px',
            backgroundColor: '#f9f9f9',
            minHeight: '80px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {selectedFile ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '5px 0',
                fontSize: '13px',
                color: '#333',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <span>{selectedFile.name}</span>
              <FaTimes
                size={14}
                style={{ cursor: 'pointer', color: '#666' }}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
              />
            </div>
          ) : (
            <>
              <FaFileUpload size={24} style={{ color: '#666' }} />
              <p style={{ margin: '10px 0 0 0', color: '#666' }}>
                Click to select a file
              </p>
            </>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".glb,.gltf"
          style={{ display: 'none' }}
        />
      </div>

      <br />
      <hr />
      <br />
    </div>
  );
};

export default CustomFileUpload;
