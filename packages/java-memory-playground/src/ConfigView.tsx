import { useShallow } from "zustand/shallow";
import useStore from "./storeContext";
import { RFState } from "./store";
import { useCallback, useState, useEffect } from "react";
import { DataType, builtInDataTypes } from "./memory";
import { SimpleInputDialog } from "./SimpleInputDialog";
import { optionPresets } from "./presets";

const selector = (state: RFState) => ({
  storedKlasses: state.klasses,
  storedOptions: state.options,
  applyKlasses: state.applyKlasses,
  setRoute: state.setRoute,
  t: state.getTranslations(),
});

export const ConfigView = () => {
  const {
    storedKlasses,
    storedOptions,
    applyKlasses,
    setRoute,
    t,
  } = useStore(useShallow(selector));

  const [klasses, setKlasses] = useState(storedKlasses);
  const [options, setOptions] = useState(storedOptions);
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
  const [showAddClassDialog, setShowAddClassDialog] = useState(false);

  // Get available data types: primitives + Array + defined classes
  const availableDataTypes = [
    ...builtInDataTypes,
    "Array",
    ...Object.keys(klasses),
  ];

  // Track changes
  useEffect(() => {
    const klassesChanged = JSON.stringify(klasses) !== JSON.stringify(storedKlasses);
    const optionsChanged = JSON.stringify(options) !== JSON.stringify(storedOptions);
    setHasUnsavedChanges(klassesChanged || optionsChanged);
  }, [klasses, options, storedKlasses, storedOptions]);

  const onSave = useCallback(() => {
    // Class definitions belong to the whole diagram, so the store reconciles
    // every step's objects rather than only the one on screen.
    applyKlasses(klasses, options);
    setHasUnsavedChanges(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  }, [applyKlasses, klasses, options]);

  const onView = useCallback(() => {
    if (hasUnsavedChanges) {
      if (window.confirm(t.unsavedChangesLeave)) {
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
    setShowAddClassDialog(true);
  }, []);

  const handleAddKlassConfirm = useCallback((name: string) => {
    setKlasses((prev) => ({
      ...prev,
      [name]: {
        attributes: {},
      },
    }));
    setShowAddClassDialog(false);
  }, []);

  const handleRemoveKlass = useCallback((name: string) => {
    if (window.confirm(t.confirmDeleteClass(name))) {
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
        }}>{t.configuration}</h1>

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
          >{hasUnsavedChanges ? t.save : t.saved}</button>
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
          >{t.backToDiagram}</button>
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
        }}>{t.options}</h2>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "14px", color: "#374151" }}>{t.presets}:</span>
          {(
            [
              ["references", t.presetReferences],
              ["stack", t.presetStack],
              ["everything", t.presetEverything],
            ] as const
          ).map(([name, label]) => (
            <button key={name} onClick={() => setOptions({ ...optionPresets[name] })}>
              {label}
            </button>
          ))}
        </div>
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
            {t.optionLabels.disableGarbageCollector}
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
            {t.optionLabels.hideSidebar}
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
            {t.optionLabels.hideCallMethod}
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
            {t.optionLabels.hideDeclareGlobalVariable}
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
            {t.optionLabels.hideNewArray}
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
            {t.optionLabels.createNewOnEdgeDrop}
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
              checked={options.inlineStrings ?? true}
              onChange={(e) =>
                handleOptionChange("inlineStrings", e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            {t.optionLabels.inlineStrings}
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
              checked={options.hideStepChanges || false}
              onChange={(e) =>
                handleOptionChange("hideStepChanges", e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            {t.optionLabels.hideStepChanges}
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
              checked={options.gcPrediction || false}
              onChange={(e) =>
                handleOptionChange("gcPrediction", e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            {t.optionLabels.gcPrediction}
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
          }}>{t.classes}</h2>
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
          >{t.addClass}</button>
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
                          {t.attributeName}
                        </th>
                        <th style={{
                          padding: "10px 12px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#374151",
                          fontSize: "13px"
                        }}>
                          {t.dataType}
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
                {t.attributeName}
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
                placeholder={t.attributeName}
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
                {t.dataType}
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
              >{t.cancel}</button>
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
              >{t.addAttribute}</button>
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
                {t.dataType}
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
              >{t.cancel}</button>
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
              >{t.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Class Dialog */}
      {showAddClassDialog && (
        <SimpleInputDialog
          title={t.addClass}
          label={t.className}
          placeholder={t.classNamePlaceholder}
          onConfirm={handleAddKlassConfirm}
          onCancel={() => setShowAddClassDialog(false)}
        />
      )}
    </div>
  );
};
