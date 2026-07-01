import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';

// Mock data: A simple GeoJSON for the world would be too large to hardcode.
// Instead, we will simulate the world map projection for pins on an SVG.
const projectLocations = [
  { name: 'Project A', lat: 48.8566, lng: 2.3522, client: 'Client 1' }, // Paris
  { name: 'Project B', lat: 51.5074, lng: -0.1278, client: 'Client 2' }, // London
  { name: 'Project C', lat: 40.7128, lng: -74.0060, client: 'Client 3' }, // New York
  { name: 'Project D', lat: -33.8688, lng: 151.2093, client: 'Client 4' }, // Sydney
  { name: 'Project E', lat: 35.6762, lng: 139.6503, client: 'Client 5' }, // Tokyo
];

export default function ProjectMap() {
  const mapRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const svg = d3.select(mapRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 400;

    // Use a basic equirectangular projection
    const projection = d3.geoEquirectangular()
      .scale(120)
      .translate([width / 2, height / 2]);

    // Draw simple map background (simplified)
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#18181b'); // bg-zinc-900

    // Add pins
    svg.selectAll('circle')
      .data(projectLocations)
      .enter()
      .append('circle')
      .attr('cx', d => projection([d.lng, d.lat])![0])
      .attr('cy', d => projection([d.lng, d.lat])![1])
      .attr('r', 6)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .append('title')
      .text(d => `${d.name} (${d.client})`);

  }, []);

  return (
    <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
      <h3 className="text-lg font-semibold mb-4 text-zinc-300">Carte Globale des Projets</h3>
      <svg ref={mapRef} className="w-full h-96 bg-zinc-950 rounded-lg"></svg>
    </div>
  );
}
