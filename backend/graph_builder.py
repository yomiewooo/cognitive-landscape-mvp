from __future__ import annotations

from itertools import combinations
from typing import Dict, List, TypedDict

import networkx as nx


NEGATION_MARKERS = {"not", "no", "never", "none", "cannot", "cant", "without"}


class GraphData(TypedDict):
    nodes: List[Dict[str, str]]
    edges: List[Dict[str, str]]


def _token_set(text: str) -> set[str]:
    return set(text.split())


def _edge_type(a: str, b: str) -> str | None:
    ta = _token_set(a)
    tb = _token_set(b)
    overlap = len(ta.intersection(tb))
    if overlap < 2:
        return None

    has_negation_a = bool(ta.intersection(NEGATION_MARKERS))
    has_negation_b = bool(tb.intersection(NEGATION_MARKERS))
    if has_negation_a != has_negation_b:
        return "contradicts"
    return "supports"


def build_belief_graph(beliefs: List[str]) -> GraphData:
    graph = nx.Graph()

    for belief in beliefs:
        graph.add_node(belief)

    for a, b in combinations(beliefs, 2):
        relation = _edge_type(a, b)
        if relation:
            graph.add_edge(a, b, relation=relation)

    nodes = [{"id": node, "label": node} for node in graph.nodes]
    edges = [
        {
            "source": source,
            "target": target,
            "relation": str(data.get("relation", "supports")),
        }
        for source, target, data in graph.edges(data=True)
    ]

    return {"nodes": nodes, "edges": edges}


def extract_contradictions(graph_data: GraphData) -> List[Dict[str, str]]:
    return [
        {"left": edge["source"], "right": edge["target"]}
        for edge in graph_data["edges"]
        if edge["relation"] == "contradicts"
    ]
