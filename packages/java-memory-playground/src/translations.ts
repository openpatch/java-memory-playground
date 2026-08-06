// Translations for the Java Memory Playground

export interface Translations {
  // Toolbar
  save: string;
  saveUrl: string;
  downloadPng: string;
  downloadAllPng: string;
  downloadAllPngHint: string;
  config: string;
  runGarbageCollector: string;
  predictGarbage: string;
  predictGarbageHint: (marked: number) => string;
  checkAndCollect: string;
  gcScore: (found: number, missed: number, wrong: number) => string;
  undo: string;
  redo: string;

  // Sidebar
  newInstanceOf: (klass: string) => string;
  newArray: string;
  callMethod: string;
  declareGlobalVariable: string;

  // Steps
  previousStep: string;
  nextStep: string;
  addStep: string;
  addStepHint: string;
  deleteStep: string;
  stepLabel: string;
  stepLabelPlaceholder: string;
  exerciseStep: string;
  exerciseStepHint: string;
  yourTurn: string;
  checkAnswer: string;
  showSolution: string;
  exerciseCorrect: string;
  exerciseWrong: (wrong: string[]) => string;
  exerciseExtra: (extra: string[]) => string;

  // Nodes
  declareLocalVariable: string;
  returnMethod: string;
  returnOnlyTopOfStack: string;

  // Dialogs
  ok: string;
  cancel: string;
  createMethodCall: string;
  methodName: string;
  methodNamePlaceholder: string;
  createGlobalVariable: string;
  variableName: string;
  variableNamePlaceholder: string;
  createObject: (type: string) => string;
  objectName: string;
  createArray: string;
  arrayLength: string;
  arrayElementType: string;
  declareLocalVariableTitle: string;

  // Config view
  configuration: string;
  classes: string;
  addClass: string;
  className: string;
  classNamePlaceholder: string;
  attributes: string;
  addAttribute: string;
  attributeName: string;
  dataType: string;
  classSource: string;
  classList: string;
  classSourceHint: string;
  classSourcePlaceholder: string;
  options: string;
  presets: string;
  presetReferences: string;
  presetStack: string;
  presetEverything: string;
  backToDiagram: string;
  saved: string;
  unsavedChangesLeave: string;
  confirmDeleteClass: (name: string) => string;
  applyClassesTitle: string;
  applyClassesIntro: string;
  applyClassesDropped: (klass: string, field: string, count: number) => string;
  applyClassesOrphaned: (klass: string, count: number) => string;
  applyClassesMore: (count: number) => string;
  applyClassesConfirm: string;

  /**
   * React Flow's own accessible descriptions, which it ships in English only.
   * A German playground was reading them out in English next to its own
   * translated labels; they are handed back through `ariaLabelConfig`.
   */
  a11y: {
    node: string;
    nodeKeyboard: string;
    nodeMoved: (direction: string, x: number, y: number) => string;
    edge: string;
    controls: string;
    zoomIn: string;
    zoomOut: string;
    fitView: string;
    toggleInteractivity: string;
    handle: string;
  };

  // Option labels
  optionLabels: {
    hideSidebar: string;
    hideCallMethod: string;
    hideDeclareGlobalVariable: string;
    hideNewArray: string;
    disableGarbageCollector: string;
    createNewOnEdgeDrop: string;
    inlineStrings: string;
    hideSteps: string;
    hideStepChanges: string;
    gcPrediction: string;
  };
}

