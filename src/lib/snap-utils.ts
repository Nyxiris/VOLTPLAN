/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point, Equipment, Cable, ConnectionPort } from '../types';

export interface SnapFeature {
  type: 'line' | 'point';
  p1?: Point;
  p2?: Point;
  x?: number;
  y?: number;
  orientation?: 'horizontal' | 'vertical' | 'diagonal' | 'point';
}

/**
 * Runs Sobel edge detection and extracts horizontal/vertical lines from a background plan image.
 * Downscales for performance to avoid blocking the main UI thread.
 */
export function detectArchitecturalFeatures(
  img: HTMLImageElement,
  actualWidth: number,
  actualHeight: number
): SnapFeature[] {
  if (!img || actualWidth <= 0 || actualHeight <= 0) return [];

  // Downscale image to a standard width of 800 for high performance & consistent thresholding
  const targetW = Math.min(img.naturalWidth || img.width || 800, 800);
  const targetH = Math.round(targetW * (actualHeight / actualWidth));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  try {
    ctx.drawImage(img, 0, 0, targetW, targetH);
  } catch (err) {
    console.warn("Could not draw image to temporary canvas for snapping analysis. Image may be cross-origin.", err);
    return [];
  }

  let imgData;
  try {
    imgData = ctx.getImageData(0, 0, targetW, targetH);
  } catch (err) {
    console.warn("Could not retrieve pixel data for edge detection. Running in fallbacks.", err);
    return [];
  }

  const data = imgData.data;
  const scaleX = actualWidth / targetW;
  const scaleY = actualHeight / targetH;

  // Compute grayscale luminance
  const luminance = new Float32Array(targetW * targetH);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    luminance[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  const features: SnapFeature[] = [];
  const edgeThreshold = 30; // Threshold of luminance difference for edge detection

  // Helper to safely fetch luminance at (x, y)
  const getLum = (x: number, y: number) => {
    if (x < 0 || x >= targetW || y < 0 || y >= targetH) return 128; // neutral
    return luminance[y * targetW + x];
  };

  // We detect horizontal and vertical runs of structural edges (walls)
  // Horizontal structures
  for (let y = 4; y < targetH - 4; y += 4) {
    let inLine = false;
    let startX = 0;
    
    for (let x = 4; x < targetW - 4; x++) {
      // Look for a vertical gradient change (which indicates a horizontal line boundary)
      const gy = getLum(x, y + 1) - getLum(x, y - 1);
      const isEdge = Math.abs(gy) > edgeThreshold;

      if (isEdge) {
        if (!inLine) {
          inLine = true;
          startX = x;
        }
      } else {
        if (inLine) {
          inLine = false;
          const length = x - startX;
          if (length > 15) { // Minimum length of 15 downscaled pixels (approx 1.8% of plan width)
            features.push({
              type: 'line',
              p1: { x: startX * scaleX, y: y * scaleY },
              p2: { x: x * scaleX, y: y * scaleY },
              orientation: 'horizontal'
            });
          }
        }
      }
    }
    if (inLine) {
      const length = targetW - 4 - startX;
      if (length > 15) {
        features.push({
          type: 'line',
          p1: { x: startX * scaleX, y: y * scaleY },
          p2: { x: (targetW - 4) * scaleX, y: y * scaleY },
          orientation: 'horizontal'
        });
      }
    }
  }

  // Vertical structures
  for (let x = 4; x < targetW - 4; x += 4) {
    let inLine = false;
    let startY = 0;

    for (let y = 4; y < targetH - 4; y++) {
      // Look for a horizontal gradient change (which indicates a vertical line boundary)
      const gx = getLum(x + 1, y) - getLum(x - 1, y);
      const isEdge = Math.abs(gx) > edgeThreshold;

      if (isEdge) {
        if (!inLine) {
          inLine = true;
          startY = y;
        }
      } else {
        if (inLine) {
          inLine = false;
          const length = y - startY;
          if (length > 15) {
            features.push({
              type: 'line',
              p1: { x: x * scaleX, y: startY * scaleY },
              p2: { x: x * scaleX, y: y * scaleY },
              orientation: 'vertical'
            });
          }
        }
      }
    }
    if (inLine) {
      const length = targetH - 4 - startY;
      if (length > 15) {
        features.push({
          type: 'line',
          p1: { x: x * scaleX, y: startY * scaleY },
          p2: { x: x * scaleX, y: (targetH - 4) * scaleY },
          orientation: 'vertical'
        });
      }
    }
  }

  // Also include corners/intersections as point snap targets
  // We can treat points where horizontal and vertical lines meet as junction points
  const points: SnapFeature[] = [];
  for (let i = 0; i < features.length; i++) {
    const f1 = features[i];
    if (f1.orientation !== 'horizontal') continue;
    
    for (let j = 0; j < features.length; j++) {
      const f2 = features[j];
      if (f2.orientation !== 'vertical') continue;

      // Check for proximity / intersections of segments
      const xIntersection = f2.p1!.x;
      const yIntersection = f1.p1!.y;

      // Check if this intersection point is within or very close to both segments
      const withinX = xIntersection >= Math.min(f1.p1!.x, f1.p2!.x) - 10 && xIntersection <= Math.max(f1.p1!.x, f1.p2!.x) + 10;
      const withinY = yIntersection >= Math.min(f2.p1!.y, f2.p2!.y) - 10 && yIntersection <= Math.max(f2.p1!.y, f2.p2!.y) + 10;

      if (withinX && withinY) {
        points.push({
          type: 'point',
          x: xIntersection,
          y: yIntersection,
          orientation: 'point'
        });
      }
    }
  }

  // Filter redundant or overly close points
  const uniquePoints: SnapFeature[] = [];
  for (const pt of points) {
    const exists = uniquePoints.some(u => Math.hypot(u.x! - pt.x!, u.y! - pt.y!) < 15);
    if (!exists) {
      uniquePoints.push(pt);
    }
  }

  return [...features, ...uniquePoints];
}

/**
 * Calculates distance from a point to a line segment.
 */
export function getDistanceToSegment(p: Point, p1: Point, p2: Point): { distance: number; closestPoint: Point } {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) {
    const dist = Math.hypot(p.x - p1.x, p.y - p1.y);
    return { distance: dist, closestPoint: p1 };
  }
  
  let t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  
  const closestPoint = {
    x: p1.x + t * dx,
    y: p1.y + t * dy
  };
  
  const distance = Math.hypot(p.x - closestPoint.x, p.y - closestPoint.y);
  return { distance, closestPoint };
}

