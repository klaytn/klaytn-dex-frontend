import { Opaque } from 'type-fest'

// Javascript implementation of the approach.

let inf = 1000000000

type Node = Opaque<number | string, 'Node'>
type Edge = [Node, Node]
type Weight = Opaque<number, 'Weight'>
type WeightedEdge = [Edge, Weight]

// Function to return the smallest
// product of edges
function bellman(args: { source: Node; destination: Node; edges: WeightedEdge[] }) {
  const { source: s, destination: d, edges: ed } = args
  const n = new Set(edges.map((edge) => edge[0]).flat()).size

  // If the source is equal
  // to the destination
  if (s === d) return 0

  // Array to store distances
  let dis = Array(n + 1).fill(inf)

  dis[s] = 1

  // Bellman ford algorithm
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < ed.length; j++) {
      dis[ed[j][0][1]] = Math.min(dis[ed[j][0][1]], dis[ed[j][0][0]] * ed[j][1])
    }
  }

  // Loop to detect cycle
  for (let it in ed) {
    if (dis[it[0][1]] > dis[it[0][0]] * it[1]) return -2
  }

  // Returning final answer
  if (dis[d] === inf) return -1
  else return dis[d]
}

// Input edges
let edges = [
  [[1, 2], 0.5],
  [[1, 3], 1.9],
  [[2, 3], 3],
  [[3, 1], 22],
  [[3, 2], 16.5],
  [[2, 1], 2],
] as WeightedEdge[]
// Source and Destination
let source = 3 as Node
let destination = 1 as Node
// Bellman ford
let get = bellman({
  source,
  destination,
  edges,
})
if (get === -2) console.log('Belman: Cycle Detected')
else console.log('Belman: ' + get)