const en: Translations = {
  save: "Save",
  saveUrl: "Save (URL)",
  downloadPng: "Download (PNG)",
  downloadAllPng: "Download all steps",
  downloadAllPngHint: "One image with every step, for a worksheet",
  config: "Config",
  runGarbageCollector: "Run Garbage Collector",
  predictGarbage: "Predict garbage",
  predictGarbageHint: (marked) =>
    `Click the objects you think are unreachable (${marked} marked)`,
  checkAndCollect: "Check and collect",
  gcScore: (found, missed, wrong) =>
    `Found ${found}${missed ? `, missed ${missed}` : ""}${
      wrong ? `, ${wrong} still reachable` : ""
    }`,
  undo: "Undo",
  redo: "Redo",

  newInstanceOf: (klass) => `new ${klass}`,
  newArray: "new Array",
  callMethod: "Call Method",
  declareGlobalVariable: "Declare Global Variable",

  previousStep: "Previous step",
  nextStep: "Next step",
  addStep: "Add step",
  addStepHint: "Duplicate this step and continue from it",
  deleteStep: "Delete step",
  stepLabel: "Step label",
  stepLabelPlaceholder: "What happens here?",
  exerciseStep: "Exercise",
  exerciseStepHint: "The student builds this step; its contents are the solution",
  yourTurn: "Your turn: build this step",
  checkAnswer: "Check",
  showSolution: "Show solution",
  exerciseCorrect: "That matches.",
  exerciseWrong: (wrong) => `Not right yet: ${wrong.join(", ")}`,
  exerciseExtra: (extra) => `Not part of this step: ${extra.join(", ")}`,

  declareLocalVariable: "Declare Local Variable",
  returnMethod: "Return",
  returnOnlyTopOfStack:
    "Only the method on top of the stack can return — the calls above it have to finish first",

  ok: "OK",
  cancel: "Cancel",
  createMethodCall: "Create Method Call",
  methodName: "Method Name",
  methodNamePlaceholder: "e.g. App.main",
  createGlobalVariable: "Create Global Variable",
  variableName: "Variable Name",
  variableNamePlaceholder: "Enter variable name",
  createObject: (type) => `Create ${type}`,
  objectName: "Name",
  createArray: "Create Array",
  arrayLength: "Length",
  arrayElementType: "Element Type",
  declareLocalVariableTitle: "Declare Local Variable",

  configuration: "Configuration",
  classes: "Classes",
  addClass: "Add Class",
  className: "Class Name",
  classNamePlaceholder: "e.g. Node",
  attributes: "Attributes",
  addAttribute: "Add Attribute",
  attributeName: "Attribute Name",
  dataType: "Data Type",
  classSource: "Java source",
  classList: "Class list",
  classSourceHint:
    "Paste the classes of your example. Only their structure is read — class names and the name and type of each field. Method bodies are ignored and nothing is executed.",
  classSourcePlaceholder: "class Node {\n    int value;\n    Node next;\n}",
  options: "Options",
  presets: "Presets",
  presetReferences: "References only",
  presetStack: "With the stack",
  presetEverything: "Everything",
  backToDiagram: "Back to Diagram",
  saved: "Saved",
  unsavedChangesLeave:
    "You have unsaved changes. Are you sure you want to leave?",
  confirmDeleteClass: (name) =>
    `Are you sure you want to delete class "${name}"?`,
  applyClassesTitle: "Apply these classes?",
  applyClassesIntro:
    "Classes belong to the whole diagram, so this reaches every step. Objects already drawn lose what these classes no longer have room for:",
  applyClassesDropped: (klass, field, count) =>
    `${klass}.${field} — deleted from ${count} object${count === 1 ? "" : "s"}`,
  applyClassesOrphaned: (klass, count) =>
    `${count} object${count === 1 ? "" : "s"} of ${klass} — the class is gone, so no new ones can be made`,
  applyClassesMore: (count) => `…and ${count} more`,
  applyClassesConfirm: "Apply",

  a11y: {
    node: "Press enter or space to select a node. Press delete to remove it and escape to cancel.",
    nodeKeyboard:
      "Press enter or space to select a node. You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.",
    nodeMoved: (direction, x, y) =>
      `Moved selected node ${direction}. New position, x: ${x}, y: ${y}`,
    edge: "Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.",
    controls: "Control Panel",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    fitView: "Fit the diagram to the view",
    toggleInteractivity: "Toggle interactivity",
    handle: "Reference",
  },

  optionLabels: {
    hideSidebar: "Hide sidebar",
    hideCallMethod: "Hide „Call Method“",
    hideDeclareGlobalVariable: "Hide „Declare Global Variable“",
    hideNewArray: "Hide „new Array“",
    disableGarbageCollector: "Disable garbage collector",
    createNewOnEdgeDrop: "Create a new object when an edge is dropped",
    inlineStrings: "Show String values inside their object",
    hideSteps: "Hide the step bar",
    hideStepChanges: "Do not mark what changed in a step",
    gcPrediction: "Ask which objects are garbage before collecting",
  },
};

