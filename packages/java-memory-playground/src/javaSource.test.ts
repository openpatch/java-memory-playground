import { describe, expect, test } from "vitest";
import { parseJavaClasses, toJavaSource } from "./javaSource";

const attributesOf = (source: string, name: string) =>
  parseJavaClasses(source).klasses[name]?.attributes;

describe("parseJavaClasses", () => {
  test("reads a class and its fields", () => {
    expect(
      attributesOf(
        `class Node {
           Node next;
           Message content;
         }`,
        "Node",
      ),
    ).toEqual({ next: "Node", content: "Message" });
  });

  test("reads several classes", () => {
    const { klasses } = parseJavaClasses(`
      class Node { Node next; }
      class Message { String text; }
    `);

    expect(Object.keys(klasses)).toEqual(["Node", "Message"]);
  });

  test("ignores modifiers", () => {
    expect(
      attributesOf(
        `public class Account {
           private final String owner;
           protected static int count;
         }`,
        "Account",
      ),
    ).toEqual({ owner: "String", count: "int" });
  });

  test("skips methods, including their bodies", () => {
    expect(
      attributesOf(
        `class Counter {
           int count;
           public void increment() {
             int local = 1;
             this.count += local;
           }
           Counter() { count = 0; }
         }`,
        "Counter",
      ),
    ).toEqual({ count: "int" });
  });

  test("a semicolon inside a method body does not become a field", () => {
    const attributes = attributesOf(
      `class A {
         void go() { int hidden; String alsoHidden; }
         int real;
       }`,
      "A",
    );

    expect(attributes).toEqual({ real: "int" });
  });

  test("ignores comments, including code commented out", () => {
    expect(
      attributesOf(
        `class Node {
           // Node commented;
           /* Node alsoCommented;
              String stillCommented; */
           Node next; // the next one
         }`,
        "Node",
      ),
    ).toEqual({ next: "Node" });
  });

  test("a brace inside a string does not confuse the scan", () => {
    expect(
      attributesOf(
        `class A {
           String pattern = "}{;";
           int after;
         }`,
        "A",
      ),
    ).toEqual({ pattern: "String", after: "int" });
  });

  test("drops initializers", () => {
    expect(
      attributesOf(`class A { int count = 3; String name = "x"; }`, "A"),
    ).toEqual({ count: "int", name: "String" });
  });

  test("reads several names declared at once", () => {
    expect(attributesOf(`class A { int x, y, z; }`, "A")).toEqual({
      x: "int",
      y: "int",
      z: "int",
    });
  });

  test("arrays become the playground's Array, written either way round", () => {
    expect(attributesOf(`class A { int[] values; double other[]; }`, "A")).toEqual(
      { values: "Array", other: "Array" },
    );
  });

  test("generics are dropped, keeping the raw type", () => {
    expect(
      attributesOf(`class A { List<Node> items; Map<String, Integer> byName; }`, "A"),
    ).toEqual({ items: "List", byName: "Map" });
  });

  test("a qualified type is shown by its last part", () => {
    expect(attributesOf(`class A { java.lang.String name; }`, "A")).toEqual({
      name: "String",
    });
  });

  test("long, short and byte are primitives, not references", () => {
    expect(attributesOf(`class A { long a; short b; byte c; }`, "A")).toEqual({
      a: "long",
      b: "short",
      c: "byte",
    });
  });

  test("reads a record's components", () => {
    expect(attributesOf(`record Point(int x, int y) {}`, "Point")).toEqual({
      x: "int",
      y: "int",
    });
  });

  test("reads a nested class once, not twice", () => {
    const { klasses } = parseJavaClasses(`
      class Outer {
        int a;
        class Inner { int b; }
      }
    `);

    expect(klasses.Outer.attributes).toEqual({ a: "int" });
    expect(Object.keys(klasses)).toContain("Inner");
  });

  test("reports a class with no body", () => {
    const { problems } = parseJavaClasses("class Broken");
    expect(problems.join(" ")).toContain("no body");
  });

  test("reports a missing closing brace", () => {
    const { problems } = parseJavaClasses("class Broken { int a;");
    expect(problems.join(" ")).toContain("closing brace");
  });

  test("reports a duplicate class", () => {
    const { problems } = parseJavaClasses("class A { } class A { }");
    expect(problems.join(" ")).toContain("more than once");
  });

  test("says so when there is nothing to read", () => {
    expect(parseJavaClasses("int x = 1;").problems.join(" ")).toContain(
      "No class declarations",
    );
  });

  test("empty source is not an error", () => {
    expect(parseJavaClasses("   ")).toEqual({ klasses: {}, problems: [] });
  });

  test("an empty class is a class with no fields", () => {
    expect(attributesOf("class Empty {}", "Empty")).toEqual({});
  });
});

describe("toJavaSource", () => {
  test("writes classes back out", () => {
    expect(
      toJavaSource({
        Node: { attributes: { next: "Node", value: "int" } },
      }),
    ).toBe("class Node {\n    Node next;\n    int value;\n}");
  });

  test("round-trips through the parser", () => {
    const klasses = {
      Node: { attributes: { next: "Node", content: "Message" } },
      Message: { attributes: { text: "String", isRead: "boolean" } },
    };

    expect(parseJavaClasses(toJavaSource(klasses)).klasses).toEqual(klasses);
  });

  test("round-trips an array field", () => {
    const klasses = { Bag: { attributes: { items: "Array" } } };

    expect(parseJavaClasses(toJavaSource(klasses)).klasses).toEqual(klasses);
  });

  test("writes an empty class", () => {
    expect(toJavaSource({ Empty: { attributes: {} } })).toBe(
      "class Empty {\n}",
    );
  });
});
