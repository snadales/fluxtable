import { ASTNode } from './types';

export class DependencyGraph {
  private adjList: Map<string, Set<string>> = new Map();

  public addDependency(fromField: string, toField: string) {
    if (!this.adjList.has(fromField)) {
      this.adjList.set(fromField, new Set());
    }
    this.adjList.get(fromField)!.add(toField);
  }

  public hasCycle(): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    for (const node of this.adjList.keys()) {
      if (this.isCyclicUtil(node, visited, recStack)) {
        return true;
      }
    }
    return false;
  }

  private isCyclicUtil(node: string, visited: Set<string>, recStack: Set<string>): boolean {
    if (recStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    recStack.add(node);

    const neighbors = this.adjList.get(node);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (this.isCyclicUtil(neighbor, visited, recStack)) {
          return true;
        }
      }
    }

    recStack.delete(node);
    return false;
  }

  public static extractFieldReferences(node: ASTNode): string[] {
    const refs: string[] = [];

    function traverse(n: ASTNode) {
      if (n.type === 'FieldRef') {
        refs.push(n.name);
      } else if (n.type === 'BinaryOp') {
        traverse(n.left);
        traverse(n.right);
      } else if (n.type === 'UnaryOp') {
        traverse(n.argument);
      } else if (n.type === 'FunctionCall') {
        n.args.forEach(traverse);
      }
    }

    traverse(node);
    return Array.from(new Set(refs));
  }
}
