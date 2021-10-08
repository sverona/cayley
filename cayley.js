"use strict";

class CayleyGraph {
  constructor(generators, relations, max_size=1024) {
    this.generators = generators;
    this.relations = relations.map(CayleyGraph.parseRelation);
    this.max_size = max_size;

    this.nodes = [];
    this.edges = [];
  }

  static parseRelation(rel) {

    /* Split the relation into tokens. A token is one of
     * - an exponent
     * - a parenthesis (open or close)
     * - or a group element. */
    let tokenRegex = /(?:[A-Za-z]|'|\^-?\d+|\(|\))/g;
    let tokens = [...rel.matchAll(tokenRegex)].map( match => match[0] );

    /* Combine any exponents with the prior token, as long as it is not
     * an open parenthesis. */
    let tokensWithCombinedExponents = [];
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];
      if (token == "'") {
        token = "^-1";
      }
      if (token.match(/\^-?\d+/)) {
        if (i == 0) {
          throw "Syntax error: expression begins with exponent";
        } else if (tokens[i - 1] == '(') {
          throw "Syntax error: exponent follows open parenthesis";
        } else {
          tokensWithCombinedExponents[tokensWithCombinedExponents.length - 1] += token;
        }
      } else {
        tokensWithCombinedExponents.push(token);
      }
    }
    tokens = tokensWithCombinedExponents;

    /* Now parse the tokens into canonical form. */
    let canonicalForm = [];
    for (let token of tokens) {
      if (token[0].match(/[A-Za-z]/)) {
        if (token.includes('^')) {
          var base = token.split('^')[0];
          var exponents = token.split('^').slice(1);
          var exponent = 1;
          for (let exp of exponents) {
            exponent *= parseInt(exp);
          }
        } else {
          var base = token;
          var exponent = 1;
        }
        base = [[base, false]];

        canonicalForm.push(...CayleyGraph.exponentiate(base, exponent));
      } else if (token == '(') {
        canonicalForm.push(token);
      } else if (token[0] == ')') {
        if (token.includes('^')) {
          var [, exponent] = token.split('^');
          exponent = parseInt(exponent);
        } else {
          var exponent = 1;
        }

        /* Pop up to the previous parenthesis. */
        let leftParenIndex = canonicalForm.indexOf('(');
        if (leftParenIndex < 0) {
          throw "Syntax error: mismatched parentheses";
        }
        let parenthetical = canonicalForm.slice(leftParenIndex + 1);
        canonicalForm = canonicalForm.slice(0, leftParenIndex);

        /* Push the exponentiated parenthetical. */
        canonicalForm.push(...CayleyGraph.exponentiate(parenthetical, exponent));
      } else {
        throw `Syntax error: bad token ${token}`;
      }
    }

