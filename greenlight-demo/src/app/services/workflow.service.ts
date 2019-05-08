import { Injectable } from '@angular/core';

import * as d3 from 'd3';
import * as dagreD3 from 'dagre-d3';

import { WorkflowNode } from '../models/workflow-node';
import { WorkflowLink } from '../models/workflow-link';
import { WorkflowTopology } from '../models/workflow-topology';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {

  private topology: WorkflowTopology;

  constructor() {
    this.topology = new WorkflowTopology();
  }

  /**
   * Adds a neew node to the graph.
   * @param node the new WorkFlowNode
   */
  addNode (node: WorkflowNode) {
    this.topology.nodes.push(node);
  }

  /**
   * Removes a WorkflowLink from the topology.
   * @param node the WorkflowNode to be removed
   */
  removeNode (node: WorkflowNode) {
    this.topology.removeFromTopology(node);
  }

  /**
   * Adds a new edge to the graph.
   * @param link the new WorkflowLink
   */
  addLink (link: WorkflowLink) {
    this.topology.links.push(link);
  }

  /**
   * Removes a WorkflowLink from the topology.
   * @param link the WorkflowLink to be removed
   */
  removeLink (link: WorkflowLink) {
    this.topology.removeFromTopology(link);
  }

  clearTopology () {
    this.topology = new WorkflowTopology();
  }

  renderGraph (svgCanvas: any) {
    // Wrap the svg root native element in a d3 object
    const svg = d3.select(svgCanvas.nativeElement || svgCanvas);

    // Ensure we have a <g> element to append the graph to
    const inner = svg.append('g');

    // Set up zoom support
    const zoom = d3.zoom().on('zoom', function() {
      inner.attr('transform', d3.event.transform);
    });
    // svg.call(zoom);

    // Create the graph object and process topology
    const graph = new dagreD3.graphlib.Graph().setGraph({});
    this.processTopology(graph);

    // Create the renderer
    const render = new dagreD3.render();

    // Run the renderer. This is what draws the final graph.
    render(inner, graph);

    // Center the graph in the canvas
    let initialScale = 0.75;
    const canvasWidth: SVGAnimatedLength = svgCanvas.nativeElement.width; // We need to go through the native element

    if (canvasWidth.baseVal.value < graph.graph().width) {
      initialScale = canvasWidth.baseVal.value / graph.graph().width;
    }

    svg.call(zoom.transform,
        d3.zoomIdentity.translate((canvasWidth.baseVal.value - graph.graph().width * initialScale) / 2, 20).scale(initialScale));
    svg.attr('height', graph.graph().height * initialScale + 40);

    // clear topology after rendering to avoid having dirty data during next iteration
    this.clearTopology();
  }

  private processTopology(graph: any) {
    this.topology.nodes.forEach((node) => {
      graph.setNode(node.did, {
        labelType: node.labelType,
        label: node.label,
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: 0,
        paddingBottom: 0,
        rx: 5,
        ry: 5
      });
    });

    this.topology.links.forEach((link) => {
      graph.setEdge(link.srcNodeId, link.destNodeId, {
        arrowhead: 'vee'
      });
    });
  }
}
