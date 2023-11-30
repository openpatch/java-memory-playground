export type DataType =
  | "int"
  | "float"
  | "char"
  | "double"
  | "boolean"
  | "String"
  | "Array"
  | string;

export type Klass = {
  attributes: Record<string, DataType>;
};

export type Obj = {
  klass: string;
  attributes: Record<string, string | number | boolean | null>;
  position: {
    x: number;
    y: number;
  };
};

export type Variable = {
  name: String;
  dataType: DataType;
  value: string | null;
  position: {
    x: number;
    y: number;
  };
};

export type Memory = {
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  options: {
    hideSidebar: boolean;
  };
  klasses: Record<string, Klass>;
  objects: Record<string, Obj>;
  variables: Record<string, Variable>;
};

export const initialMemory: Memory = {
  options: {
    hideSidebar: false,
  },
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
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
      },
    },
  },
  objects: {
    "@11": {
      klass: "List",
      attributes: {
        current: "@33",
        first: "@33",
      },
      position: {
        x: 250,
        y: 100,
      },
    },
    "@33": {
      klass: "Node",
      attributes: {
        next: null,
        content: "@55",
      },
      position: {
        x: 400,
        y: 100,
      },
    },
    "@44": {
      klass: "Node",
      attributes: {
        next: null,
        content: null,
      },
      position: {
        x: 600,
        y: 100,
      },
    },
    "@55": {
      klass: "Message",
      attributes: {
        username: '"mike"',
        text: '"Hello World!"',
      },
      position: {
        x: 400,
        y: 250,
      },
    },
    "@66": {
      klass: "Array",
      attributes: {
        length: 5
      },
      position: {
        x: 400,
        y: 250,
      },
    },
  },
  variables: {
    "@v00": {
      name: "myList",
      dataType: "List",
      value: "@11",
      position: {
        x: 100,
        y: 100,
      },
    },
    "@v01": {
      name: "tmp1",
      dataType: "List",
      value: null,
      position: {
        x: 100,
        y: 150,
      },
    },
    "@v02": {
      name: "tmp2",
      dataType: "List",
      value: null,
      position: {
        x: 100,
        y: 200,
      },
    },
  },
};
