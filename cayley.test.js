const CayleyGraph = require('./cayley');

test("CayleyGraph.exponentiate handles positive exponents", () => {
  expect(CayleyGraph.exponentiate([["g", false]], 2)).toEqual([["g", false], ["g", false]]);
  expect(CayleyGraph.exponentiate([["g", true]], 2)).toEqual([["g", true], ["g", true]]);
});

test("CayleyGraph.exponentiate handles negative exponents", () => {
  expect(CayleyGraph.exponentiate([["g", false]], -1)).toEqual([["g", true]]);
  expect(CayleyGraph.exponentiate([["g", true]], -2)).toEqual([["g", false], ["g", false]]);
  expect(CayleyGraph.exponentiate([["g", true], ["h", false]], -1)).toEqual([["h", true], ["g", false]]);
});

test("CayleyGraph.exponentiate handles zero exponents", () => {
  expect(CayleyGraph.exponentiate([["g", false]], 0)).toEqual([]);
  expect(CayleyGraph.exponentiate([["g", true], ["h", false]], 0)).toEqual([]);
});

test("CayleyGraph.parseRelation handles basic relations", () => {
  expect(CayleyGraph.parseRelation("ggg")).toEqual([["g", false], ["g", false], ["g", false]]);
  expect(CayleyGraph.parseRelation("ghk")).toEqual([["g", false], ["h", false], ["k", false]]);
});

test("CayleyGraph.parseRelation handles primes as inversions", () => {
  expect(CayleyGraph.parseRelation("g'g'g")).toEqual([["g", true], ["g", true], ["g", false]]);
});

test("CayleyGraph.parseRelation handles relations with positive exponents only", () => {
  expect(CayleyGraph.parseRelation("g^3")).toEqual([["g", false], ["g", false], ["g", false]]);
  expect(CayleyGraph.parseRelation("gh^2k")).toEqual([["g", false], ["h", false], ["h", false], ["k", false]]);
  expect(CayleyGraph.parseRelation("(gh)^2k")).toEqual([["g", false], ["h", false], ["g", false], ["h", false], ["k", false]]);
});

test("CayleyGraph.parseRelation handles relations with negative exponents only", () => {
  expect(CayleyGraph.parseRelation("g^-3")).toEqual([["g", true], ["g", true], ["g", true]]);
  expect(CayleyGraph.parseRelation("gh^-2k")).toEqual([["g", false], ["h", true], ["h", true], ["k", false]]);
  expect(CayleyGraph.parseRelation("(gh)^-2k")).toEqual([["h", true], ["g", true], ["h", true], ["g", true], ["k", false]]);
});

test("CayleyGraph.parseRelation handles relations with nested exponents", () => {
  expect(CayleyGraph.parseRelation("g^-3^-1")).toEqual([["g", false], ["g", false], ["g", false]]);
});

test("CayleyGraph.findCayleyGraph solves Q8", () => {
  let q8 = new CayleyGraph(["r", "b"], ["r^4", "b^4", "rbr'b", "r^2b^2"]);

  q8.findCayleyGraph();

  expect(q8.nodes.length).toEqual(8);
  expect(q8.edges.length).toEqual(16);
});

test("CayleyGraph.findCayleyGraph solves Dic12", () => {
  let dic12 = new CayleyGraph(["r", "b"], ["b^6", "r^2b^3", "r^-1brb"]);

  dic12.findCayleyGraph();

  expect(dic12.nodes.length).toEqual(12);
  expect(dic12.edges.length).toEqual(24);
});

test("CayleyGraph.findCayleyGraph solves Frob20", () => {
  let frob20 = new CayleyGraph(["a", "b"], ["a^5", "b^4", "aba^-2b'"]);

  frob20.findCayleyGraph();

  expect(frob20.nodes.length).toEqual(20);
  expect(frob20.edges.length).toEqual(40);
});

test("CayleyGraph.findCayleyGraph solves S4", () => {
  let s4 = new CayleyGraph(["a", "b", "c"], ["a^2", "b^2", "c^2", "(ab)^2", "(bc)^3", "(ac)^3"]);

  s4.findCayleyGraph();

  expect(s4.nodes.length).toEqual(24);
  expect(s4.edges.length).toEqual(72);
});
