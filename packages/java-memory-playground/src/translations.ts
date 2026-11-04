// Translations for the Java Memory Playground

export interface Translations {
  // Toolbar
  save: string;
  saveUrl: string;
  downloadPng: string;
  downloadAllPng: string;
  downloadAllPngHint: string;
  printMode: string;
  printModeHint: string;
  config: string;
  runGarbageCollector: string;
  predictGarbage: string;
  predictGarbageHint: (marked: number) => string;
  checkAndCollect: string;
  gcScore: (found: number, missed: number, wrong: number) => string;
  undo: string;
  redo: string;
  help: string;

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
  stepNote: string;
  stepNotePlaceholder: string;
  showHint: string;
  hideHint: string;
  exerciseStep: string;
  exerciseStepHint: string;
  yourTurn: string;
  exerciseBadge: string;
  checkAnswer: string;
  showSolution: string;
  exerciseCorrect: string;
  exerciseWrong: (wrong: string[]) => string;
  exerciseExtra: (extra: string[]) => string;
  /** A path inside a frame, e.g. `node.next (in List.add)`. */
  checkInFrame: (path: string, frame: string) => string;
  checkMissing: (path: string) => string;
  checkExpectedNull: (path: string) => string;
  checkExpectedObject: (path: string) => string;
  checkValue: (path: string, expected: string, found: string) => string;
  checkKlass: (path: string, expected: string, found: string) => string;
  checkSameAs: (path: string, other: string) => string;
  checkDistinctFrom: (path: string, other: string) => string;
  checkExtraRoot: (path: string) => string;
  checkStack: (expected: string[], found: string[]) => string;
  checkMore: (count: number) => string;
  checkSettings: string;
  checkSettingsHint: string;
  checkRoots: string;
  checkRootsHint: string;
  checkNoRoots: string;
  checkExtraRoots: string;
  checkExtraRootsAllow: string;
  checkExtraRootsForbid: string;
  checkStringIdentity: string;
  checkStringIdentityHint: string;
  statements: string;
  statementsPlaceholder: string;
  statementsHint: string;
  runStatement: (statement: string) => string;
  statementLog: string;
  resetStatements: string;
  resetStatementsHint: string;
  statementMalformed: string;
  statementUnknownName: (name: string) => string;
  statementNullDereference: (path: string) => string;
  statementUnknownAttribute: (name: string, klass: string) => string;
  statementNotAReference: (path: string) => string;
  stepOverview: string;
  /** "Step 2 of 5", beside the dots. */
  stepCounter: (step: number, total: number) => string;
  stepKind: string;
  stepKindTrace: string;
  stepKindTraceHint: string;
  stepKindExercise: string;
  exerciseNotFirst: string;
  stepTitle: string;
  stepTask: string;
  stepTitlePlaceholder: string;
  stepTaskPlaceholder: string;
  stepDetailsShow: string;
  stepDetailsHide: string;
  checkVerdictWrong: string;
  paletteHeading: string;
  /** The button that opens the toolbar's menu in the compact layout. */
  menu: string;
  /** The button that shows the palette in the compact layout. */
  showPalette: string;
  hidePalette: string;
  stepStatusNone: (step: number) => string;
  stepStatusUntried: (step: number) => string;
  stepStatusCorrect: (step: number) => string;
  stepStatusWrong: (step: number) => string;

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
    hideUndoRedo: string;
    hideDownloadPng: string;
    hideDownloadAllPng: string;
    hidePrintMode: string;
    hideHelp: string;
    hideSave: string;
  };
  toolbarOptions: string;
}

