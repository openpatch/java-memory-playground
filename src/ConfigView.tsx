import { shallow } from "zustand/shallow";
import useStore, { RFState } from "./store";
import { useCallback, useState } from "react";
import { DataType, primitveDataTypes } from "./memory";

const selector = (state: RFState) => ({
  updateMemory: state.updateMemory,
  memory: state.memory,
  setRoute: state.setRoute,
});

export const ConfigView = () => {
  const { memory, updateMemory, setRoute } = useStore(selector, shallow);

  const [klasses, setKlasses] = useState(memory.klasses);
  const [options, setOptions] = useState(memory.options);
  const [addingAttribute, setAddingAttribute] = useState<string | null>(null);
  const [editingAttribute, setEditingAttribute] = useState<{
    klassName: string;
    attrName: string;
    currentDataType: DataType;
  } | null>(null);
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrType, setNewAttrType] = useState<DataType>("String");

  // Get available data types: primitives + Array + defined classes
  const availableDataTypes = [
    ...primitveDataTypes,
    "Array",
    ...Object.keys(klasses),
  ];

  const onSave = useCallback(() => {
    updateMemory({
      ...memory,
      klasses,
      options,
    });
  }, [memory, klasses, options, updateMemory]);

  const onView = useCallback(() => {
    setRoute("view");
  }, [setRoute]);

  const handleOptionChange = useCallback(
    (key: string, value: boolean) => {
      setOptions((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const handleAddKlass = useCallback(() => {
    const name = window.prompt("Enter class name:");
    if (name && name.trim()) {
      setKlasses((prev) => ({
        ...prev,
        [name.trim()]: {
          attributes: {},
        },
      }));
    }
  }, []);

  const handleRemoveKlass = useCallback((name: string) => {
    if (window.confirm(`Are you sure you want to delete class "${name}"?`)) {
      setKlasses((prev) => {
        const newKlasses = { ...prev };
        delete newKlasses[name];
        return newKlasses;
      });
    }
  }, []);

  const handleAddAttribute = useCallback((klassName: string) => {
    setAddingAttribute(klassName);
    setNewAttrName("");
    setNewAttrType("String");
  }, []);

  const handleConfirmAddAttribute = useCallback(() => {
    if (addingAttribute && newAttrName.trim()) {
      setKlasses((prev) => ({
        ...prev,
        [addingAttribute]: {
          ...prev[addingAttribute],
          attributes: {
            ...prev[addingAttribute].attributes,
            [newAttrName.trim()]: newAttrType,
          },
        },
      }));
      setAddingAttribute(null);
      setNewAttrName("");
      setNewAttrType("String");
    }
  }, [addingAttribute, newAttrName, newAttrType]);

  const handleCancelAddAttribute = useCallback(() => {
    setAddingAttribute(null);
    setNewAttrName("");
    setNewAttrType("String");
  }, []);

  const handleRemoveAttribute = useCallback(
    (klassName: string, attrName: string) => {
      if (
        window.confirm(
          `Are you sure you want to delete attribute "${attrName}" from class "${klassName}"?`
        )
      ) {
        setKlasses((prev) => {
          const newKlasses = { ...prev };
          const newAttributes = { ...newKlasses[klassName].attributes };
          delete newAttributes[attrName];
          newKlasses[klassName] = {
            ...newKlasses[klassName],
            attributes: newAttributes,
          };
          return newKlasses;
        });
      }
    },
    []
  );

  const handleEditAttribute = useCallback(
    (klassName: string, attrName: string, currentDataType: DataType) => {
      setEditingAttribute({ klassName, attrName, currentDataType });
      setNewAttrType(currentDataType);
    },
    []
  );

  const handleConfirmEditAttribute = useCallback(() => {
    if (editingAttribute) {
      setKlasses((prev) => ({
        ...prev,
        [editingAttribute.klassName]: {
          ...prev[editingAttribute.klassName],
          attributes: {
            ...prev[editingAttribute.klassName].attributes,
            [editingAttribute.attrName]: newAttrType,
          },
        },
      }));
      setEditingAttribute(null);
      setNewAttrType("String");
    }
  }, [editingAttribute, newAttrType]);

  const handleCancelEditAttribute = useCallback(() => {
    setEditingAttribute(null);
    setNewAttrType("String");
  }, []);

  return (
    <div style={{ 
      padding: "32px", 
      maxWidth: "1200px", 
      margin: "0 auto",
      minHeight: "100vh",
      backgroundColor: "#f8f9fa"
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "32px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        marginBottom: "24px"
      }}>
        <h1 style={{ 
          margin: "0 0 24px 0", 
          color: "#1a202c",
          fontSize: "32px",
          fontWeight: "700"
        }}>Configuration</h1>

        <div className="button-group" style={{ gap: "12px", padding: "0" }}>
          <button 
            onClick={onSave}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "600",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 4px rgba(102, 126, 234, 0.3)"
            }}
          >💾 Save</button>
          <button 
            onClick={onView}
            style={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "600",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 4px rgba(79, 172, 254, 0.3)"
            }}
          >👁️ View</button>
        </div>
      </div>

      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "32px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        marginBottom: "24px"
      }}>
        <h2 style={{ 
          margin: "0 0 20px 0", 
          color: "#2d3748",
          fontSize: "24px",
          fontWeight: "600",
          borderBottom: "3px solid #667eea",
          paddingBottom: "12px"
        }}>⚙️ Options</h2>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "16px" 
        }}>
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            padding: "12px 16px",
            backgroundColor: "#f7fafc",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            border: "2px solid transparent"
          }}>
            <input
              type="checkbox"
              checked={options.disableGarbageCollector || false}
              onChange={(e) =>
                handleOptionChange("disableGarbageCollector", e.target.checked)
              }
              style={{
                width: "20px",
                height: "20px",
                cursor: "pointer"
              }}
            />
            <span style={{ fontSize: "16px", color: "#2d3748" }}>Disable Garbage Collector</span>
          </label>
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            padding: "12px 16px",
            backgroundColor: "#f7fafc",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            border: "2px solid transparent"
          }}>
            <input
              type="checkbox"
              checked={options.hideSidebar || false}
              onChange={(e) => handleOptionChange("hideSidebar", e.target.checked)}
              style={{
                width: "20px",
                height: "20px",
                cursor: "pointer"
              }}
            />
            <span style={{ fontSize: "16px", color: "#2d3748" }}>Hide Sidebar</span>
          </label>
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            padding: "12px 16px",
            backgroundColor: "#f7fafc",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            border: "2px solid transparent"
          }}>
            <input
              type="checkbox"
              checked={options.hideCallMethod || false}
              onChange={(e) =>
                handleOptionChange("hideCallMethod", e.target.checked)
              }
              style={{
                width: "20px",
                height: "20px",
                cursor: "pointer"
              }}
            />
            <span style={{ fontSize: "16px", color: "#2d3748" }}>Hide Call Method</span>
          </label>
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            padding: "12px 16px",
            backgroundColor: "#f7fafc",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            border: "2px solid transparent"
          }}>
            <input
              type="checkbox"
              checked={options.hideDeclareGlobalVariable || false}
              onChange={(e) =>
                handleOptionChange("hideDeclareGlobalVariable", e.target.checked)
              }
              style={{
                width: "20px",
                height: "20px",
                cursor: "pointer"
              }}
            />
            <span style={{ fontSize: "16px", color: "#2d3748" }}>Hide Declare Global Variable</span>
          </label>
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            padding: "12px 16px",
            backgroundColor: "#f7fafc",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            border: "2px solid transparent"
          }}>
            <input
              type="checkbox"
              checked={options.hideNewArray || false}
              onChange={(e) =>
                handleOptionChange("hideNewArray", e.target.checked)
              }
              style={{
                width: "20px",
                height: "20px",
                cursor: "pointer"
              }}
            />
            <span style={{ fontSize: "16px", color: "#2d3748" }}>Hide New Array</span>
          </label>
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            padding: "12px 16px",
            backgroundColor: "#f7fafc",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            border: "2px solid transparent"
          }}>
            <input
              type="checkbox"
              checked={options.createNewOnEdgeDrop || false}
              onChange={(e) =>
                handleOptionChange("createNewOnEdgeDrop", e.target.checked)
              }
              style={{
                width: "20px",
                height: "20px",
                cursor: "pointer"
              }}
            />
            <span style={{ fontSize: "16px", color: "#2d3748" }}>Create New On Edge Drop</span>
          </label>
        </div>
      </div>

      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "32px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ 
            margin: "0", 
            color: "#2d3748",
            fontSize: "24px",
            fontWeight: "600",
            borderBottom: "3px solid #48bb78",
            paddingBottom: "12px"
          }}>📦 Classes</h2>
          <button 
            onClick={handleAddKlass}
            style={{
              background: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
              color: "white",
              padding: "10px 20px",
              fontSize: "15px",
              fontWeight: "600",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 4px rgba(72, 187, 120, 0.3)"
            }}
          >➕ Add Class</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {Object.entries(klasses).map(([klassName, klass]) => (
            <div
              key={klassName}
              style={{
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                padding: "24px",
                backgroundColor: "#ffffff",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                transition: "all 0.3s ease"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                  paddingBottom: "16px",
                  borderBottom: "2px solid #edf2f7"
                }}
              >
                <h3 style={{ 
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#2d3748",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span style={{
                    backgroundColor: "#667eea",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    fontSize: "16px"
                  }}>{klassName}</span>
                </h3>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    onClick={() => handleAddAttribute(klassName)}
                    style={{
                      background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                      color: "white",
                      padding: "8px 16px",
                      fontSize: "14px",
                      fontWeight: "600",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 4px rgba(79, 172, 254, 0.3)"
                    }}
                  >
                    ➕ Add Attribute
                  </button>
                  <button 
                    onClick={() => handleRemoveKlass(klassName)}
                    style={{
                      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                      color: "white",
                      padding: "8px 16px",
                      fontSize: "14px",
                      fontWeight: "600",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 4px rgba(245, 87, 108, 0.3)"
                    }}
                  >
                    🗑️ Delete Class
                  </button>
                </div>
              </div>

              <div>
                {Object.keys(klass.attributes).length === 0 ? (
                  <p style={{ 
                    color: "#a0aec0", 
                    fontStyle: "italic",
                    textAlign: "center",
                    padding: "20px",
                    backgroundColor: "#f7fafc",
                    borderRadius: "8px",
                    margin: 0
                  }}>
                    No attributes defined yet
                  </p>
                ) : (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "separate",
                      borderSpacing: 0,
                      backgroundColor: "#f7fafc",
                      borderRadius: "8px",
                      overflow: "hidden"
                    }}
                  >
                    <thead>
                      <tr style={{ 
                        backgroundColor: "#edf2f7"
                      }}>
                        <th style={{ 
                          padding: "12px 16px", 
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#2d3748",
                          fontSize: "14px"
                        }}>
                          Attribute Name
                        </th>
                        <th style={{ 
                          padding: "12px 16px", 
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#2d3748",
                          fontSize: "14px"
                        }}>
                          Data Type
                        </th>
                        <th style={{ 
                          padding: "12px 16px", 
                          textAlign: "right",
                          fontWeight: "600",
                          color: "#2d3748",
                          fontSize: "14px"
                        }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(klass.attributes).map(
                        ([attrName, dataType]) => (
                          <tr
                            key={attrName}
                            style={{ 
                              borderBottom: "1px solid #e2e8f0",
                              backgroundColor: "white",
                              transition: "background-color 0.2s ease"
                            }}
                          >
                            <td style={{ 
                              padding: "12px 16px",
                              color: "#4a5568",
                              fontWeight: "500"
                            }}>{attrName}</td>
                            <td style={{ 
                              padding: "12px 16px",
                              color: "#667eea",
                              fontWeight: "600"
                            }}>{dataType}</td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "right",
                              }}
                            >
                              <button
                                onClick={() =>
                                  handleEditAttribute(
                                    klassName,
                                    attrName,
                                    dataType
                                  )
                                }
                                style={{ 
                                  marginRight: "8px",
                                  background: "linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)",
                                  color: "#2d3748",
                                  padding: "6px 12px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  transition: "all 0.3s ease",
                                  boxShadow: "0 2px 4px rgba(253, 203, 110, 0.3)"
                                }}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleRemoveAttribute(klassName, attrName)
                                }
                                style={{
                                  background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)",
                                  color: "white",
                                  padding: "6px 12px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  transition: "all 0.3s ease",
                                  boxShadow: "0 2px 4px rgba(255, 107, 107, 0.3)"
                                }}
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Attribute Modal */}
      {addingAttribute && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)"
          }}
          onClick={handleCancelAddAttribute}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "32px",
              borderRadius: "16px",
              minWidth: "480px",
              maxWidth: "90vw",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              animation: "slideIn 0.3s ease"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              margin: "0 0 24px 0",
              fontSize: "24px",
              fontWeight: "700",
              color: "#1a202c",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              ➕ Add Attribute to 
              <span style={{
                color: "#667eea",
                backgroundColor: "#eef2ff",
                padding: "4px 12px",
                borderRadius: "6px"
              }}>{addingAttribute}</span>
            </h3>
            <div style={{ marginTop: "20px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#4a5568"
              }}>
                Attribute Name:
              </label>
              <input
                type="text"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "2px solid #e2e8f0",
                  fontSize: "16px",
                  transition: "border-color 0.2s ease",
                  boxSizing: "border-box"
                }}
                placeholder="Enter attribute name"
                autoFocus
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>
            <div style={{ marginTop: "20px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#4a5568"
              }}>
                Data Type:
              </label>
              <select
                value={newAttrType}
                onChange={(e) => setNewAttrType(e.target.value as DataType)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "2px solid #e2e8f0",
                  fontSize: "16px",
                  backgroundColor: "white",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              >
                {availableDataTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{ 
                marginTop: "28px", 
                display: "flex", 
                gap: "12px",
                justifyContent: "flex-end"
              }}
            >
              <button 
                onClick={handleCancelAddAttribute}
                style={{
                  background: "#e2e8f0",
                  color: "#4a5568",
                  padding: "10px 24px",
                  fontSize: "15px",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >Cancel</button>
              <button 
                onClick={handleConfirmAddAttribute}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  padding: "10px 24px",
                  fontSize: "15px",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 6px rgba(102, 126, 234, 0.3)"
                }}
              >Add Attribute</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Attribute Modal */}
      {editingAttribute && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)"
          }}
          onClick={handleCancelEditAttribute}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "32px",
              borderRadius: "16px",
              minWidth: "480px",
              maxWidth: "90vw",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              animation: "slideIn 0.3s ease"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              margin: "0 0 24px 0",
              fontSize: "24px",
              fontWeight: "700",
              color: "#1a202c",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              ✏️ Edit Attribute: 
              <span style={{
                color: "#667eea",
                backgroundColor: "#eef2ff",
                padding: "4px 12px",
                borderRadius: "6px"
              }}>{editingAttribute.attrName}</span>
            </h3>
            <div style={{ marginTop: "20px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#4a5568"
              }}>
                Data Type:
              </label>
              <select
                value={newAttrType}
                onChange={(e) => setNewAttrType(e.target.value as DataType)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "2px solid #e2e8f0",
                  fontSize: "16px",
                  backgroundColor: "white",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              >
                {availableDataTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{ 
                marginTop: "28px", 
                display: "flex", 
                gap: "12px",
                justifyContent: "flex-end"
              }}
            >
              <button 
                onClick={handleCancelEditAttribute}
                style={{
                  background: "#e2e8f0",
                  color: "#4a5568",
                  padding: "10px 24px",
                  fontSize: "15px",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >Cancel</button>
              <button 
                onClick={handleConfirmEditAttribute}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  padding: "10px 24px",
                  fontSize: "15px",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 6px rgba(102, 126, 234, 0.3)"
                }}
              >Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