    return canonicalForm;
  }

  static exponentiate(base, exponent) {
    let result = [];

    let isInverse = exponent < 0;
    if (isInverse) {
      exponent *= -1;
    }

    for (let i = 0; i < exponent; i++) {
      if (isInverse) {
        for (let j = base.length - 1; j >= 0; j--) {
          let [termBase, termInverted] = base[j];
          result.push([termBase, !termInverted]);
        }
      } else {
        result.push(...base);
      }
    }

    return result;
  }

  findCayleyGraph() {
    /* Todd-Coxeter algorithm. */
    this.nodes.push({id: 0, label: [], complete: false});

    let incompleteNode;

    while ((incompleteNode = this.nodes.find(node => !node.complete))) {
      for (let gen of this.generators) {
        for (let inverted of [false, true]) {
          this.follow(incompleteNode, [gen, inverted]);
        }
      }

      this.formLoopsAt(incompleteNode);
      let identifiedNodes;
      while ((identifiedNodes = this.identifyAllDuplicates()) > 0);

      incompleteNode.complete = true;

      if (this.nodes.length > this.max_size) {
        throw "Group too large.";
      }
    }

    this.removeDuplicateEdges();

    // renumber all vertices
    this.nodes.forEach((node, idx) => {
      this.renumberVertex(node, idx)
    });
  }

  renumberVertex(node, idx) {
    let oldId = node.id;
    node.id = idx;

    this.edges.forEach(edge => {
      if (edge.target == oldId) {
        edge.target = node.id;
      }
      if (edge.source == oldId) {
        edge.source = node.id;
      }
    });
  }

  findIncompleteNode() {
    return find
    for (let node of this.nodes) {
      for (let gen of this.generators) {
        for (let inverted of [false, true]) {
          if (this.successors(node, [gen, inverted]).length == 0) {
            return [node, [gen, inverted]];
          }
        }
      }
    }
    return null;
  }

  identifyAllDuplicates() {
    let nodesIdentified = 0;
    for (let node of this.nodes) {
      let incidentEdges = this.edges.filter((edge) =>
        (edge.target == node.id || edge.source == node.id)
      );

      for (let gen of this.generators) {
        for (let inverted of [false, true]) {
          let action = [gen, inverted];
          let successors = this.successors(node, action);

          if (successors.length > 1) {
            let idToKeep = Math.min(...successors.map((node) => node.id));
            let nodeToKeep = successors.find((node) => (node.id == idToKeep));

            for (let succ of successors) {
                this.identifyNodes(nodeToKeep, succ);
                if (succ.id != nodeToKeep.id) {
                  nodesIdentified++;
                }
            }
          }
        }
      }
    }

    return nodesIdentified;
  }

  identifyNodes(nodeToKeep, nodeToDrop) {
    if (nodeToKeep.id == nodeToDrop.id) {
      return;
    }

    // console.log(`Identifying node ${nodeToKeep.id} with ${nodeToDrop.id}`);

    this.nodes = this.nodes.filter((node) => (node.id != nodeToDrop.id));
    this.edges.forEach((edge) => {
      if (edge.target == nodeToDrop.id) {
        edge.target = nodeToKeep.id;
      }
      if (edge.source == nodeToDrop.id) {
        edge.source = nodeToKeep.id;
      }
    });

  }

  removeDuplicateEdges() {
    let uniqueEdges = [];

    for (let edge of this.edges) {
      let hasDuplicates = uniqueEdges.some(uniq =>
        (uniq.source == edge.source && uniq.target == edge.target)
      );
      if (!hasDuplicates) {
        uniqueEdges.push(edge);
      }
    }

    this.edges = uniqueEdges;
  }

  successors(node, action) {
    let [gen, inverted] = action;
    if (inverted) {
      let edges = this.edges.filter( (edge) =>
        (edge.target == node.id && edge.label == gen)
      );

      return edges.map((edge) => this.nodes.find((succ) => succ.id == edge.source));
    } else {
      let edges = this.edges.filter( (edge) =>
        (edge.source == node.id && edge.label == gen)
      );

      return edges.map((edge) => this.nodes.find((succ) => succ.id == edge.target));
    }
  }

  follow(node, action) {
    let [gen, inverted] = action;

    let connectingEdge;
    if (inverted) {
      connectingEdge = this.edges.find(edge =>
        (edge.target == node.id) && (edge.label == gen)
      );
    } else {
      connectingEdge = this.edges.find(edge =>
        (edge.source == node.id) && (edge.label == gen)
      );
    }

    let successorId, successor;
    if (!connectingEdge) {
      successorId = Math.max(...this.nodes.map(node => node.id)) + 1;
      successor = {
        id: successorId,
        label: node.label.concat([action]),
        complete: false
      };
      this.nodes.push(successor);

      if (inverted) {
        connectingEdge = {
          id: `${successor.id}->${node.id}`,
          source: successor.id,
          target: node.id,
          label: gen
        };
      } else {
        connectingEdge = {
          id: `${node.id}->${successor.id}`,
          source: node.id,
          target: successor.id,
          label: gen
        };
      }
      this.edges.push(connectingEdge);
    } else {
      successorId = inverted ? connectingEdge.source : connectingEdge.target;
      successor = this.nodes.find(node => (node.id == successorId));
    }

    return successor;
  }

  formLoopsAt(node) {
    for (let rel of this.relations) {
      let currentNode = node;
      for (let action of rel) {
        currentNode = this.follow(currentNode, action);
      }

      this.identifyNodes(node, currentNode);
    }
  }
}

// module.exports = CayleyGraph;