const en: Translations = {
  save: "Save",
  saveUrl: "Save (URL)",
  downloadPng: "Download (PNG)",
  downloadAllPng: "Download all steps",
  downloadAllPngHint: "One image with every step, for a worksheet",
  printMode: "B&W",
  printModeHint:
    "Black and white, for printing. A frame is grey and the heap is white; " +
    "garbage is dotted and what a step changed is dashed.",
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
  help: "Help",

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
  stepNote: "Step hint",
  stepNotePlaceholder: "A hint, for when they get stuck",
  showHint: "Hint",
  hideHint: "Hide hint",
  exerciseStep: "Exercise",
  exerciseStepHint: "The student builds this step; its contents are the solution",
  yourTurn: "Your turn: build this step",
  exerciseBadge: "Exercise",
  checkAnswer: "Check",
  showSolution: "Show solution",
  exerciseCorrect: "That matches.",
  exerciseWrong: (wrong) => `Not right yet: ${wrong.join(", ")}`,
  exerciseExtra: (extra) => `Not part of this step: ${extra.join(", ")}`,
  checkInFrame: (path, frame) => `${path} (in ${frame})`,
  checkMissing: (path) => `${path} does not exist yet`,
  checkExpectedNull: (path) => `${path} should be null`,
  checkExpectedObject: (path) => `${path} should refer to an object, not null`,
  checkValue: (path, expected, found) => `${path} should be ${expected}, not ${found}`,
  checkKlass: (path, expected, found) =>
    `${path} should be a ${expected}, not a ${found}`,
  checkSameAs: (path, other) =>
    `${path} should refer to the same object as ${other}`,
  checkDistinctFrom: (path, other) =>
    `${path} should refer to an object of its own, not the one ${other} refers to`,
  checkExtraRoot: (path) => `${path} is not part of this step`,
  checkStack: (expected, found) =>
    `The call stack should be ${expected.join(" → ") || "empty"}, not ${
      found.join(" → ") || "empty"
    }`,
  checkMore: (count) => `and ${count} more`,
  checkSettings: "Check settings",
  checkSettingsHint: "Choose what checking this exercise looks at",
  checkRoots: "Checked",
  checkRootsHint:
    "Unticked variables are not checked; anything the student builds there is fine",
  checkNoRoots: "This step has no variables yet",
  checkExtraRoots: "Other variables",
  checkExtraRootsAllow: "allowed (e.g. a temporary variable)",
  checkExtraRootsForbid: "not allowed",
  checkStringIdentity: "Strings by identity (==)",
  checkStringIdentityHint:
    "Two Strings with the same characters only match when they are the same object",
  statements: "Statements",
  statementsPlaceholder: "neu.next = current.next; current.next = neu",
  statementsHint:
    "Lines the reader can run in any order, separated by semicolons",
  runStatement: (statement) => `Run ${statement}`,
  statementLog: "What you ran",
  resetStatements: "Start over",
  resetStatementsHint: "Put the diagram back to before the first line ran",
  statementMalformed: "That is not an assignment.",
  statementUnknownName: (name) => `There is no ${name} here.`,
  statementNullDereference: (path) =>
    `${path} is null — reading through it would throw a NullPointerException.`,
  statementUnknownAttribute: (name, klass) => `${klass} has no ${name}.`,
  statementNotAReference: (path) =>
    `${path} holds a value, not a reference.`,
  stepOverview: "Steps",
  stepCounter: (step, total) => `Step ${step} of ${total}`,
  stepKind: "Type",
  stepKindTrace: "Step",
  stepKindTraceHint: "The reader looks at this step",
  stepKindExercise: "Exercise",
  exerciseNotFirst: "The first step is where an exercise starts from, so it cannot be one",
  stepTitle: "Title",
  stepTask: "Task",
  stepTitlePlaceholder: "What happens here, e.g. head = head.next;",
  stepTaskPlaceholder: "What to build, e.g. insert a node at the head",
  stepDetailsShow: "Show step details",
  stepDetailsHide: "Hide step details",
  checkVerdictWrong: "Not right yet",
  paletteHeading: "Add",
  menu: "Menu",
  showPalette: "Show what can be added",
  hidePalette: "Hide what can be added",
  stepStatusNone: (step) => `Step ${step}: nothing to do`,
  stepStatusUntried: (step) => `Step ${step}: not checked yet`,
  stepStatusCorrect: (step) => `Step ${step}: correct`,
  stepStatusWrong: (step) => `Step ${step}: not right yet`,

  declareLocalVariable: "Declare Local Variable",
  returnMethod: "return",
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
    hideUndoRedo: "Hide undo and redo",
    hideDownloadPng: "Hide „Download (PNG)“",
    hideDownloadAllPng: "Hide „Download all steps“",
    hidePrintMode: "Hide „B&W“",
    hideHelp: "Hide the help link (?)",
    hideSave: "Hide „Save“",
  },
  toolbarOptions: "Toolbar",
};

