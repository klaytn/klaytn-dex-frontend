import { test, describe, expect } from 'vitest'
import Fraction from './Fraction'
import Graph from './Graph'

describe('Finding shortest path in simple graph', () => {
  const graph = new Graph()
  graph.addEdge({ source: 'A', destination: 'B', weight: new Fraction(1) })
  graph.addEdge({ source: 'B', destination: 'A', weight: new Fraction(1) })

  graph.addEdge({ source: 'A', destination: 'C', weight: new Fraction(1) })
  graph.addEdge({ source: 'C', destination: 'A', weight: new Fraction(1) })

  graph.addEdge({ source: 'B', destination: 'C', weight: new Fraction(1) })
  graph.addEdge({ source: 'C', destination: 'B', weight: new Fraction(1) })

  test('finds shortest path if weights are equal', () => {
    const result = graph.shortestPath({ source: 'A', destination: 'B' })
    expect(result?.path).toEqual(['A', 'B'])
  })

  test('throws if source and destination are equal or there are no such nodes', () => {
    expect(graph.shortestPath({ source: 'A', destination: 'A' })).toThrowError(
      /the source node is equal to the destination node/,
    )
    expect(graph.shortestPath({ source: 'F', destination: 'A' })).toThrowError(/there is no such source node: F/)
    expect(graph.shortestPath({ source: 'A', destination: 'D' })).toThrowError(/there is no such destination node: D/)
  })
})