/**
 * Snaps a given point to the nearest architectural features if within a certain threshold.
 */
export function snapToFeatures(
  pos: Point,
  features: SnapFeature[],
  threshold: number = 15
): { snappedPos: Point; activeFeature: SnapFeature | null } {
  if (features.length === 0) {
    return { snappedPos: { ...pos }, activeFeature: null };
  }

  let bestDist = threshold;
  let snappedPos = { ...pos };
  let activeFeature: SnapFeature | null = null;

  for (const feature of features) {
    if (feature.type === 'line' && feature.p1 && feature.p2) {
      const { distance, closestPoint } = getDistanceToSegment(pos, feature.p1, feature.p2);
      if (distance < bestDist) {
        bestDist = distance;
        snappedPos = closestPoint;
        activeFeature = feature;
      }
    } else if (feature.type === 'point' && feature.x !== undefined && feature.y !== undefined) {
      const dist = Math.hypot(pos.x - feature.x, pos.y - feature.y);
      if (dist < bestDist) {
        bestDist = dist;
        snappedPos = { x: feature.x, y: feature.y };
        activeFeature = feature;
      }
    }
  }
  return { snappedPos, activeFeature };
}

/**
 * Gets all connection ports of an equipment item.
 */
export function getEquipmentPorts(eq: Equipment, iconScale: number = 1): ConnectionPort[] {
  const ports: { id: string; name: string; dx: number; dy: number }[] = [];

  if (eq.type === 'SWITCH_RACK' || eq.type === 'SERVER_RACK' || eq.type === 'NETWORK') {
    ports.push({ id: 'center', name: 'Center', dx: 0, dy: 0 });
    ports.push({ id: 'p1', name: 'Port 1', dx: -12, dy: -8 });
    ports.push({ id: 'p2', name: 'Port 2', dx: 0, dy: -8 });
    ports.push({ id: 'p3', name: 'Port 3', dx: 12, dy: -8 });
    ports.push({ id: 'uplink', name: 'Uplink', dx: 0, dy: 12 });
  } else if (eq.type === 'CCTV' || eq.type === 'CCTV_DOME' || eq.type === 'CCTV_BULLET') {
    ports.push({ id: 'center', name: 'Center', dx: 0, dy: 0 });
    ports.push({ id: 'video', name: 'Video Out', dx: 0, dy: 16 });
    ports.push({ id: 'power', name: 'Power IN', dx: -12, dy: 10 });
  } else if (eq.type === 'WIFI' || eq.type === 'WIFI_ROUTER') {
    ports.push({ id: 'center', name: 'Center', dx: 0, dy: 0 });
    ports.push({ id: 'lan1', name: 'LAN 1', dx: -10, dy: 12 });
    ports.push({ id: 'lan2', name: 'LAN 2', dx: 10, dy: 12 });
    ports.push({ id: 'power', name: 'Power', dx: 0, dy: -14 });
  } else if (eq.type === 'FIRE' || eq.type === 'FIRE_DETECTOR') {
    ports.push({ id: 'center', name: 'Center', dx: 0, dy: 0 });
    ports.push({ id: 'loop_in', name: 'Loop In', dx: -14, dy: 0 });
    ports.push({ id: 'loop_out', name: 'Loop Out', dx: 14, dy: 0 });
  } else {
    ports.push({ id: 'center', name: 'Center', dx: 0, dy: 0 });
    ports.push({ id: 'north', name: 'Top Port', dx: 0, dy: -18 });
    ports.push({ id: 'south', name: 'Bottom Port', dx: 0, dy: 18 });
    ports.push({ id: 'left', name: 'Left Port', dx: -18, dy: 0 });
    ports.push({ id: 'right', name: 'Right Port', dx: 18, dy: 0 });
  }

  const rad = (eq.rotation || 0) * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return ports.map(p => {
    const lx = p.dx * iconScale;
    const ly = p.dy * iconScale;
    
    const rx = lx * cos - ly * sin;
    const ry = lx * sin + ly * cos;

    return {
      id: p.id,
      name: p.name,
      x: eq.x + rx,
      y: eq.y + ry
    };
  });
}

