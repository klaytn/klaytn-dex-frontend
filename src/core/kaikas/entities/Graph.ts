import { Opaque } from 'type-fest'
import invariant from 'tiny-invariant'

import Fraction from './Fraction'
import BigNumber from 'bignumber.js'

const INFINITY = new BigNumber(Infinity) as Weight
const ONE = new BigNumber(1) as Weight

type Node<T extends keyof any> = Opaque<T, 'Node'>
type Weight = Opaque<BigNumber, 'Weight'>
interface Edge<T extends keyof any> {
  source: Node<T>
  destination: Node<T>
  weight: Weight
}
interface EdgeTransparent<T extends keyof any> {
  source: T
  destination: T
  weight?: BigNumber
}
interface ShortestPathProps<T extends keyof any> {
  source: T
  destination: T
}
interface ShortestPathReturn<T extends keyof any> {
  path: T[]
  weight: Weight
}
type Distances<T extends keyof any> = Record<Node<T>, Weight>
type Predecessors<T extends keyof any> = Record<Node<T>, Node<T> | null>

export default class Graph<T extends keyof any = string | number> {
  public edges: Edge<T>[]

  public constructor(edges: EdgeTransparent<T>[] = []) {
    this.edges = edges as Edge<T>[]
  }

  public get nodes(): Set<Node<T>> {
    return new Set(this.edges.map((edge) => [edge.source, edge.destination]).flat())
  }

  public addEdge({ source, destination, weight }: EdgeTransparent<T>): Graph<T> {
    const edge: Edge<T> = {
      source: source as Node<T>,
      destination: destination as Node<T>,
      weight: (weight || ONE) as Weight,
    }
    this.edges.push(edge)

    return this
  }

  public removeEdge(edge: EdgeTransparent<T>): Graph<T> {
    this.edges = this.edges.filter((item) => {
      return !(
        edge.source === item.source &&
        edge.destination === item.destination &&
        (edge.weight === item.weight || !edge.weight)
      )
    })

    return this
  }

  // Method to return the smallest product of edges using bellman for
  public shortestPath(props: ShortestPathProps<T>): ShortestPathReturn<T> | null {
    const source = props.source as Node<T>
    const destination = props.destination as Node<T>

    // If the source is equal to the destination
    invariant(source !== destination, 'the source node is equal to the destination node')

    // If there is no source or destination node among edges
    invariant(this.nodes.has(source), () => `there is no such source node: ${String(source)}`)
    invariant(this.nodes.has(destination), () => `there is no such destination node: ${String(destination)}`)

    // Array to store distances
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const distances = {} as Distances<T>
    Array.from(this.nodes).forEach((node) => {
      distances[node] = INFINITY
    })
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const predecessors = {} as Predecessors<T>
    Array.from(this.nodes).forEach((node) => {
      predecessors[node] = null
    })

    distances[source] = ONE

    // Bellman ford algorithm
    for (let i = 0; i < this.nodes.size - 1; i++) {
      this.edges.forEach((edge) => {
        const newWeight = distances[edge.source].multipliedBy(edge.weight) as Weight
        if (newWeight.isLessThan(distances[edge.destination])) {
          distances[edge.destination] = newWeight
          predecessors[edge.destination] = edge.source
        }
      })
    }

    if (distances[destination] === INFINITY) return null

    const path: Node<T>[] = []
    let current: Node<T> | null = destination

    while (current !== source && current !== null) {
      path.unshift(current)
      current = predecessors[current]
      if (new Set(path).size !== path.length) break
    }
    path.unshift(source)

    return {
      path,
      weight: distances[destination],
    }
  }
}
