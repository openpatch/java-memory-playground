export const numericDataTypes = ["int", "float", "double", "char"];

/**
 * The eight-ish types whose value really is stored in the variable itself.
 *
 * `String` is deliberately NOT here: in Java it is a reference type, and a
 * String value lives on the heap like any other object. Drawing every String as
 * its own box clutters a diagram whose lesson is elsewhere, so the playground
 * collapses them by default — but that is a display choice (`options.
 * inlineStrings`), not a claim about how memory works.
 */
export const primitveDataTypes = ["int", "float", "double", "char", "boolean"];

/** The class name of the heap objects that hold String values. */
export const STRING_KLASS = "String";

/** Types always offered in a type picker, before the user's own classes. */
export const builtInDataTypes = [...primitveDataTypes, STRING_KLASS];

export type DataType =
  | "int"
  | "float"
  | "char"
  | "double"
  | "boolean"
  | "String"
  | "Array"
  | string;

export interface KlassAttributes {
  [key: string]: DataType;
}

export type Klass = {
  attributes: KlassAttributes;
};

export type Attribute = {
  dataType: DataType;
  value?: string | number | boolean;
};

export interface ObjAttributes {
  [key: string]: Attribute;
}

export type Obj = {
  klass: string;
  attributes: ObjAttributes;
  position: {
    x: number;
    y: number;
  };
  arrayElementType?: DataType; // For arrays, stores the type of elements
  /**
   * The characters held by a String object (`klass === STRING_KLASS`), without
   * surrounding quotes — those are added when rendering.
   */
  literal?: string;
};

export type Variable = {
  name: string;
  dataType: DataType;
  value: string | null;
  position: {
    x: number;
    y: number;
  };
};

export interface localVariables {
  [key: string]: Attribute;
}

export type MethodCall = {
  name: string;
  index: number;
  localVariables: localVariables;
  position: {
    x: number;
    y: number;
  };
};

export interface Klasses {
  [key: string]: Klass;
}

export interface Objs {
  [key: string]: Obj;
}

export interface Variables {
  [key: string]: Variable;
}

export interface MethodCalls {
  [key: number]: MethodCall;
}

export type Memory = {
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  options: {
    disableGarbageCollector?: boolean;
    hideSidebar?: boolean;
    hideCallMethod?: boolean;
    hideDeclareGlobalVariable?: boolean;
    hideNewArray?: boolean;
    createNewOnEdgeDrop?: boolean;
    /**
     * Draw String values inside the object that references them instead of as
     * their own heap box. On by default: a diagram about a linked list should
     * not sprout a box per name. Turn it off to teach that a String is an
     * object like any other — `==` versus `.equals()`, the string pool.
     */
    inlineStrings?: boolean;
  };
  klasses: Klasses;
  objects: Objs;
  variables: Variables;
  methodCalls: MethodCalls;
};

export const initialMemory: Memory = {
  options: {
    hideSidebar: false,
    hideCallMethod: false,
    hideDeclareGlobalVariable: true,
    hideNewArray: false,
    inlineStrings: true,
  },
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
  methodCalls: {
    1: {
      name: "App.main",
      localVariables: {
        myList: {
          dataType: "List",
          value: "@11",
        },
        tmp1: {
          dataType: "List",
        },
        tmp2: {
          dataType: "List",
        },
      },
      index: 0,
      position: {
        x: 0,
        y: 0,
      },
    },
  },
  variables: {},
  klasses: {
    List: {
      attributes: {
        current: "Node",
        first: "Node",
      },
    },
    Node: {
      attributes: {
        next: "Node",
        content: "Message",
      },
    },
    Message: {
      attributes: {
        username: "String",
        text: "String",
        isRead: "boolean",
      },
    },
  },
  objects: {
    "@11": {
      klass: "List",
      attributes: {
        current: {
          dataType: "Node",
          value: "@33",
        },
        first: {
          dataType: "Node",
          value: "@33",
        },
      },
      position: {
        x: 250,
        y: 100,
      },
    },
    "@33": {
      klass: "Node",
      attributes: {
        next: {
          dataType: "Node",
        },
        content: {
          dataType: "Message",
          value: "@55",
        },
      },
      position: {
        x: 400,
        y: 100,
      },
    },
    "@44": {
      klass: "Node",
      attributes: {
        next: {
          dataType: "Node",
        },
        content: {
          dataType: "Message",
        },
      },
      position: {
        x: 600,
        y: 100,
      },
    },
    "@55": {
      klass: "Message",
      attributes: {
        username: {
          dataType: "String",
          value: "@66",
        },
        text: { dataType: "String", value: "@77" },
        isRead: { dataType: "boolean", value: true },
      },
      position: {
        x: 400,
        y: 250,
      },
    },
    // String values are heap objects too. They are collapsed into the object
    // that references them while `options.inlineStrings` is on.
    "@66": {
      klass: STRING_KLASS,
      literal: "mike",
      attributes: {},
      position: {
        x: 650,
        y: 250,
      },
    },
    "@77": {
      klass: STRING_KLASS,
      literal: "Hello World!",
      attributes: {},
      position: {
        x: 650,
        y: 330,
      },
    },
  },
};