const de: Translations = {
  save: "Speichern",
  saveUrl: "Speichern (URL)",
  downloadPng: "Herunterladen (PNG)",
  downloadAllPng: "Alle Schritte herunterladen",
  downloadAllPngHint: "Ein Bild mit allen Schritten, für ein Arbeitsblatt",
  config: "Einstellungen",
  runGarbageCollector: "Garbage Collector ausführen",
  predictGarbage: "Müll vorhersagen",
  predictGarbageHint: (marked) =>
    `Klicke die Objekte an, die deiner Meinung nach nicht mehr erreichbar sind (${marked} markiert)`,
  checkAndCollect: "Prüfen und aufräumen",
  gcScore: (found, missed, wrong) =>
    `${found} gefunden${missed ? `, ${missed} übersehen` : ""}${
      wrong ? `, ${wrong} noch erreichbar` : ""
    }`,
  undo: "Rückgängig",
  redo: "Wiederholen",

  newInstanceOf: (klass) => `neues ${klass}`,
  newArray: "neues Array",
  callMethod: "Methode aufrufen",
  declareGlobalVariable: "Globale Variable deklarieren",

  previousStep: "Vorheriger Schritt",
  nextStep: "Nächster Schritt",
  addStep: "Schritt hinzufügen",
  addStepHint: "Diesen Schritt kopieren und dort weitermachen",
  deleteStep: "Schritt löschen",
  stepLabel: "Beschriftung",
  stepLabelPlaceholder: "Was passiert hier?",
  exerciseStep: "Aufgabe",
  exerciseStepHint:
    "Diesen Schritt bauen die Schüler:innen selbst; der Inhalt ist die Lösung",
  yourTurn: "Du bist dran: baue diesen Schritt",
  checkAnswer: "Prüfen",
  showSolution: "Lösung zeigen",
  exerciseCorrect: "Das passt.",
  exerciseWrong: (wrong) => `Noch nicht richtig: ${wrong.join(", ")}`,
  exerciseExtra: (extra) => `Gehört nicht zu diesem Schritt: ${extra.join(", ")}`,

  declareLocalVariable: "Lokale Variable deklarieren",
  returnMethod: "Zurückkehren",
  returnOnlyTopOfStack:
    "Nur die oberste Methode auf dem Stapel kann zurückkehren — die Aufrufe darüber müssen zuerst beendet werden",

  ok: "OK",
  cancel: "Abbrechen",
  createMethodCall: "Methodenaufruf erstellen",
  methodName: "Methodenname",
  methodNamePlaceholder: "z. B. App.main",
  createGlobalVariable: "Globale Variable erstellen",
  variableName: "Variablenname",
  variableNamePlaceholder: "Variablennamen eingeben",
  createObject: (type) => `${type} erstellen`,
  objectName: "Name",
  createArray: "Array erstellen",
  arrayLength: "Länge",
  arrayElementType: "Elementtyp",
  declareLocalVariableTitle: "Lokale Variable deklarieren",

  configuration: "Einstellungen",
  classes: "Klassen",
  addClass: "Klasse hinzufügen",
  className: "Klassenname",
  classNamePlaceholder: "z. B. Node",
  attributes: "Attribute",
  addAttribute: "Attribut hinzufügen",
  attributeName: "Attributname",
  dataType: "Datentyp",
  classSource: "Java-Quelltext",
  classList: "Klassenliste",
  classSourceHint:
    "Füge die Klassen deines Beispiels ein. Gelesen wird nur ihre Struktur — die Klassennamen und Name und Typ jedes Attributs. Methodenrümpfe werden übersprungen, ausgeführt wird nichts.",
  classSourcePlaceholder: "class Node {\n    int value;\n    Node next;\n}",
  options: "Optionen",
  presets: "Voreinstellungen",
  presetReferences: "Nur Referenzen",
  presetStack: "Mit dem Stapel",
  presetEverything: "Alles",
  backToDiagram: "Zurück zum Diagramm",
  saved: "Gespeichert",
  unsavedChangesLeave:
    "Du hast ungespeicherte Änderungen. Möchtest du die Seite wirklich verlassen?",
  confirmDeleteClass: (name) =>
    `Möchtest du die Klasse „${name}“ wirklich löschen?`,
  applyClassesTitle: "Klassen übernehmen?",
  applyClassesIntro:
    "Klassen gehören zum ganzen Diagramm, das betrifft also jeden Schritt. Objekte, die es schon gibt, verlieren, wofür diese Klassen keinen Platz mehr haben:",
  applyClassesDropped: (klass, field, count) =>
    `${klass}.${field} — wird aus ${count} Objekt${count === 1 ? "" : "en"} gelöscht`,
  applyClassesOrphaned: (klass, count) =>
    `${count} Objekt${count === 1 ? "" : "e"} der Klasse ${klass} — die Klasse gibt es nicht mehr, es lassen sich keine neuen erstellen`,
  applyClassesMore: (count) => `…und ${count} weitere`,
  applyClassesConfirm: "Übernehmen",

  a11y: {
    node: "Drücke Enter oder Leertaste, um einen Knoten auszuwählen. Entf entfernt ihn, Esc bricht ab.",
    nodeKeyboard:
      "Drücke Enter oder Leertaste, um einen Knoten auszuwählen. Danach kannst du ihn mit den Pfeiltasten bewegen. Entf entfernt ihn, Esc bricht ab.",
    nodeMoved: (direction, x, y) =>
      `Ausgewählter Knoten nach ${direction} bewegt. Neue Position, x: ${x}, y: ${y}`,
    edge: "Drücke Enter oder Leertaste, um eine Referenz auszuwählen. Danach entfernt Entf sie, Esc bricht ab.",
    controls: "Steuerung",
    zoomIn: "Vergrößern",
    zoomOut: "Verkleinern",
    fitView: "Diagramm einpassen",
    toggleInteractivity: "Interaktivität umschalten",
    handle: "Referenz",
  },

  optionLabels: {
    hideSidebar: "Seitenleiste ausblenden",
    hideCallMethod: "„Methode aufrufen“ ausblenden",
    hideDeclareGlobalVariable: "„Globale Variable deklarieren“ ausblenden",
    hideNewArray: "„neues Array“ ausblenden",
    disableGarbageCollector: "Garbage Collector deaktivieren",
    createNewOnEdgeDrop: "Neues Objekt erstellen, wenn eine Kante abgelegt wird",
    inlineStrings: "String-Werte im Objekt anzeigen",
    hideSteps: "Schrittleiste ausblenden",
    hideStepChanges: "Änderungen eines Schritts nicht hervorheben",
    gcPrediction: "Vor dem Aufräumen fragen, welche Objekte Müll sind",
  },
};

export const translations: Record<string, Translations> = {
  en,
  de,
};

/**
 * Detects the user's browser language and returns a supported language code.
 * Falls back to 'en' if the browser language is not supported.
 */
export function detectBrowserLanguage(): string {
  if (typeof window === "undefined" || !window.navigator) {
    return "en";
  }

  // Get browser language (e.g., 'en-US', 'de-DE', 'de')
  const browserLang =
    window.navigator.language || (window.navigator as any).userLanguage;

  if (!browserLang) {
    return "en";
  }

  // Extract the base language code (e.g., 'en' from 'en-US')
  const baseLang = browserLang.split("-")[0].toLowerCase();

  if (translations[baseLang]) {
    return baseLang;
  }

  return "en";
}

export function getLanguage(explicitLanguage?: string): string {
  if (
    explicitLanguage &&
    explicitLanguage !== "auto" &&
    translations[explicitLanguage]
  ) {
    return explicitLanguage;
  }

  return detectBrowserLanguage();
}

export function getTranslations(language: string = "en"): Translations {
  return translations[language] || translations.en;
}