const de: Translations = {
  save: "Speichern",
  saveUrl: "Speichern (URL)",
  downloadPng: "Herunterladen (PNG)",
  downloadAllPng: "Alle Schritte herunterladen",
  downloadAllPngHint: "Ein Bild mit allen Schritten, für ein Arbeitsblatt",
  printMode: "S/W",
  printModeHint:
    "Schwarz-weiß, zum Drucken. Ein Rahmen ist grau und der Heap weiß; " +
    "Müll ist gepunktet, was ein Schritt geändert hat gestrichelt.",
  config: "Einstellungen",
  runGarbageCollector: "Garbage Collector ausführen",
  // Paired with "Garbage Collector ausführen" right above it: the two buttons
  // are the same act, once predicted and once carried out, and "Müll" named
  // something the rest of the interface never mentions.
  predictGarbage: "Garbage Collector vorhersagen",
  predictGarbageHint: (marked) =>
    `Klicke die Objekte an, die deiner Meinung nach nicht mehr erreichbar sind (${marked} markiert)`,
  checkAndCollect: "Prüfen und aufräumen",
  gcScore: (found, missed, wrong) =>
    `${found} gefunden${missed ? `, ${missed} übersehen` : ""}${
      wrong ? `, ${wrong} noch erreichbar` : ""
    }`,
  undo: "Rückgängig",
  redo: "Wiederholen",
  help: "Hilfe",

  // Java, not German: the palette item makes the thing the source makes, and
  // "neues List" was neither a class name nor a sentence. The English side has
  // read this way all along.
  newInstanceOf: (klass) => `new ${klass}`,
  newArray: "new Array",
  callMethod: "Methode aufrufen",
  declareGlobalVariable: "Globale Variable deklarieren",

  previousStep: "Vorheriger Schritt",
  nextStep: "Nächster Schritt",
  addStep: "Schritt hinzufügen",
  addStepHint: "Diesen Schritt kopieren und dort weitermachen",
  deleteStep: "Schritt löschen",
  stepLabel: "Beschriftung",
  stepLabelPlaceholder: "Was passiert hier?",
  stepNote: "Tipp zum Schritt",
  stepNotePlaceholder: "Ein Tipp, falls es hakt",
  showHint: "Tipp",
  hideHint: "Tipp ausblenden",
  exerciseStep: "Aufgabe",
  exerciseStepHint:
    "Diesen Schritt bauen die Schüler:innen selbst; der Inhalt ist die Lösung",
  yourTurn: "Du bist dran: baue diesen Schritt",
  exerciseBadge: "Aufgabe",
  checkAnswer: "Prüfen",
  showSolution: "Lösung zeigen",
  exerciseCorrect: "Das passt.",
  exerciseWrong: (wrong) => `Noch nicht richtig: ${wrong.join(", ")}`,
  exerciseExtra: (extra) => `Gehört nicht zu diesem Schritt: ${extra.join(", ")}`,
  checkInFrame: (path, frame) => `${path} (in ${frame})`,
  checkMissing: (path) => `${path} gibt es noch nicht`,
  checkExpectedNull: (path) => `${path} sollte null sein`,
  checkExpectedObject: (path) => `${path} sollte auf ein Objekt zeigen, nicht null sein`,
  checkValue: (path, expected, found) =>
    `${path} sollte ${expected} sein, nicht ${found}`,
  checkKlass: (path, expected, found) =>
    `${path} sollte ein ${expected} sein, kein ${found}`,
  checkSameAs: (path, other) =>
    `${path} sollte auf dasselbe Objekt zeigen wie ${other}`,
  checkDistinctFrom: (path, other) =>
    `${path} sollte auf ein eigenes Objekt zeigen, nicht auf das von ${other}`,
  checkExtraRoot: (path) => `${path} gehört nicht zu diesem Schritt`,
  checkStack: (expected, found) =>
    `Der Aufrufstapel sollte ${expected.join(" → ") || "leer"} sein, nicht ${
      found.join(" → ") || "leer"
    }`,
  checkMore: (count) => `und ${count} weitere`,
  checkSettings: "Prüfung",
  checkSettingsHint: "Festlegen, worauf die Prüfung dieser Aufgabe achtet",
  checkRoots: "Geprüft",
  checkRootsHint:
    "Nicht angehakte Variablen werden nicht geprüft; dort ist alles erlaubt",
  checkNoRoots: "Dieser Schritt hat noch keine Variablen",
  checkExtraRoots: "Weitere Variablen",
  checkExtraRootsAllow: "erlaubt (z. B. eine Hilfsvariable)",
  checkExtraRootsForbid: "nicht erlaubt",
  checkStringIdentity: "Strings nach Identität (==)",
  checkStringIdentityHint:
    "Zwei Strings mit denselben Zeichen passen nur, wenn sie dasselbe Objekt sind",
  statements: "Anweisungen",
  statementsPlaceholder: "neu.next = current.next; current.next = neu",
  statementsHint:
    "Zeilen, die in selbst gewählter Reihenfolge ausgeführt werden, mit Semikolon getrennt",
  runStatement: (statement) => `${statement} ausführen`,
  statementLog: "Ausgeführt",
  resetStatements: "Von vorn",
  resetStatementsHint:
    "Das Diagramm auf den Stand vor der ersten Zeile zurücksetzen",
  statementMalformed: "Das ist keine Zuweisung.",
  statementUnknownName: (name) => `${name} gibt es hier nicht.`,
  statementNullDereference: (path) =>
    `${path} ist null — der Zugriff darüber löst eine NullPointerException aus.`,
  statementUnknownAttribute: (name, klass) => `${klass} hat kein ${name}.`,
  statementNotAReference: (path) =>
    `${path} enthält einen Wert, keine Referenz.`,
  stepOverview: "Schritte",
  stepCounter: (step, total) => `Schritt ${step} von ${total}`,
  stepKind: "Art",
  stepKindTrace: "Schritt",
  stepKindTraceHint: "Dieser Schritt wird angeschaut",
  stepKindExercise: "Aufgabe",
  exerciseNotFirst: "Vom ersten Schritt geht eine Aufgabe aus, er kann selbst keine sein",
  stepTitle: "Titel",
  stepTask: "Aufgabe",
  stepTitlePlaceholder: "Was hier passiert, z. B. head = head.next;",
  stepTaskPlaceholder: "Was zu bauen ist, z. B. Knoten vorne einfügen",
  stepDetailsShow: "Schrittdetails zeigen",
  stepDetailsHide: "Schrittdetails ausblenden",
  checkVerdictWrong: "Noch nicht richtig",
  paletteHeading: "Hinzufügen",
  menu: "Menü",
  showPalette: "Zeigen, was hinzugefügt werden kann",
  hidePalette: "Ausblenden, was hinzugefügt werden kann",
  stepStatusNone: (step) => `Schritt ${step}: nichts zu tun`,
  stepStatusUntried: (step) => `Schritt ${step}: noch nicht geprüft`,
  stepStatusCorrect: (step) => `Schritt ${step}: richtig`,
  stepStatusWrong: (step) => `Schritt ${step}: noch nicht richtig`,

  declareLocalVariable: "Lokale Variable deklarieren",
  returnMethod: "return",
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
    hideUndoRedo: "Rückgängig und Wiederholen ausblenden",
    hideDownloadPng: "„Herunterladen (PNG)“ ausblenden",
    hideDownloadAllPng: "„Alle Schritte herunterladen“ ausblenden",
    hidePrintMode: "„S/W“ ausblenden",
    hideHelp: "Hilfe-Link (?) ausblenden",
    hideSave: "„Speichern“ ausblenden",
  },
  toolbarOptions: "Werkzeugleiste",
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
