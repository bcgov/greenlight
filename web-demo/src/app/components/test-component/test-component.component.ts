import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';
import * as dagreD3 from 'dagre-d3';

@Component({
  selector: 'app-test-component',
  templateUrl: './test-component.component.html',
  styleUrls: ['./test-component.component.scss']
})
export class TestComponentComponent implements OnInit, AfterViewInit {

  @ViewChild('canvasRoot') svgRoot;
  graph: any;
  topology: Object;

  constructor() {
    // Create a new directed graph
    this.graph = new dagreD3.graphlib.Graph().setGraph({});
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    // wrap the svg root native element in a d3 object
    const svg = d3.select(this.svgRoot.nativeElement);

    let i = 1;
    ['normal', 'vee', 'undirected'].forEach((arrowhead) => {
      this.graph.setNode(arrowhead + '1', { label: i++, rx: 5, ry: 5 });
      this.graph.setNode(arrowhead + '2', { label: i++, rx: 5, ry: 5 });
      this.graph.setEdge(arrowhead + '1', arrowhead + '2', {
        arrowhead: arrowhead,
        label: arrowhead
      });
    });

    const inner = svg.select('g');

    // Set up zoom support
    const zoom = d3.zoom().on('zoom', function() {
          inner.attr('transform', d3.event.transform);
        });
    svg.call(zoom);

    // Create the renderer
    const render = new dagreD3.render();

    // Run the renderer. This is what draws the final graph.
    render(inner, this.graph);

    // Center the graph
    const initialScale = 0.75;
    const canvasWidth: any = svg.attr('width');
    svg.call(zoom.transform,
        d3.zoomIdentity.translate((canvasWidth - this.graph.graph().width * initialScale) / 2, 20).scale(initialScale));
    svg.attr('height', this.graph.graph().height * initialScale + 40);
  }

}