/**
 * Snaps a given point to the nearest equipment if within a certain threshold.
 */
export function snapToEquipment(
  pos: Point,
  equipment: Equipment[],
  threshold: number = 10,
  scale: number = 1,
  iconScale: number = 1
): { snappedPos: Point; snappedEquipment: Equipment | null; snappedPort: ConnectionPort | null } {
  let bestDist = threshold / scale;
  let snappedPos = { ...pos };
  let snappedEquipment: Equipment | null = null;
  let snappedPort: ConnectionPort | null = null;

  for (const eq of equipment) {
    const ports = getEquipmentPorts(eq, iconScale);
    for (const port of ports) {
      const dist = Math.hypot(pos.x - port.x, pos.y - port.y);
      if (dist < bestDist) {
        bestDist = dist;
        snappedPos = { x: port.x, y: port.y };
        snappedEquipment = eq;
        snappedPort = port;
      }
    }
  }

  return { snappedPos, snappedEquipment, snappedPort };
}

/**
 * Detects alignment guidelines (X or Y) relative to other equipment.
 */
export function detectAlignment(
  current: { x: number, y: number, id: string },
  equipment: Equipment[],
  threshold: number = 10
): { x: number | null, y: number | null, targetsX: Equipment[], targetsY: Equipment[] } {
  let x: number | null = null;
  let y: number | null = null;
  const targetsX: Equipment[] = [];
  const targetsY: Equipment[] = [];
  for (const eq of equipment) {
    if (eq.id === current.id) continue;
    if (Math.abs(current.x - eq.x) < threshold) {
      x = eq.x;
      targetsX.push(eq);
    }
    if (Math.abs(current.y - eq.y) < threshold) {
      y = eq.y;
      targetsY.push(eq);
    }
  }
  return { x, y, targetsX, targetsY };
}

/**
 * Snaps a given point to the nearest grid intersection.
 */
export function snapToGrid(
  pos: Point,
  gridSize: number = 20,
  tolerance: number = 10
): Point {
  const snapX = Math.round(pos.x / gridSize) * gridSize;
  const snapY = Math.round(pos.y / gridSize) * gridSize;
  
  const x = Math.abs(pos.x - snapX) < tolerance ? snapX : pos.x;
  const y = Math.abs(pos.y - snapY) < tolerance ? snapY : pos.y;
  
  return { x, y };
}

/**
 * Snaps a given point to the nearest cable segment.
 */
export function snapToCables(
  pos: Point,
  cables: Cable[],
  threshold: number = 10,
  scale: number = 1
): { snappedPos: Point; activeCable: Cable | null } {
  let bestDist = threshold / scale;
  let snappedPos = { ...pos };
  let activeCable: Cable | null = null;

  for (const cable of cables) {
    if (cable.points.length < 4) continue; // need at least one segment (2 points)
    for (let i = 0; i < cable.points.length - 2; i += 2) {
      const p1 = { x: cable.points[i], y: cable.points[i + 1] };
      const p2 = { x: cable.points[i + 2], y: cable.points[i + 3] };
      const { distance, closestPoint } = getDistanceToSegment(pos, p1, p2);
      if (distance < bestDist) {
        bestDist = distance;
        snappedPos = closestPoint;
        activeCable = cable;
      }
    }
  }

  return { snappedPos, activeCable };
}
