import { shallow } from "zustand/shallow";
import useStore, { RFState } from "./store";
import { useCallback, useState, useEffect } from "react";
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Get available data types: primitives + Array + defined classes
  const availableDataTypes = [
    ...primitveDataTypes,
    "Array",
    ...Object.keys(klasses),
  ];

  // Track changes
  useEffect(() => {
    const klassesChanged = JSON.stringify(klasses) !== JSON.stringify(memory.klasses);
    const optionsChanged = JSON.stringify(options) !== JSON.stringify(memory.options);
    setHasUnsavedChanges(klassesChanged || optionsChanged);
  }, [klasses, options, memory.klasses, memory.options]);

  const onSave = useCallback(() => {
    updateMemory({
      ...memory,
      klasses,
      options,
    });
    setHasUnsavedChanges(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  }, [memory, klasses, options, updateMemory]);

  const onView = useCallback(() => {
    if (hasUnsavedChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        setRoute("view");
      }
    } else {
      setRoute("view");
    }
  }, [setRoute, hasUnsavedChanges]);

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
      padding: "24px", 
      maxWidth: "1200px", 
      margin: "0 auto",
      minHeight: "100vh",
      backgroundColor: "#fafafa"
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "24px",
        border: "1px solid #e5e7eb",
        marginBottom: "16px"
      }}>
        <h1 style={{ 
          margin: "0 0 16px 0", 
          color: "#111827",
          fontSize: "24px",
          fontWeight: "600"
        }}>Configuration</h1>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button 
            onClick={onSave}
            style={{
              backgroundColor: hasUnsavedChanges ? "#111827" : "#6b7280",
              color: "white",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >{hasUnsavedChanges ? "Save" : "Saved"}</button>
          <button 
            onClick={onView}
            style={{
              backgroundColor: "white",
              color: "#111827",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >View</button>
          {showSaveSuccess && (
            <span style={{ 
              color: "#10b981", 
              fontSize: "14px",
              fontWeight: "500"
            }}>
              ✓ Changes saved successfully
            </span>
          )}
        </div>
      </div>

      <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "24px",
        border: "1px solid #e5e7eb",
        marginBottom: "16px"
      }}>
        <h2 style={{ 
          margin: "0 0 16px 0", 
          color: "#111827",
          fontSize: "18px",
          fontWeight: "600"
        }}>Options</h2>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "12px" 
        }}>
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            fontSize: "14px",
            color: "#374151",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={options.disableGarbageCollector || false}
              onChange={(e) =>
                handleOptionChange("disableGarbageCollector", e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            Disable Garbage Collector
          </label>
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            fontSize: "14px",
            color: "#374151",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={options.hideSidebar || false}
              onChange={(e) => handleOptionChange("hideSidebar", e.target.checked)}
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            Hide Sidebar
          </label>
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            fontSize: "14px",
            color: "#374151",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={options.hideCallMethod || false}
              onChange={(e) =>
                handleOptionChange("hideCallMethod", e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            Hide Call Method
          </label>
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            fontSize: "14px",
            color: "#374151",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={options.hideDeclareGlobalVariable || false}
              onChange={(e) =>
                handleOptionChange("hideDeclareGlobalVariable", e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            Hide Declare Global Variable
          </label>
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            fontSize: "14px",
            color: "#374151",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={options.hideNewArray || false}
              onChange={(e) =>
                handleOptionChange("hideNewArray", e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            Hide New Array
          </label>
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            fontSize: "14px",
            color: "#374151",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={options.createNewOnEdgeDrop || false}
              onChange={(e) =>
                handleOptionChange("createNewOnEdgeDrop", e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            Create New On Edge Drop
          </label>
        </div>
      </div>

      <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "24px",
        border: "1px solid #e5e7eb"
      }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ 
            margin: "0", 
            color: "#111827",
            fontSize: "18px",
            fontWeight: "600"
          }}>Classes</h2>
          <button 
            onClick={handleAddKlass}
            style={{
              backgroundColor: "#111827",
              color: "white",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >Add Class</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {Object.entries(klasses).map(([klassName, klass]) => (
            <div
              key={klassName}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "16px",
                backgroundColor: "#fafafa"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid #e5e7eb"
                }}
              >
                <h3 style={{ 
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#111827"
                }}>
                  {klassName}
                </h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    onClick={() => handleAddAttribute(klassName)}
                    style={{
                      backgroundColor: "white",
                      color: "#111827",
                      padding: "6px 12px",
                      fontSize: "13px",
                      fontWeight: "500",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    Add Attribute
                  </button>
                  <button 
                    onClick={() => handleRemoveKlass(klassName)}
                    style={{
                      backgroundColor: "white",
                      color: "#dc2626",
                      padding: "6px 12px",
                      fontSize: "13px",
                      fontWeight: "500",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div>
                {Object.keys(klass.attributes).length === 0 ? (
                  <p style={{ 
                    color: "#6b7280", 
                    fontStyle: "italic",
                    textAlign: "center",
                    padding: "16px",
                    margin: 0,
                    fontSize: "14px"
                  }}>
                    No attributes defined
                  </p>
                ) : (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      backgroundColor: "white",
                      borderRadius: "6px",
                      overflow: "hidden",
                      border: "1px solid #e5e7eb"
                    }}
                  >
                    <thead>
                      <tr style={{ 
                        backgroundColor: "#f9fafb",
                        borderBottom: "1px solid #e5e7eb"
                      }}>
                        <th style={{ 
                          padding: "10px 12px", 
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#374151",
                          fontSize: "13px"
                        }}>
                          Attribute Name
                        </th>
                        <th style={{ 
                          padding: "10px 12px", 
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#374151",
                          fontSize: "13px"
                        }}>
                          Data Type
                        </th>
                        <th style={{ 
                          padding: "10px 12px", 
                          textAlign: "right",
                          fontWeight: "600",
                          color: "#374151",
                          fontSize: "13px"
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
                              borderBottom: "1px solid #e5e7eb"
                            }}
                          >
                            <td style={{ 
                              padding: "10px 12px",
                              color: "#111827",
                              fontSize: "14px"
                            }}>{attrName}</td>
                            <td style={{ 
                              padding: "10px 12px",
                              color: "#6b7280",
                              fontSize: "14px"
                            }}>{dataType}</td>
                            <td
                              style={{
                                padding: "10px 12px",
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
                                  backgroundColor: "white",
                                  color: "#111827",
                                  padding: "4px 10px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  border: "1px solid #d1d5db",
                                  borderRadius: "4px",
                                  cursor: "pointer"
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleRemoveAttribute(klassName, attrName)
                                }
                                style={{
                                  backgroundColor: "white",
                                  color: "#dc2626",
                                  padding: "4px 10px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  border: "1px solid #fecaca",
                                  borderRadius: "4px",
                                  cursor: "pointer"
                                }}
                              >
                                Delete
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
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={handleCancelAddAttribute}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              minWidth: "400px",
              maxWidth: "90vw",
              border: "1px solid #e5e7eb"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "#111827"
            }}>
              Add Attribute to {addingAttribute}
            </h3>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151"
              }}>
                Attribute Name
              </label>
              <input
                type="text"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
                placeholder="Enter attribute name"
                autoFocus
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151"
              }}>
                Data Type
              </label>
              <select
                value={newAttrType}
                onChange={(e) => setNewAttrType(e.target.value as DataType)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  backgroundColor: "white",
                  cursor: "pointer",
                  boxSizing: "border-box"
                }}
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
                display: "flex", 
                gap: "8px",
                justifyContent: "flex-end"
              }}
            >
              <button 
                onClick={handleCancelAddAttribute}
                style={{
                  backgroundColor: "white",
                  color: "#374151",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >Cancel</button>
              <button 
                onClick={handleConfirmAddAttribute}
                style={{
                  backgroundColor: "#111827",
                  color: "white",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >Add</button>
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
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={handleCancelEditAttribute}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              minWidth: "400px",
              maxWidth: "90vw",
              border: "1px solid #e5e7eb"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "#111827"
            }}>
              Edit Attribute: {editingAttribute.attrName}
            </h3>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151"
              }}>
                Data Type
              </label>
              <select
                value={newAttrType}
                onChange={(e) => setNewAttrType(e.target.value as DataType)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  backgroundColor: "white",
                  cursor: "pointer",
                  boxSizing: "border-box"
                }}
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
                display: "flex", 
                gap: "8px",
                justifyContent: "flex-end"
              }}
            >
              <button 
                onClick={handleCancelEditAttribute}
                style={{
                  backgroundColor: "white",
                  color: "#374151",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >Cancel</button>
              <button 
                onClick={handleConfirmEditAttribute}
                style={{
                  backgroundColor: "#111827",
                  color: "white",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
