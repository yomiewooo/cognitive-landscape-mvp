import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { GraphEdge, GraphNode } from './types'

type Props = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

type SimNode = GraphNode & d3.SimulationNodeDatum
type SimEdge = d3.SimulationLinkDatum<SimNode> & GraphEdge

export default function GraphView({ nodes, edges }: Props) {
  const ref = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (!ref.current) return

    const width = 860
    const height = 460

    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()
    svg.attr('viewBox', `0 0 ${width} ${height}`)

    const simNodes: SimNode[] = nodes.map((n) => ({ ...n }))
    const simEdges: SimEdge[] = edges.map((e) => ({ ...e }))

    const simulation = d3
      .forceSimulation(simNodes)
      .force('link', d3.forceLink(simEdges).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-240))
      .force('center', d3.forceCenter(width / 2, height / 2))

    const link = svg
      .append('g')
      .selectAll('line')
      .data(simEdges)
      .enter()
      .append('line')
      .attr('stroke-width', 2)
      .attr('stroke', (d) => (d.relation === 'contradicts' ? '#ef4444' : '#22c55e'))

    const node = svg
      .append('g')
      .selectAll('circle')
      .data(simNodes)
      .enter()
      .append('circle')
      .attr('r', 10)
      .attr('fill', '#0ea5e9')
      .call(
        d3
          .drag<SVGCircleElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    const labels = svg
      .append('g')
      .selectAll('text')
      .data(simNodes)
      .enter()
      .append('text')
      .text((d) => d.label.slice(0, 40))
      .attr('font-size', 12)
      .attr('fill', '#111827')

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0)

      node.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0)

      labels
        .attr('x', (d) => (d.x ?? 0) + 12)
        .attr('y', (d) => (d.y ?? 0) + 4)
    })

    return () => simulation.stop()
  }, [nodes, edges])

  return <svg ref={ref} className="graph" />
}
