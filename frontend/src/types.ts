export type GraphNode = {
  id: string
  label: string
}

export type GraphEdge = {
  source: string
  target: string
  relation: 'supports' | 'contradicts'
}

export type AnalysisResponse = {
  analysis_id: number
  source: string
  claims: string[]
  beliefs: string[]
  graph: {
    nodes: GraphNode[]
    edges: GraphEdge[]
  }
  contradictions: { left: string; right: string }[]
}
