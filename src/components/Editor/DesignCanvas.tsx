import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Group, Line, Circle as KonvaCircle, Rect, Text, Wedge } from 'react-konva';
import useImage from 'use-image';
import { Equipment, Cable, Point, PlanImage, CustomCableType, ConnectionPort } from '../../types';
import { getIconDataUrl } from '../../lib/icon-registry';
import { detectArchitecturalFeatures, snapToFeatures, SnapFeature, snapToEquipment, detectAlignment, snapToGrid, snapToCables, getEquipmentPorts } from '../../lib/snap-utils';
import { Ruler, Check, RefreshCw, Info, ChevronDown, ChevronUp, LayoutGrid, Grid, Video, Wifi, Flame, Siren, Eye, EyeOff, X, MousePointerSquareDashed, Trash2, Copy, RotateCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Move } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Legend } from './Legend';

interface EquipmentIconProps {
  type: string;
  stageScale: number;
  iconScale?: number;
  properties?: Record<string, any>;
}

const EquipmentIcon = React.memo(function EquipmentIcon({ type, stageScale, iconScale = 1, properties }: EquipmentIconProps) {
  if (['RECTANGLE', 'CIRCLE', 'TEXT'].includes(type)) return null;
  const iconKey = properties?.iconKey || type;
  const customColor = properties?.coverageColor;
  const [img] = useImage(getIconDataUrl(iconKey, customColor));
  if (!img) return null;
  const size = (44 * iconScale) / stageScale;
  return (
    <KonvaImage
      image={img}
      width={size}
      height={size}
      x={-size / 2}
      y={-size / 2}
    />
  );
});

interface PlanImageComponentProps {
  image: PlanImage;
  stageScale: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (updated: PlanImage) => void;
  selectedTool: string;
}

const PlanImageComponent = React.memo(function PlanImageComponent({ image, stageScale, isSelected, onSelect, onUpdate, selectedTool }: PlanImageComponentProps) {
  const [img] = useImage(image.src);
  if (!img) return null;

  return (
    <Group
      x={image.x}
      y={image.y}
      rotation={image.rotation}
      draggable={selectedTool === 'SELECT'}
      listening={selectedTool === 'SELECT'}
      onClick={(e) => {
        if (selectedTool === 'SELECT') {
          e.cancelBubble = true;
          onSelect(image.id);
        }
      }}
      onTap={(e) => {
        if (selectedTool === 'SELECT') {
          e.cancelBubble = true;
          onSelect(image.id);
        }
      }}
      onDragMove={(e) => {
        e.cancelBubble = true;
      }}
      onDragEnd={(e) => {
        e.cancelBubble = true;
        onUpdate({
          ...image,
          x: e.target.x(),
          y: e.target.y()
        });
      }}
    >
      <KonvaImage
        image={img}
        width={image.width}
        height={image.height}
        x={-image.width / 2}
        y={-image.height / 2}
        opacity={0.85}
      />
      {isSelected && (
        <Rect
          x={-image.width / 2}
          y={-image.height / 2}
          width={image.width}
          height={image.height}
          stroke="#3b82f6"
          strokeWidth={2 / stageScale}
          dash={[4 / stageScale, 4 / stageScale]}
        />
      )}
    </Group>
  );
});

const CableNode = React.memo(function CableNode({ cable, stageScale, isSelected, selectedTool, onEquipmentClick, opacity = 1 }: any) {
  return (
    <Line
      points={cable.points}
      stroke={isSelected ? '#ffffff' : cable.color}
      strokeWidth={(cable.strokeWidth ?? 2) / stageScale}
      lineCap="round"
      lineJoin="round"
      dash={cable.dash?.map((d: number) => d / stageScale) ?? undefined}
      tension={cable.type === 'curved' ? (cable.tension ?? 0.4) : 0}
      shadowColor={isSelected ? '#3b82f6' : 'transparent'}
      shadowBlur={isSelected ? 10 : 0}
      hitStrokeWidth={10 / stageScale} // make it easier to click
      listening={selectedTool === 'SELECT'}
      opacity={opacity}
      onClick={(e) => {
        if (selectedTool === 'SELECT') {
          e.cancelBubble = true;
          onEquipmentClick(cable.id);
        }
      }}
      onTap={(e) => {
        if (selectedTool === 'SELECT') {
          e.cancelBubble = true;
          onEquipmentClick(cable.id);
        }
      }}
    />
  );
});

const getArcPoints = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
  if (Math.abs(endAngle - startAngle) < 1) return [];
  const points = [];
  // Offset by -90 deg so 0 deg corresponds to straight up
  const startRad = (startAngle - 90) * Math.PI / 180;
  const endRad = (endAngle - 90) * Math.PI / 180;
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const angle = startRad + (endRad - startRad) * (i / steps);
    points.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  return points;
};

const getCameraSpecs = (focalLength: number = 2.8, customReach?: number, customFov?: number) => {
  const fl = Number(focalLength);
  let baseFov = 100;
  let baseReach = 110;
  if (fl === 2.8) { baseFov = 100; baseReach = 110; }
  else if (fl === 4) { baseFov = 80; baseReach = 140; }
  else if (fl === 6) { baseFov = 60; baseReach = 180; }
  else if (fl === 8) { baseFov = 45; baseReach = 220; }
  else if (fl === 12) { baseFov = 25; baseReach = 280; }
  return {
    fovAngle: customFov !== undefined ? customFov : baseFov,
    reach: customReach !== undefined ? customReach : baseReach
  };
};

const EquipmentNode = React.memo(function EquipmentNode({ 
  item,
  opacity, 
  stageScale, 
  iconScale, 
  isSelected,
  selectedTool, 
  enableSnapping,
  enableGridSnapping,
  gridSize = 20,
  detectedFeatures,
  equipment,
  cables,
  onEquipmentClick,
  onShiftEquipmentClick,
  onUpdateEquipment,
  setGuidelines,
  setSnapFeedback,
  theme = 'dark',
  visibleCoverage = { cctv: true, wifi: true, fire: true, network: true },
  isGroupSelected = false,
  onGroupToggle,
  onGroupDragStart,
  onGroupDragMove,
  onGroupDragEnd
}: any) {
  const [localRotation, setLocalRotation] = useState(item.rotation);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    if (!isRotating) {
      setLocalRotation(item.rotation);
    }
  }, [item.rotation, isRotating]);

  const handleRotationDragMove = (e: any) => {
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Get the center of the equipment in absolute coordinates
    const mainGroup = e.target.getParent().getParent();
    const absPos = mainGroup.getAbsolutePosition();

    // Calculate angle in radians, then convert to degrees
    const angle = Math.atan2(pointerPos.y - absPos.y, pointerPos.x - absPos.x);
    let degree = (angle * 180) / Math.PI - 90; // Subtract 90 because handle is now at the bottom
    
    // Snap to 15 degree increments if shift is pressed (simulated or just as default)
    if (Math.abs(degree % 15) < 5) {
      degree = Math.round(degree / 15) * 15;
    }

    // Normalize degree to 0-360
    degree = (degree + 360) % 360;

    setLocalRotation(degree);
    mainGroup.rotation(degree);
  };

  const handleRotationDragEnd = () => {
    setIsRotating(false);
    if (onUpdateEquipment) {
      onUpdateEquipment({
        ...item,
        rotation: localRotation
      });
    }
  };

  const handleSize = (44 * iconScale) / stageScale;
  const rotationHandleDistance = handleSize / 2 + 30 / stageScale;

  return (
    <Group
      id={item.id}
      name={item.id}
      x={item.x}
      y={item.y}
      rotation={isRotating ? localRotation : item.rotation}
      opacity={opacity}
      listening={selectedTool === 'SELECT' || selectedTool === 'MARQUEE'}
      onClick={(e) => {
        if (selectedTool === 'SELECT' || selectedTool === 'MARQUEE') {
          e.cancelBubble = true;
          if (selectedTool === 'MARQUEE') {
            if (onGroupToggle) {
              onGroupToggle(item.id);
            }
          } else if (e.evt && e.evt.shiftKey) {
            if (onShiftEquipmentClick) {
              onShiftEquipmentClick(item);
            }
          } else {
            onEquipmentClick(item.id);
          }
        }
      }}
      onTap={(e) => {
        if (selectedTool === 'SELECT' || selectedTool === 'MARQUEE') {
          e.cancelBubble = true;
          if (selectedTool === 'MARQUEE') {
            if (onGroupToggle) {
              onGroupToggle(item.id);
            }
          } else if (e.evt && e.evt.shiftKey) {
            if (onShiftEquipmentClick) {
              onShiftEquipmentClick(item);
            }
          } else {
            onEquipmentClick(item.id);
          }
        }
      }}
      draggable={selectedTool === 'SELECT' || (selectedTool === 'MARQUEE' && isGroupSelected)}
      onDragStart={(e) => {
        if (onGroupDragStart) {
          onGroupDragStart(item.id, e);
        }
      }}
      onDragMove={(e) => {
        const x = e.target.x();
        const y = e.target.y();

        let finalX = x;
        let finalY = y;
        let activeFeature = null;

        // 1. Grid Snapping
        if (enableGridSnapping) {
          const gridPos = snapToGrid({ x, y }, gridSize);
          finalX = gridPos.x;
          finalY = gridPos.y;
        }

        if (enableSnapping) {
          // 2. Feature Snapping
          const { snappedPos: featurePos, activeFeature: matchedFeature } = snapToFeatures({ x: finalX, y: finalY }, detectedFeatures, 15);
          finalX = featurePos.x;
          finalY = featurePos.y;
          activeFeature = matchedFeature;

          // 3. Cable Snapping
          const targetStageScale = e.target.getStage()?.scaleX() || 1;
          const { snappedPos: cablePos } = snapToCables({ x: finalX, y: finalY }, cables, 15, targetStageScale);
          finalX = cablePos.x;
          finalY = cablePos.y;
          
          // 4. Alignment Snapping
          const { x: alignX, y: alignY, targetsX, targetsY } = detectAlignment(
            { x: finalX, y: finalY, id: item.id },
            equipment,
            15
          );

          if (alignX !== null) finalX = alignX;
          if (alignY !== null) finalY = alignY;

          setGuidelines({ 
            x: alignX, 
            y: alignY, 
            targetsX, 
            targetsY, 
            activeId: item.id, 
            activeX: finalX, 
            activeY: finalY 
          });
        }

        e.target.x(finalX);
        e.target.y(finalY);

        setSnapFeedback({
          x: finalX,
          y: finalY,
          feature: activeFeature
        });

        if (onGroupDragMove) {
          onGroupDragMove(item.id, finalX, finalY, e);
        }
      }}
      onDragEnd={(e) => {
        setSnapFeedback(null);
        setGuidelines(null);
        if (onGroupDragEnd) {
          onGroupDragEnd(item.id, e.target.x(), e.target.y(), e);
        } else if (onUpdateEquipment) {
          onUpdateEquipment({
            ...item,
            x: e.target.x(),
            y: e.target.y()
          });
        }
      }}
    >
      {/* CCTV Camera (Dome shape with visual blue lens and FOV angle) */}
      {(item.type === 'CCTV' || item.type === 'CCTV_DOME' || item.type === 'CCTV_BULLET') && visibleCoverage.cctv && (() => {
        const specs = getCameraSpecs(
          item.properties?.focalLength || 2.8,
          item.properties?.reach,
          item.properties?.fovAngle
        );
        return (
          <Wedge
            x={0}
            y={0}
            radius={specs.reach}
            angle={specs.fovAngle}
            rotation={-90 - specs.fovAngle / 2}
            fill={item.properties?.coverageColor || "#3b82f6"}
            stroke={item.properties?.coverageColor || "#3b82f6"}
            opacity={item.properties?.coverageOpacity || 0.12}
            strokeWidth={1 / stageScale}
            dash={[4 / stageScale, 4 / stageScale]}
          />
        );
      })()}
      
      {/* WIFI Access Point (Circular high-speed dish with waves) */}
      {(item.type === 'WIFI' || item.type === 'WIFI_ROUTER') && visibleCoverage.wifi && (() => {
        const rVal = item.properties?.coverageRange || 80;
        const color = item.properties?.coverageColor || "#22c55e";
        const opacity = item.properties?.coverageOpacity || 0.18;
        return (
          <React.Fragment>
            {/* Safety propagation range background indicator */}
            <KonvaCircle
              radius={rVal}
              fill={color}
              opacity={opacity}
            />

            {/* Concentric broadcast waves */}
            <KonvaCircle
              radius={20 / stageScale}
              stroke={color}
              opacity={opacity}
              strokeWidth={0.75 / stageScale}
              dash={[3 / stageScale, 3 / stageScale]}
            />
          </React.Fragment>
        );
      })()}

      {/* FIRE Smoke/Heat Detector (Red safety detector shape with vent lanes) */}
      {(item.type === 'FIRE' || item.type === 'FIRE_DETECTOR') && visibleCoverage.fire && (
        /* Alarm range circle */
        <KonvaCircle
          radius={item.properties?.coverageRange || 50}
          fill={item.properties?.coverageColor || "#ef4444"}
          stroke={item.properties?.coverageColor || "#ef4444"}
          opacity={item.properties?.coverageOpacity || 0.18}
          strokeWidth={1 / stageScale}
          dash={[4 / stageScale, 4 / stageScale]}
        />
      )}

      {/* Alarm Siren Beacon */}
      {item.type === 'ALARM_SIREN' && (visibleCoverage.fire || visibleCoverage.network) && (
        /* Alarm range circle */
        <KonvaCircle
          radius={item.properties?.coverageRange || 60}
          fill={item.properties?.coverageColor || "#f43f5e"}
          stroke={item.properties?.coverageColor || "#f43f5e"}
          opacity={item.properties?.coverageOpacity || 0.25}
          strokeWidth={1 / stageScale}
          dash={[2 / stageScale, 4 / stageScale]}
        />
      )}

      {/* Centralized High-Consistency SVG Icon */}
      <EquipmentIcon type={item.type} stageScale={stageScale} iconScale={iconScale} properties={item.properties} />

      {item.type === 'RECTANGLE' && <Rect width={item.properties?.width || 100} height={item.properties?.height || 50} stroke="black" strokeWidth={2 / stageScale} x={-(item.properties?.width || 100)/2} y={-(item.properties?.height || 50)/2} />}
      {item.type === 'CIRCLE' && <KonvaCircle radius={item.properties?.radius || 50} stroke="black" strokeWidth={2 / stageScale} />}
      {item.type === 'TEXT' && <Text text={item.properties?.text || "Edit Text"} fontSize={16 / stageScale} fill="black" x={-20} y={-8} />}

      {/* Device Model Label */}
      <Text
        text={item.subType}
        fontSize={8 / stageScale}
        fill="#000000"
        y={(22 * iconScale + 6) / stageScale}
        align="center"
        width={90 / stageScale}
        x={0}
        offsetX={45 / stageScale}
        rotation={-(isRotating ? localRotation : item.rotation)}
        fontStyle="bold"
        shadowColor={theme === 'dark' ? "white" : "transparent"}
        shadowBlur={theme === 'dark' ? 3 : 0}
        shadowOffset={{ x: 1, y: 1 }}
        shadowOpacity={0.85}
      />

          {/* Rotation Handle UI (Visible only when selected) */}
          {isSelected && selectedTool === 'SELECT' && (
            <Group>
              {/* Stem line - now pointing downwards (back) */}
              <Line
                points={[0, handleSize / 2, 0, rotationHandleDistance]}
                stroke={theme === 'dark' ? "#71717a" : "#94a3b8"}
                strokeWidth={2 / stageScale}
                dash={[2 / stageScale, 2 / stageScale]}
                opacity={0.6}
              />
              
              {/* Rotation Handle Circle */}
              <KonvaCircle
                y={rotationHandleDistance}
                radius={9 / stageScale}
                fill={theme === 'dark' ? "#3f3f46" : "#f1f5f9"}
                stroke={theme === 'dark' ? "#71717a" : "#94a3b8"}
                strokeWidth={2 / stageScale}
                shadowColor="black"
                shadowBlur={4}
                draggable
                onDragStart={() => setIsRotating(true)}
                onDragMove={handleRotationDragMove}
                onDragEnd={handleRotationDragEnd}
                onMouseEnter={(e: any) => {
                  const container = e.target.getStage().container();
                  container.style.cursor = 'grab';
                }}
                onMouseLeave={(e: any) => {
                  const container = e.target.getStage().container();
                  container.style.cursor = 'default';
                }}
              />
              {/* Rotate Icon/Text inside handle */}
              <Text
                text="⟳"
                y={rotationHandleDistance - 5 / stageScale}
                x={-5 / stageScale}
                fontSize={10 / stageScale}
                fill={theme === 'dark' ? "#a1a1aa" : "#475569"}
                listening={false}
                fontStyle="bold"
              />

          {/* Selection Ring */}
          <KonvaCircle
            radius={handleSize / 2 + 4 / stageScale}
            stroke="#3b82f6"
            strokeWidth={2 / stageScale}
            dash={[4 / stageScale, 4 / stageScale]}
          />

          {/* Rotation Angle Indicator (Tooltip) */}
          {(isRotating || isSelected) && (
            <Group y={-rotationHandleDistance - 25 / stageScale}>
              <Rect
                x={-15 / stageScale}
                y={-8 / stageScale}
                width={30 / stageScale}
                height={16 / stageScale}
                fill="rgba(0,0,0,0.75)"
                cornerRadius={4 / stageScale}
              />
              <Text
                text={`${Math.round(localRotation)}°`}
                fontSize={10 / stageScale}
                fill="white"
                width={30 / stageScale}
                x={-15 / stageScale}
                y={-5 / stageScale}
                align="center"
                fontStyle="bold"
              />
            </Group>
          )}
        </Group>
      )}

      {isSelected && (() => {
        const isCamera = item.type === 'CCTV' || item.type === 'CCTV_DOME' || item.type === 'CCTV_BULLET';
        const isWifi = item.type === 'WIFI' || item.type === 'WIFI_ROUTER';
        const isFire = item.type === 'FIRE' || item.type === 'FIRE_DETECTOR';
        const isSiren = item.type === 'ALARM_SIREN';
        if (!isCamera && !isWifi && !isFire && !isSiren) return null;

        const specs = isCamera 
          ? getCameraSpecs(item.properties?.focalLength || 2.8, item.properties?.reach, item.properties?.fovAngle)
          : { reach: item.properties?.coverageRange || (isWifi ? 80 : isFire ? 50 : isSiren ? 60 : 0), fovAngle: 360 };

        const visualReach = Math.max(specs.reach, (28 * iconScale) / stageScale);
        const pointingAngleRad = ((isRotating ? localRotation : item.rotation) - 90) * Math.PI / 180;
        const reachHandleX = visualReach * Math.cos(pointingAngleRad);
        const reachHandleY = visualReach * Math.sin(pointingAngleRad);
        const handleColor = isCamera ? '#3b82f6' : isWifi ? '#22c55e' : isFire ? '#ef4444' : '#f43f5e';

        return (
          <Group>
            <Line
              points={[0, 0, reachHandleX, reachHandleY]}
              stroke={handleColor}
              strokeWidth={1 / stageScale}
              dash={[3, 3]}
              opacity={0.6}
              listening={false}
            />
            <KonvaCircle
              x={reachHandleX}
              y={reachHandleY}
              radius={8 / stageScale}
              fill={handleColor}
              stroke="#ffffff"
              strokeWidth={1.5 / stageScale}
              shadowColor="#000000"
              shadowBlur={4}
              draggable
              onDragStart={(e) => {
                e.cancelBubble = true;
              }}
              onDragMove={(e) => {
                e.cancelBubble = true;
                const dragNode = e.target;
                const stage = dragNode.getStage();
                const pointer = stage.getPointerPosition();
                if (!pointer) return;
                const transform = stage.getAbsoluteTransform().copy().invert();
                const pointerWorld = transform.point(pointer);
                const dx = pointerWorld.x - item.x;
                const dy = pointerWorld.y - item.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const newReach = Math.min(10000, Math.max(20, Math.round(dist)));
                if (onUpdateEquipment) {
                  onUpdateEquipment({
                    ...item,
                    properties: {
                      ...item.properties,
                      [isCamera ? 'reach' : 'coverageRange']: newReach
                    }
                  });
                }
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
                e.target.x(reachHandleX);
                e.target.y(reachHandleY);
              }}
            />
            {isCamera && (() => {
              const fovStartAngleRad = ((isRotating ? localRotation : item.rotation) - 90 - specs.fovAngle / 2) * Math.PI / 180;
              const fovHandleX = visualReach * Math.cos(fovStartAngleRad);
              const fovHandleY = visualReach * Math.sin(fovStartAngleRad);
              return (
                <Group>
                  <Line
                    points={[0, 0, fovHandleX, fovHandleY]}
                    stroke="#a78bfa"
                    strokeWidth={1 / stageScale}
                    dash={[3, 3]}
                    opacity={0.6}
                    listening={false}
                  />
                  <KonvaCircle
                    x={fovHandleX}
                    y={fovHandleY}
                    radius={8 / stageScale}
                    fill="#8b5cf6"
                    stroke="#ffffff"
                    strokeWidth={1.5 / stageScale}
                    shadowColor="#000000"
                    shadowBlur={4}
                    draggable
                    onDragStart={(e) => {
                      e.cancelBubble = true;
                    }}
                    onDragMove={(e) => {
                      e.cancelBubble = true;
                      const dragNode = e.target;
                      const stage = dragNode.getStage();
                      const pointer = stage.getPointerPosition();
                      if (!pointer) return;
                      const transform = stage.getAbsoluteTransform().copy().invert();
                      const pointerWorld = transform.point(pointer);
                      const dx = pointerWorld.x - item.x;
                      const dy = pointerWorld.y - item.y;
                      const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
                      
                      // Calculate new FOV based on angle difference
                      const startAngle = ((isRotating ? localRotation : item.rotation) - specs.fovAngle / 2);
                      const newFov = Math.min(360, Math.max(10, Math.round((angle - startAngle) * 2)));

                      if (onUpdateEquipment) {
                        onUpdateEquipment({
                          ...item,
                          properties: {
                            ...item.properties,
                            fovAngle: newFov
                          }
                        });
                      }
                    }}
                    onDragEnd={(e) => {
                      e.cancelBubble = true;
                      e.target.x(fovHandleX);
                      e.target.y(fovHandleY);
                    }}
                  />
                </Group>
              );
            })()}
          </Group>
        );
      })()}

      {/* Group Selection Ring */}
      {isGroupSelected && (
        <KonvaCircle
          radius={handleSize / 2 + 6 / stageScale}
          stroke="#10b981"
          strokeWidth={2.5 / stageScale}
          dash={[5 / stageScale, 4 / stageScale]}
        />
      )}
    </Group>
  );
});

interface CanvasProps {
  backgroundImage?: string;
  width: number;
  height: number;
  zoom: number;
  setZoom: (z: number) => void;
  equipment: Equipment[];
  cables: Cable[];
  onEquipmentClick: (id: string) => void;
  onCanvasClick: (pos: Point) => void;
  selectedTool: string;
  onAddEquipmentAt?: (type: any, pos: Point) => void;
  onUpdateEquipment?: (updated: Equipment) => void;
  onUpdateMultipleEquipment?: (updatedList: Equipment[]) => void;
  onAddMultipleEquipment?: (newItems: Equipment[]) => void;
  onDeleteMultipleEquipment?: (ids: string[]) => void;
  selectedEquipmentId?: string | null;
  onDeleteEquipment?: (id: string) => void;
  onAddCable?: (
    points: Point[],
    type: string,
    tension?: number,
    color?: string,
    strokeWidth?: number,
    cableTypeId?: string
  ) => void;
  scaleRatio?: number;
  onUpdateScaleRatio?: (ratio: number) => void;
  iconScale?: number;
  sheet?: import('../../types').PlanSheet;
  onUpdateSheet?: (updated: import('../../types').PlanSheet) => void;
  layers: import('../../types').Layer[];
  customCableTypes?: CustomCableType[];
  customEquipmentTypes?: import('../../types').CustomEquipmentType[];
  theme?: 'dark' | 'light';
}

const getEquipmentLabel = (item: Equipment) => {
  if (item.properties?.name) return item.properties.name;
  if (item.properties?.label) return item.properties.label;
  const rawLabel = item.subType || item.type;
  return rawLabel
    .split('_')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export default function DesignCanvas({
  backgroundImage,
  width,
  height,
  zoom,
  setZoom,
  equipment,
  cables,
  onEquipmentClick,
  onCanvasClick,
  selectedTool,
  onAddEquipmentAt,
  onUpdateEquipment,
  onUpdateMultipleEquipment,
  onAddMultipleEquipment,
  onDeleteMultipleEquipment,
  selectedEquipmentId,
  onDeleteEquipment,
  onAddCable,
  scaleRatio = 20,
  onUpdateScaleRatio,
  iconScale = 1,
  sheet,
  onUpdateSheet,
  layers,
  customCableTypes = [],
  customEquipmentTypes = [],
  theme = 'dark'
}: CanvasProps) {
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastLoadedImageRef = useRef<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });
  const [bgImage] = useImage(backgroundImage || '');
  const [stageScale, setStageScale] = useState(zoom);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [lastDist, setLastDist] = useState(0);
  const [lastCenter, setLastCenter] = useState<Point | null>(null);

  const [visibleCoverage, setVisibleCoverage] = useState({
    cctv: true,
    wifi: true,
    fire: true,
    network: true
  });

  const [isLegendCollapsed, setIsLegendCollapsed] = useState<boolean>(false);

  // Selection Marquee / Group Action States
  const [marqueeStart, setMarqueeStart] = useState<Point | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<Point | null>(null);
  const [marqueeSelectedIds, setMarqueeSelectedIds] = useState<string[]>([]);
  const [dragStartPositions, setDragStartPositions] = useState<{ [id: string]: { x: number, y: number } }>({});

  const handleGroupToggle = (id: string) => {
    setMarqueeSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleGroupDragStart = (id: string, e: any) => {
    const positions: { [key: string]: { x: number, y: number } } = {};
    marqueeSelectedIds.forEach(selectedId => {
      const item = equipment.find(eq => eq.id === selectedId);
      if (item) {
        positions[selectedId] = { x: item.x, y: item.y };
      }
    });
    setDragStartPositions(positions);
  };

  const handleGroupDragMove = (draggedId: string, finalX: number, finalY: number, e: any) => {
    const startPosDrag = dragStartPositions[draggedId];
    if (!startPosDrag) return;

    const dx = finalX - startPosDrag.x;
    const dy = finalY - startPosDrag.y;

    const stage = stageRef.current;
    if (!stage) return;

    marqueeSelectedIds.forEach(id => {
      if (id === draggedId) return;
      const startPos = dragStartPositions[id];
      if (startPos) {
        const node = stage.findOne('#' + id);
        if (node) {
          node.x(startPos.x + dx);
          node.y(startPos.y + dy);
        }
      }
    });
  };

  const handleGroupDragEnd = (draggedId: string, finalX: number, finalY: number, e: any) => {
    const startPosDrag = dragStartPositions[draggedId];
    if (!startPosDrag) {
      setDragStartPositions({});
      return;
    }

    const dx = finalX - startPosDrag.x;
    const dy = finalY - startPosDrag.y;

    const updatedItems = marqueeSelectedIds.map(id => {
      const item = equipment.find(eq => eq.id === id);
      if (!item) return null;
      if (id === draggedId) {
        return { ...item, x: finalX, y: finalY };
      }
      const startPos = dragStartPositions[id];
      return { ...item, x: startPos.x + dx, y: startPos.y + dy };
    }).filter((item): item is Equipment => item !== null);

    if (onUpdateMultipleEquipment) {
      onUpdateMultipleEquipment(updatedItems);
    } else if (onUpdateEquipment) {
      updatedItems.forEach(item => onUpdateEquipment(item));
    }

    setDragStartPositions({});
  };

  const handleGroupRotate = (angleDegrees: number) => {
    const angleRad = (angleDegrees * Math.PI) / 180;
    const validItems = equipment.filter(eq => marqueeSelectedIds.includes(eq.id));
    if (validItems.length === 0) return;

    let sumX = 0;
    let sumY = 0;
    validItems.forEach(item => {
      sumX += item.x;
      sumY += item.y;
    });
    const centroidX = sumX / validItems.length;
    const centroidY = sumY / validItems.length;

    const updatedItems = validItems.map(item => {
      const dx = item.x - centroidX;
      const dy = item.y - centroidY;
      const rotatedX = centroidX + dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
      const rotatedY = centroidY + dy * Math.cos(angleRad) + dx * Math.sin(angleRad);
      const newRotation = ((item.rotation || 0) + angleDegrees + 360) % 360;

      return {
        ...item,
        x: Math.round(rotatedX),
        y: Math.round(rotatedY),
        rotation: newRotation
      };
    });

    if (onUpdateMultipleEquipment) {
      onUpdateMultipleEquipment(updatedItems);
    } else if (onUpdateEquipment) {
      updatedItems.forEach(item => onUpdateEquipment(item));
    }
  };

  const handleGroupDuplicate = () => {
    const validItems = equipment.filter(eq => marqueeSelectedIds.includes(eq.id));
    if (validItems.length === 0) return;

    const duplicates = validItems.map(item => {
      return {
        ...item,
        id: Math.random().toString(36).substr(2, 9),
        x: item.x + 35,
        y: item.y + 35
      };
    });

    if (onAddMultipleEquipment) {
      onAddMultipleEquipment(duplicates);
    }

    setMarqueeSelectedIds(duplicates.map(d => d.id));
  };

  const handleGroupDelete = () => {
    if (onDeleteMultipleEquipment) {
      onDeleteMultipleEquipment(marqueeSelectedIds);
    } else if (onDeleteEquipment) {
      marqueeSelectedIds.forEach(id => onDeleteEquipment(id));
    }
    setMarqueeSelectedIds([]);
  };

  // Observe container resizing and update canvas Stage size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeoutId: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions({
          width: Math.floor(width) || 1000,
          height: Math.floor(height) || 700
        });
      }, 50);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  // Auto-fit plan image inside the dynamic stage dimensions on initial load
  useEffect(() => {
    if (!bgImage || dimensions.width === 0 || dimensions.height === 0 || !width || !height) return;
    if (lastLoadedImageRef.current === backgroundImage) return;

    // Calculate scale to fit the entire plan image inside the canvas dimensions
    const scaleX = dimensions.width / width;
    const scaleY = dimensions.height / height;
    const bestScale = Math.min(scaleX, scaleY) * 0.95; // 95% scale for premium aesthetic margins

    const posX = (dimensions.width - width * bestScale) / 2;
    const posY = (dimensions.height - height * bestScale) / 2;

    setStageScale(bestScale);
    setStagePos({ x: posX, y: posY });
    setZoom(bestScale);

    lastLoadedImageRef.current = backgroundImage || null;
  }, [bgImage, backgroundImage, width, height, dimensions.width, dimensions.height, setZoom]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [guidelines, setGuidelines] = useState<{ x: number | null, y: number | null, targetsX?: Equipment[], targetsY?: Equipment[], activeId?: string, activeX?: number, activeY?: number } | null>(null);

  // Measuring States
  const [measurePoints, setMeasurePoints] = useState<Point[]>([]);
  const [measureMode, setMeasureMode] = useState<'single' | 'path'>('single');
  const [tempScaleVal, setTempScaleVal] = useState<number | undefined>(undefined);
  const [calibratedSuccess, setCalibratedSuccess] = useState(false);

  // Shift-clicking equipment distance measuring
  const [shiftSelectedEquipIds, setShiftSelectedEquipIds] = useState<string[]>([]);
  const shiftSelectedEquips = shiftSelectedEquipIds
    .map(id => equipment.find(e => e.id === id))
    .filter((e): e is Equipment => !!e);

  const handleShiftEquipmentClick = (item: Equipment) => {
    setShiftSelectedEquipIds((prev) => {
      if (prev.includes(item.id)) {
        return prev.filter(id => id !== item.id);
      }
      if (prev.length >= 2) {
        return [item.id];
      }
      return [...prev, item.id];
    });
  };

  // Cable Drawing States
  const [cableDraftPoints, setCableDraftPoints] = useState<Point[]>([]);
  const [cableType, setCableType] = useState<'straight' | 'curved'>('straight');
  const [cableTension, setCableTension] = useState<number>(0.4);
  const [selectedCableTypeId, setSelectedCableTypeId] = useState<string>('');

  useEffect(() => {
    if (customCableTypes.length > 0 && !selectedCableTypeId) {
      setSelectedCableTypeId(customCableTypes[0].id);
    }
  }, [customCableTypes, selectedCableTypeId]);

  // Reset measurement if selectedTool changes
  useEffect(() => {
    setMeasurePoints([]);
    setTempScaleVal(undefined);
    setCableDraftPoints([]);
    setShiftSelectedEquipIds([]);
  }, [selectedTool]);

  // Reset measurement if mode changes
  useEffect(() => {
    setMeasurePoints([]);
  }, [measureMode]);

  // Automatic alignment snapping states
  const [detectedFeatures, setDetectedFeatures] = useState<SnapFeature[]>([]);
  const [snapFeedback, setSnapFeedback] = useState<{
    x: number;
    y: number;
    feature: SnapFeature | null;
    snappedEquipment?: Equipment | null;
    snappedPort?: ConnectionPort | null;
  } | null>(null);
  const [enableSnapping, setEnableSnapping] = useState<boolean>(true);
  const [enableGridSnapping, setEnableGridSnapping] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(20);
  const [showCanvasLegend, setShowCanvasLegend] = useState<boolean>(false);
  const [legendExpanded, setLegendExpanded] = useState<boolean>(true);

  // Keep internal scale in sync with parent zoom prop
  useEffect(() => {
    setStageScale(zoom);
  }, [zoom]);

  // Analyze background plan image for architectural features (walls, edges, junctions) when loaded
  useEffect(() => {
    if (!bgImage) {
      setDetectedFeatures([]);
      return;
    }

    const runDetection = () => {
      try {
        const features = detectArchitecturalFeatures(bgImage, width, height);
        setDetectedFeatures(features);
      } catch (err) {
        console.warn("Snapping feature detection failed:", err);
      }
    };

    if (bgImage.complete) {
      runDetection();
    } else {
      bgImage.onload = runDetection;
    }
  }, [bgImage, width, height]);

  // Press 'S' key to toggle alignment snapping, Delete to remove selected item, and Arrow keys/R to rotate
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      // Toggle snapping with S
      if (e.key === 's' || e.key === 'S') {
        setEnableSnapping(prev => !prev);
      }

      if (e.key === 'g' || e.key === 'G') {
        setEnableGridSnapping(prev => !prev);
        e.preventDefault();
      }

      if (marqueeSelectedIds.length > 0) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          handleGroupDelete();
          e.preventDefault();
          return;
        } else if (e.key === 'r' || e.key === 'R') {
          handleGroupRotate(15);
          e.preventDefault();
          return;
        }

        const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
        if (isArrowKey) {
          const shiftValue = e.shiftKey ? 20 : 5;
          let dx = 0;
          let dy = 0;
          if (e.key === 'ArrowUp') dy = -shiftValue;
          if (e.key === 'ArrowDown') dy = shiftValue;
          if (e.key === 'ArrowLeft') dx = -shiftValue;
          if (e.key === 'ArrowRight') dx = shiftValue;

          const updatedItems = equipment.filter(eq => marqueeSelectedIds.includes(eq.id)).map(item => {
            return {
              ...item,
              x: item.x + dx,
              y: item.y + dy
            };
          });

          if (onUpdateMultipleEquipment) {
            onUpdateMultipleEquipment(updatedItems);
          } else if (onUpdateEquipment) {
            updatedItems.forEach(item => onUpdateEquipment(item));
          }
          e.preventDefault();
          return;
        }
      }

      if (selectedEquipmentId) {
        const item = equipment.find(eq => eq.id === selectedEquipmentId);
        if (!item) return;

        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (onDeleteEquipment) {
            onDeleteEquipment(selectedEquipmentId);
          }
          e.preventDefault();
        } else if (e.key === 'r' || e.key === 'R') {
          if (onUpdateEquipment) {
            onUpdateEquipment({
              ...item,
              rotation: (item.rotation + 15) % 360
            });
          }
          e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
          if (onUpdateEquipment) {
            onUpdateEquipment({
              ...item,
              rotation: (item.rotation - 5 + 360) % 360
            });
          }
          e.preventDefault();
        } else if (e.key === 'ArrowRight') {
          if (onUpdateEquipment) {
            onUpdateEquipment({
              ...item,
              rotation: (item.rotation + 5) % 360
            });
          }
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedEquipmentId, equipment, onUpdateEquipment, onDeleteEquipment, marqueeSelectedIds, onUpdateMultipleEquipment, onDeleteMultipleEquipment]);

  // Reset measure points when tool changes
  useEffect(() => {
    if (selectedTool !== 'MEASURE') {
      setMeasurePoints([]);
    }
  }, [selectedTool]);

  // Handle stage clicks
  const handleStageClick = (e: any) => {
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Transform stage-space coordinate to layout coordinate
    const transform = stage.getAbsoluteTransform().copy().invert();
    let pos = transform.point(pointerPosition);

    // Apply snapping to placed equipment if enabled
    if ((enableSnapping || enableGridSnapping) && selectedTool !== 'SELECT') {
      let finalPos = { ...pos };
      
      if (enableGridSnapping) {
        finalPos = snapToGrid(pos, gridSize);
      }

      if (enableSnapping) {
        const { snappedPos: featurePos } = snapToFeatures(finalPos, detectedFeatures, 15);
        finalPos = featurePos;

        const stageScale = stage ? stage.scaleX() : 1;
        const { snappedPos: cablePos } = snapToCables(finalPos, cables, 15, stageScale);
        finalPos = cablePos;

        if (selectedTool === 'CABLE') {
          const { snappedPos: eqPos } = snapToEquipment(finalPos, equipment, 15, stageScale, iconScale);
          finalPos = eqPos;
        }
      }
      
      pos = finalPos;
    }

    if (selectedTool === 'MEASURE') {
      if (measureMode === 'single') {
        if (measurePoints.length >= 2) {
          setMeasurePoints([pos]);
        } else {
          setMeasurePoints(prev => [...prev, pos]);
        }
      } else {
        setMeasurePoints(prev => [...prev, pos]);
      }
      return;
    }

    if (selectedTool === 'CABLE') {
      let posToPlace = pos;
      if (enableSnapping) {
        const { snappedPos } = snapToFeatures(pos, detectedFeatures, 15);
        const stage = e.target.getStage();
        const stageScale = stage ? stage.scaleX() : 1;
        const { snappedPos: eqSnappedPos } = snapToEquipment(snappedPos, equipment, 15, stageScale, iconScale);
        posToPlace = eqSnappedPos;
      }
      setCableDraftPoints(prev => [...prev, posToPlace]);
      return;
    }

    if (selectedTool === 'MARQUEE') {
      if (e.target === stage || e.target.name() === 'background-plan') {
        setMarqueeSelectedIds([]);
        onEquipmentClick(null as any);
      }
    } else if (selectedTool !== 'SELECT') {
      onCanvasClick(pos);
    } else if (e.target === stage || e.target.name() === 'background-plan') {
      onEquipmentClick(null as any);
    }
  };

  // Wheel zoom centered on cursor
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // More natural geometric zoom factor
    const delta = e.evt.deltaY;
    
    // Smooth factor calculation
    const zoomSpeed = 0.0012;
    const factor = Math.pow(2, -delta * zoomSpeed);
    const newScale = oldScale * factor;
    
    // Bounds for stability
    const boundedScale = Math.max(0.05, Math.min(100, newScale));
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * boundedScale,
      y: pointer.y - mousePointTo.y * boundedScale,
    };

    // Update local state for immediate visual feedback
    setStageScale(boundedScale);
    setStagePos(newPos);
    
    // Update parent state (throttled/debounced implicitly by React batching or manually)
    // We update it here but we could debounce it if App re-renders are too heavy
    setZoom(boundedScale);
  };

  // Touch Zoom / Pinch Logic
  const getDistance = (p1: Point, p2: Point) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const getCenter = (p1: Point, p2: Point) => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  };

  const handleTouchMove = (e: any) => {
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      const stage = stageRef.current;
      if (!stage) return;

      const p1 = { x: touch1.clientX, y: touch1.clientY };
      const p2 = { x: touch2.clientX, y: touch2.clientY };

      if (!lastCenter) {
        setLastCenter(getCenter(p1, p2));
        setLastDist(getDistance(p1, p2));
        return;
      }

      const newDist = getDistance(p1, p2);
      const newCenter = getCenter(p1, p2);

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition() || newCenter;

      const factor = newDist / lastDist;
      const newScale = oldScale * factor;
      const boundedScale = Math.max(0.05, Math.min(100, newScale));

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * boundedScale,
        y: pointer.y - mousePointTo.y * boundedScale,
      };

      setStageScale(boundedScale);
      setStagePos(newPos);
      setZoom(boundedScale);

      setLastDist(newDist);
      setLastCenter(newCenter);
    }
  };

  const handleTouchEnd = () => {
    setLastDist(0);
    setLastCenter(null);
  };

  // Middle Mouse Panning Logic
  const handleMouseDown = (e: any) => {
    // 1 is middle button
    if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.altKey)) {
      setIsPanning(true);
      setLastMousePos({ x: e.evt.clientX, y: e.evt.clientY });
      const container = stageRef.current.container();
      container.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: any) => {
    if (isPanning) {
      const dx = e.evt.clientX - lastMousePos.x;
      const dy = e.evt.clientY - lastMousePos.y;
      
      const newPos = {
        x: stagePos.x + dx,
        y: stagePos.y + dy
      };
      
      setStagePos(newPos);
      setLastMousePos({ x: e.evt.clientX, y: e.evt.clientY });
    }
  };

  const handleMouseUp = (e: any) => {
    if (isPanning) {
      setIsPanning(false);
      const container = stageRef.current.container();
      container.style.cursor = 'default';
    }
  };

  // Handle Drag & Drop Drop on Stage
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    // Get drop coordinate relative to viewport
    const container = stage.container();
    const rect = container.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Transform viewport coordinates to Stage space
    const transform = stage.getAbsoluteTransform().copy().invert();
    let pos = transform.point({ x: clientX, y: clientY });

    // Apply snapping to drop action
    if (enableSnapping || enableGridSnapping) {
      let finalPos = { ...pos };

      if (enableGridSnapping) {
        finalPos = snapToGrid(pos, gridSize);
      }

      if (enableSnapping) {
        const { snappedPos: featurePos } = snapToFeatures(finalPos, detectedFeatures, 15);
        finalPos = featurePos;

        const stageScale = stage ? stage.scaleX() : 1;
        const { snappedPos: cablePos } = snapToCables(finalPos, cables, 15, stageScale);
        finalPos = cablePos;
      }
      
      pos = finalPos;
    }

    const type = e.dataTransfer.getData('text/plain');
    if (type && onAddEquipmentAt) {
      onAddEquipmentAt(type, pos);
    }
  };

  const cctvCount = equipment.filter(item => ['CCTV', 'CCTV_DOME', 'CCTV_BULLET'].includes(item.type)).length;
  const wifiCount = equipment.filter(item => ['WIFI', 'WIFI_ROUTER'].includes(item.type)).length;
  const fireCount = equipment.filter(item => ['FIRE', 'FIRE_DETECTOR'].includes(item.type)).length;
  const networkCount = equipment.filter(item => ['NETWORK', 'SWITCH_RACK', 'SERVER_RACK', 'ALARM_SIREN', 'CONTROL_PANEL', 'ACCESS_CONTROL', 'INTERCOM', 'SECURITY', 'UPS_BATTERY'].includes(item.type)).length;

  return (
    <div 
      ref={containerRef}
      className="w-full h-full shadow-2xl rounded overflow-hidden bg-[#121212] border border-[#333] relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="absolute top-2 left-2 bg-black/80 backdrop-blur text-[10px] text-gray-400 px-2.5 py-1 rounded-md z-10 font-mono pointer-events-none flex items-center gap-2 border border-[#333]">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
        {selectedTool === 'SELECT' ? (
          <span>👇 SELECT MODE: Drag items to move them | Drag the canvas to pan</span>
        ) : selectedTool === 'MEASURE' ? (
          <span>📏 MEASURING MODE: Click on plan to draw measurement paths | Escape to cancel</span>
        ) : (
          <span>📍 PLACING MODE: Click on plan to place {selectedTool} | Escape to cancel</span>
        )}
      </div>

      <div className="absolute top-2 right-2 flex flex-col items-end gap-2 z-10">
        <div className="flex gap-2">
          <button
            onClick={() => setEnableSnapping(!enableSnapping)}
            className={`px-2.5 py-1.5 rounded-md text-[10px] font-mono font-bold border flex items-center gap-1.5 transition-all active:scale-95 shadow-md ${
              enableSnapping 
                ? 'bg-emerald-950/85 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/80' 
                : 'bg-zinc-900/85 border-zinc-800 text-zinc-500 hover:text-zinc-400'
            }`}
            title="Toggle alignment snapping to walls/edges (Shortcut: S)"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${enableSnapping ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span>🧲 SNAP-ALIGN: {enableSnapping ? 'ENABLED' : 'DISABLED'}</span>
          </button>

          <div className={`px-2 py-1 rounded-md border flex items-center gap-2 shadow-md transition-all ${
            enableGridSnapping 
              ? 'bg-amber-950/85 border-amber-500/40 text-amber-400' 
              : 'bg-zinc-900/85 border-zinc-800 text-zinc-500'
          }`}>
            <button
              onClick={() => setEnableGridSnapping(!enableGridSnapping)}
              className="flex items-center gap-1.5 hover:opacity-80 active:scale-95 transition-all text-[10px] font-mono font-bold"
              title="Toggle snap-to-grid alignment (Shortcut: G)"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${enableGridSnapping ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
              <Grid size={12} className={enableGridSnapping ? 'text-amber-400' : 'text-zinc-600'} />
              <span>📏 GRID-SNAP: {enableGridSnapping ? 'ON' : 'OFF'}</span>
            </button>
            {enableGridSnapping && (
              <div className="flex items-center gap-1 border-l border-amber-500/20 pl-2">
                <button
                  onClick={() => setGridSize(10)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono transition-all ${
                    gridSize === 10 
                      ? 'bg-amber-500 text-black' 
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  10
                </button>
                <button
                  onClick={() => setGridSize(20)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono transition-all ${
                    gridSize === 20 
                      ? 'bg-amber-500 text-black' 
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  20
                </button>
                <select
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  className="bg-transparent text-amber-500/80 text-[9px] font-bold rounded px-1 focus:outline-none cursor-pointer"
                >
                  {[30, 40, 50, 100].map(val => (
                    <option key={val} value={val} className="bg-zinc-900">{val}</option>
                  ))}
                  {gridSize !== 10 && gridSize !== 20 && ![30, 40, 50, 100].includes(gridSize) && (
                    <option value={gridSize}>{gridSize}</option>
                  )}
                </select>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowCanvasLegend(!showCanvasLegend)}
            className={`px-2.5 py-1.5 rounded-md text-[10px] font-mono font-bold border flex items-center gap-1.5 transition-all active:scale-95 shadow-md ${
              showCanvasLegend 
                ? 'bg-blue-950/85 border-blue-500/40 text-blue-400 hover:bg-blue-900/80' 
                : 'bg-zinc-900/85 border-zinc-800 text-zinc-500 hover:text-zinc-400'
            }`}
            title="Toggle equipment legend overlay on canvas"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${showCanvasLegend ? 'bg-blue-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span>📋 LÉGENDE: {showCanvasLegend ? 'VISIBLE' : 'MASQUÉE'}</span>
          </button>
        </div>

        {/* Persistent Floating Equipment Legend & Summary */}
        {showCanvasLegend && (
          <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-lg shadow-xl w-64 overflow-hidden text-left flex flex-col transition-all duration-300">
          {/* Legend Header */}
          <button
            onClick={() => setLegendExpanded(!legendExpanded)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-zinc-900/70 border-b border-zinc-800 hover:bg-zinc-800/60 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-zinc-150">
              <LayoutGrid size={13} className="text-blue-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-100">Equipment Legend</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono font-bold bg-blue-950/60 border border-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full">
                {equipment.length} Units
              </span>
              {legendExpanded ? <ChevronUp size={13} className="text-zinc-400" /> : <ChevronDown size={13} className="text-zinc-400" />}
            </div>
          </button>

          {/* Legend Body */}
          {legendExpanded && (
            <div className="p-3 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
              {equipment.length === 0 ? (
                <div className="text-center py-4 px-2 space-y-1.5">
                  <div className="text-zinc-600 text-xs font-mono">📭 Empty Sheet</div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Select an equipment from the sidebar (e.g., Camera, Switch, Router) and click on the sheet to place it.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    // Define categories and their matching types
                    const categories = [
                      {
                        id: 'cctv',
                        name: 'CCTV Systems',
                        types: ['CCTV', 'CCTV_DOME', 'CCTV_BULLET'],
                        color: 'bg-rose-500',
                        badge: 'text-rose-400 bg-rose-950/40 border-rose-900/30'
                      },
                      {
                        id: 'wifi',
                        name: 'WiFi & Wireless',
                        types: ['WIFI', 'WIFI_ROUTER'],
                        color: 'bg-violet-500',
                        badge: 'text-violet-400 bg-violet-950/40 border-violet-900/30'
                      },
                      {
                        id: 'racks',
                        name: 'Server & Switching Racks',
                        types: ['NETWORK', 'SWITCH_RACK', 'SERVER_RACK', 'UPS_BATTERY'],
                        color: 'bg-amber-500',
                        badge: 'text-amber-400 bg-amber-950/40 border-amber-900/30'
                      },
                      {
                        id: 'fire',
                        name: 'Fire & Safety Detection',
                        types: ['FIRE', 'FIRE_DETECTOR'],
                        color: 'bg-red-500',
                        badge: 'text-red-400 bg-red-950/40 border-red-900/30'
                      },
                      {
                        id: 'security',
                        name: 'Security & Alarms',
                        types: ['SECURITY', 'ALARM_SIREN', 'CONTROL_PANEL', 'ACCESS_CONTROL', 'INTERCOM'],
                        color: 'bg-emerald-500',
                        badge: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30'
                      }
                    ];

                    // Process equipment to count by categories and subtypes
                    const categoryGroups = categories.map(cat => {
                      const matchingItems = equipment.filter(e => cat.types.includes(e.type));
                      
                      // Count subtypes within this category
                      const subtypeCounts = matchingItems.reduce((acc, eq) => {
                        const label = eq.subType || eq.type.replace(/_/g, ' ');
                        acc[label] = (acc[label] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);

                      return {
                        ...cat,
                        total: matchingItems.length,
                        subtypes: Object.entries(subtypeCounts).map(([label, qty]) => ({ label, qty }))
                      };
                    }).filter(group => group.total > 0);

                    // Grab any equipment whose type wasn't captured in the pre-defined categories
                    const allCategorizedTypes = categories.flatMap(c => c.types);
                    const miscellaneousItems = equipment.filter(e => !allCategorizedTypes.includes(e.type));
                    
                    if (miscellaneousItems.length > 0) {
                      const subtypeCounts = miscellaneousItems.reduce((acc, eq) => {
                        const label = eq.subType || eq.type.replace(/_/g, ' ');
                        acc[label] = (acc[label] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);

                      categoryGroups.push({
                        id: 'other',
                        name: 'Other Equipments',
                        total: miscellaneousItems.length,
                        subtypes: Object.entries(subtypeCounts).map(([label, qty]) => ({ label, qty })),
                        color: 'bg-zinc-400',
                        badge: 'text-zinc-400 bg-zinc-900 border-zinc-800'
                      } as any);
                    }

                    return (
                      <div className="space-y-3">
                        {categoryGroups.map(group => (
                          <div key={group.id} className="space-y-1 bg-zinc-900/30 border border-zinc-900/60 p-2 rounded-md">
                            {/* Category Header */}
                            <div className="flex justify-between items-center pb-1 border-b border-zinc-900/50">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${group.color}`} />
                                <span className="text-[10px] font-bold text-zinc-300 uppercase truncate">
                                  {group.name}
                                </span>
                              </div>
                              <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.2 border rounded shrink-0 ${group.badge}`}>
                                {group.total}
                              </span>
                            </div>

                            {/* Subtype Breakdown items */}
                            <div className="space-y-0.5 pt-1 pl-3.5">
                              {group.subtypes.map((sub, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[9px] text-zinc-400">
                                  <span className="truncate uppercase font-medium">{sub.label}</span>
                                  <span className="font-mono text-zinc-500 font-medium">x{sub.qty}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Total summary tally footer */}
                  <div className="border-t border-zinc-900 pt-2 flex items-center justify-between text-[9px] font-bold text-zinc-500 font-mono">
                    <span>SHEET COUNT:</span>
                    <span className="text-zinc-300">{equipment.length} Units</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </div>

      <Stage
        width={dimensions.width}
        height={dimensions.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        ref={stageRef}
        onClick={handleStageClick}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        draggable={selectedTool === 'SELECT' && !isPanning}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onMouseDown={(e) => {
          handleMouseDown(e);
          if (selectedTool !== 'MARQUEE') return;
          if (e.target !== stageRef.current && e.target.name() !== 'background-plan') {
            return;
          }
          const stage = stageRef.current;
          if (!stage) return;
          const pointer = stage.getPointerPosition();
          if (!pointer) return;
          const transform = stage.getAbsoluteTransform().copy().invert();
          const pos = transform.point(pointer);
          setMarqueeStart(pos);
          setMarqueeEnd(pos);
          if (!e.evt.shiftKey) {
            setMarqueeSelectedIds([]);
          }
        }}
        onMouseUp={(e) => {
          handleMouseUp(e);
          if (selectedTool === 'MARQUEE') {
            setMarqueeStart(null);
            setMarqueeEnd(null);
          }
        }}
        onMouseMove={(e) => {
          handleMouseMove(e);
          if (selectedTool === 'SELECT') {
            setMousePos(null);
            setSnapFeedback(null);
            return;
          }
          const stage = e.target.getStage();
          const pointer = stage.getPointerPosition();
          if (!pointer) return;
          const transform = stage.getAbsoluteTransform().copy().invert();
          const pos = transform.point(pointer);

          if (selectedTool === 'MARQUEE' && marqueeStart) {
            setMarqueeEnd(pos);
            const x1 = Math.min(marqueeStart.x, pos.x);
            const y1 = Math.min(marqueeStart.y, pos.y);
            const x2 = Math.max(marqueeStart.x, pos.x);
            const y2 = Math.max(marqueeStart.y, pos.y);

            const newlySelected = equipment.filter(eq => {
              return eq.x >= x1 && eq.x <= x2 && eq.y >= y1 && eq.y <= y2;
            }).map(eq => eq.id);

            if (e.evt.shiftKey) {
              setMarqueeSelectedIds(prev => Array.from(new Set([...prev, ...newlySelected])));
            } else {
              setMarqueeSelectedIds(newlySelected);
            }
          }

          if (enableSnapping || enableGridSnapping) {
            let finalPos = { ...pos };

            if (enableGridSnapping) {
              finalPos = snapToGrid(pos, gridSize);
            }

            let activeFeature = null;
            let snappedEquipment: Equipment | null = null;
            let snappedPort: ConnectionPort | null = null;

            if (enableSnapping) {
              const { snappedPos: featurePos, activeFeature: matchedFeature } = snapToFeatures(finalPos, detectedFeatures, 15);
              finalPos = featurePos;
              activeFeature = matchedFeature;

              const stageScale = stage ? stage.scaleX() : 1;
              const { snappedPos: cablePos } = snapToCables(finalPos, cables, 15, stageScale);
              finalPos = cablePos;

              if (selectedTool === 'CABLE') {
                const { snappedPos: eqSnappedPos, snappedEquipment: sEq, snappedPort: sPort } = snapToEquipment(finalPos, equipment, 15, stageScale, iconScale);
                finalPos = eqSnappedPos;
                snappedEquipment = sEq;
                snappedPort = sPort;
              }
            }
            
            setMousePos(finalPos);
            setSnapFeedback({
              x: finalPos.x,
              y: finalPos.y,
              feature: activeFeature,
              snappedEquipment,
              snappedPort
            });
          } else {
            setMousePos(pos);
            setSnapFeedback(null);
          }
        }}
        onMouseLeave={(e) => {
          handleMouseUp(e);
          setMousePos(null);
        }}
        className={selectedTool === 'SELECT' ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"}
      >
        <Layer>
          {bgImage && (() => {
            const planLayer = layers.find(l => l.id === 'PLAN');
            if (planLayer && !planLayer.visible) return null;
            const opacity = planLayer ? planLayer.opacity : 1;
            return (
              <KonvaImage
                image={bgImage}
                width={bgImage.naturalWidth || width}
                height={bgImage.naturalHeight || height}
                scaleX={width / (bgImage.naturalWidth || width)}
                scaleY={height / (bgImage.naturalHeight || height)}
                name="background-plan"
                imageSmoothingEnabled={true}
                opacity={opacity}
              />
            );
          })()}

          {/* Subtle aligning guide grid lines */}
          {enableGridSnapping && (
            (() => {
              const lines = [];
              const step = gridSize;
              // Limit line generation to sensible dimensions to keep rendering instantaneous
              const gridW = width || 1000;
              const gridH = height || 700;
              
              // Vertical lines
              for (let x = step; x < gridW; x += step) {
                lines.push(
                  <Line
                    key={`grid-v-${x}`}
                    points={[x, 0, x, gridH]}
                    stroke="rgba(255, 255, 255, 0.04)"
                    strokeWidth={0.5 / stageScale}
                    listening={false}
                  />
                );
              }
              // Horizontal lines
              for (let y = step; y < gridH; y += step) {
                lines.push(
                  <Line
                    key={`grid-h-${y}`}
                    points={[0, y, gridW, y]}
                    stroke="rgba(255, 255, 255, 0.04)"
                    strokeWidth={0.5 / stageScale}
                    listening={false}
                  />
                );
              }
              return lines;
            })()
          )}

          {sheet?.images?.map(img => (
            <PlanImageComponent
              key={img.id}
              image={img}
              stageScale={stageScale}
              isSelected={selectedEquipmentId === img.id}
              onSelect={onEquipmentClick}
              onUpdate={(updated) => {
                if (sheet && onUpdateSheet) {
                  onUpdateSheet({
                    ...sheet,
                    images: sheet.images?.map(i => i.id === updated.id ? updated : i) || []
                  });
                }
              }}
              selectedTool={selectedTool}
            />
          ))}
        </Layer>

        {/* Layer 2: Cables, Equipment, Guidelines & Measurement */}
        <Layer>
          {cables.map(cable => {
            const isSelected = selectedEquipmentId === cable.id;
            const layer = layers.find(l => l.id === cable.layerId);
            if (layer && !layer.visible) return null;
            const opacity = layer ? layer.opacity : 1;
            return (
              <CableNode
                key={cable.id}
                cable={cable}
                stageScale={stageScale}
                isSelected={isSelected}
                selectedTool={selectedTool}
                onEquipmentClick={onEquipmentClick}
                opacity={opacity}
              />
            );
          })}
          {equipment.map(item => {
            const layer = layers.find(l => l.id === item.layerId);
            if (layer && !layer.visible) return null;
            const opacity = layer ? layer.opacity : 1;
            return (
              <EquipmentNode 
                key={item.id}
                item={item}
                opacity={opacity}
                stageScale={stageScale}
                iconScale={iconScale}
                isSelected={selectedEquipmentId === item.id}
                selectedTool={selectedTool}
                enableSnapping={enableSnapping}
                enableGridSnapping={enableGridSnapping}
                gridSize={gridSize}
                detectedFeatures={detectedFeatures}
                equipment={equipment}
                cables={cables}
                onEquipmentClick={onEquipmentClick}
                onShiftEquipmentClick={handleShiftEquipmentClick}
                onUpdateEquipment={onUpdateEquipment}
                setGuidelines={setGuidelines}
                setSnapFeedback={setSnapFeedback}
                theme={theme}
                visibleCoverage={visibleCoverage}
                isGroupSelected={marqueeSelectedIds.includes(item.id)}
                onGroupToggle={handleGroupToggle}
                onGroupDragStart={handleGroupDragStart}
                onGroupDragMove={handleGroupDragMove}
                onGroupDragEnd={handleGroupDragEnd}
              />
            );
          })}
          {/* Dynamic alignment guidelines & spacing indicators */}
          {guidelines && (
            <>
              {/* Vertical alignment line */}
              {guidelines.x !== null && (
                <Line 
                  points={[guidelines.x, -5000, guidelines.x, 5000]} 
                  stroke="#3b82f6" 
                  strokeWidth={1 / stageScale} 
                  dash={[4, 4]} 
                  opacity={0.7}
                />
              )}
              {/* Horizontal alignment line */}
              {guidelines.y !== null && (
                <Line 
                  points={[-5000, guidelines.y, 5000, guidelines.y]} 
                  stroke="#3b82f6" 
                  strokeWidth={1 / stageScale} 
                  dash={[4, 4]} 
                  opacity={0.7}
                />
              )}

              {/* Visual markers & spacing labels for X-aligned target devices */}
              {guidelines.x !== null && guidelines.targetsX && guidelines.targetsX.map((target, idx) => {
                const activeY = guidelines.activeY ?? 0;
                const activeX = guidelines.activeX ?? guidelines.x ?? 0;
                const distY = Math.abs(activeY - target.y);
                const midY = (activeY + target.y) / 2;
                const distMeters = distY / scaleRatio;
                
                return (
                  <Group key={`align-x-${idx}`}>
                    {/* Ring around aligned device */}
                    <KonvaCircle 
                      x={target.x} 
                      y={target.y} 
                      radius={16 / stageScale} 
                      stroke="#3b82f6" 
                      strokeWidth={1.5 / stageScale} 
                      dash={[2, 2]} 
                      opacity={0.8}
                    />
                    {/* Secondary indicator circle at active position */}
                    <KonvaCircle 
                      x={activeX} 
                      y={activeY} 
                      radius={16 / stageScale} 
                      stroke="#10b981" 
                      strokeWidth={1.5 / stageScale} 
                      dash={[2, 2]} 
                      opacity={0.8}
                    />
                    {/* Connecting guide line segment */}
                    <Line 
                      points={[activeX, activeY, target.x, target.y]} 
                      stroke="#10b981" 
                      strokeWidth={1.5 / stageScale} 
                      dash={[3, 3]} 
                      opacity={0.9}
                    />
                    {/* Spacing distance label if there is reasonable gap */}
                    {distY > 40 && (
                      <Group x={activeX} y={midY}>
                        {/* Label container box */}
                        <Rect
                          x={-28 / stageScale}
                          y={-10 / stageScale}
                          width={56 / stageScale}
                          height={20 / stageScale}
                          fill="#0f172a" // Sleek dark slate background
                          stroke="#10b981"
                          strokeWidth={1 / stageScale}
                          cornerRadius={4 / stageScale}
                          shadowBlur={4}
                          shadowColor="black"
                        />
                        <Text
                          text={`${distMeters.toFixed(1)}m`}
                          fontSize={9 / stageScale}
                          fontFamily="Montserrat, sans-serif"
                          fontStyle="bold"
                          fill="#10b981"
                          align="center"
                          width={56 / stageScale}
                          x={-28 / stageScale}
                          y={-5 / stageScale}
                        />
                      </Group>
                    )}
                  </Group>
                );
              })}

              {/* Visual markers & spacing labels for Y-aligned target devices */}
              {guidelines.y !== null && guidelines.targetsY && guidelines.targetsY.map((target, idx) => {
                const activeX = guidelines.activeX ?? 0;
                const activeY = guidelines.activeY ?? guidelines.y ?? 0;
                const distX = Math.abs(activeX - target.x);
                const midX = (activeX + target.x) / 2;
                const distMeters = distX / scaleRatio;

                return (
                  <Group key={`align-y-${idx}`}>
                    {/* Ring around aligned device */}
                    <KonvaCircle 
                      x={target.x} 
                      y={target.y} 
                      radius={16 / stageScale} 
                      stroke="#3b82f6" 
                      strokeWidth={1.5 / stageScale} 
                      dash={[2, 2]} 
                      opacity={0.8}
                    />
                    {/* Secondary indicator circle at active position */}
                    <KonvaCircle 
                      x={activeX} 
                      y={activeY} 
                      radius={16 / stageScale} 
                      stroke="#10b981" 
                      strokeWidth={1.5 / stageScale} 
                      dash={[2, 2]} 
                      opacity={0.8}
                    />
                    {/* Connecting guide line segment */}
                    <Line 
                      points={[activeX, activeY, target.x, target.y]} 
                      stroke="#10b981" 
                      strokeWidth={1.5 / stageScale} 
                      dash={[3, 3]} 
                      opacity={0.9}
                    />
                    {/* Spacing distance label if there is reasonable gap */}
                    {distX > 40 && (
                      <Group x={midX} y={activeY}>
                        {/* Label container box */}
                        <Rect
                          x={-28 / stageScale}
                          y={-10 / stageScale}
                          width={56 / stageScale}
                          height={20 / stageScale}
                          fill="#0f172a" // Sleek dark slate background
                          stroke="#10b981"
                          strokeWidth={1 / stageScale}
                          cornerRadius={4 / stageScale}
                          shadowBlur={4}
                          shadowColor="black"
                        />
                        <Text
                          text={`${distMeters.toFixed(1)}m`}
                          fontSize={9 / stageScale}
                          fontFamily="Montserrat, sans-serif"
                          fontStyle="bold"
                          fill="#10b981"
                          align="center"
                          width={56 / stageScale}
                          x={-28 / stageScale}
                          y={-5 / stageScale}
                        />
                      </Group>
                    )}
                  </Group>
                );
              })}
            </>
          )}
          
          {/* Measurement Guides */}
          {selectedTool === 'MEASURE' && measurePoints.length > 0 && (
            <>
            {/* Draw lines between points */}
            {(() => {
              const pointsToDraw = [...measurePoints];
              if (mousePos && (measureMode === 'path' || measurePoints.length === 1) && measurePoints.length > 0 && !measurePoints.some(p => p.x === mousePos.x && p.y === mousePos.y)) {
                if (measureMode === 'single' && measurePoints.length >= 2) {
                } else {
                  pointsToDraw.push(mousePos);
                }
              }

              const linePoints: number[] = [];
              pointsToDraw.forEach(p => linePoints.push(p.x, p.y));

              const elements: React.ReactNode[] = [];

              if (linePoints.length >= 4) {
                elements.push(
                  <Line
                    key="measure-line-path"
                    points={linePoints}
                    stroke="#f43f5e"
                    strokeWidth={3 / stageScale}
                    lineCap="round"
                    lineJoin="round"
                    dash={[6 / stageScale, 4 / stageScale]}
                  />
                );
              }

              measurePoints.forEach((p, idx) => {
                elements.push(
                  <Group key={`measure-node-${idx}`} x={p.x} y={p.y}>
                    <KonvaCircle
                      radius={7 / stageScale}
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth={1.5 / stageScale}
                      shadowColor="black"
                      shadowBlur={4}
                      shadowOpacity={0.4}
                    />
                    <Text
                      text={`${idx + 1}`}
                      fontSize={8 / stageScale}
                      fontFamily="Montserrat, sans-serif"
                      fontStyle="bold"
                      fill="#ffffff"
                      offsetX={3 / stageScale}
                      offsetY={4 / stageScale}
                      align="center"
                    />
                  </Group>
                );
              });

              for (let i = 0; i < pointsToDraw.length - 1; i++) {
                const p1 = pointsToDraw[i];
                const p2 = pointsToDraw[i + 1];
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const distMeters = len / scaleRatio;
                const textStr = `${distMeters.toFixed(2)}m`;
                
                const charCount = textStr.length;
                const badgeWidth = (charCount * 7.5 + 8) / stageScale;
                const badgeHeight = 18 / stageScale;

                const isLive = i === pointsToDraw.length - 2 && pointsToDraw.length > measurePoints.length;

                elements.push(
                  <Group key={`measure-badge-${i}`} x={midX} y={midY}>
                    <Rect
                      x={-badgeWidth / 2}
                      y={-badgeHeight / 2}
                      width={badgeWidth}
                      height={badgeHeight}
                      fill={isLive ? "#27272a" : "#f43f5e"}
                      stroke={isLive ? "rgba(244, 63, 94, 0.5)" : "#ffffff"}
                      strokeWidth={1 / stageScale}
                      cornerRadius={4 / stageScale}
                      shadowColor="black"
                      shadowBlur={3}
                      shadowOpacity={0.3}
                    />
                    <Text
                      text={textStr}
                      fontSize={8.5 / stageScale}
                      fontFamily="JetBrains Mono, monospace"
                      fontStyle="bold"
                      fill={isLive ? "#f43f5e" : "#ffffff"}
                      align="center"
                      verticalAlign="middle"
                      x={-badgeWidth / 2}
                      y={-badgeHeight / 2 + 1 / stageScale}
                      width={badgeWidth}
                      height={badgeHeight}
                    />
                  </Group>
                );
              }

              return elements;
            })()}
            </>
          )}

          {/* Shift-Click Equipment Distance Measurement Graphics */}
          {shiftSelectedEquips.length === 1 && (() => {
            const eq = shiftSelectedEquips[0];
            return (
              <KonvaCircle
                x={eq.x}
                y={eq.y}
                radius={24 / stageScale}
                stroke="#3b82f6"
                strokeWidth={2 / stageScale}
                dash={[4 / stageScale, 4 / stageScale]}
                opacity={0.8}
              />
            );
          })()}

          {shiftSelectedEquips.length === 2 && (() => {
            const p1 = shiftSelectedEquips[0];
            const p2 = shiftSelectedEquips[1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const distMeters = len / scaleRatio;
            const textStr = `${distMeters.toFixed(2)} m`;

            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            const badgeWidth = (textStr.length * 7.5 + 16) / stageScale;
            const badgeHeight = 22 / stageScale;

            return (
              <Group>
                {/* Connection Line */}
                <Line
                  points={[p1.x, p1.y, p2.x, p2.y]}
                  stroke="#3b82f6"
                  strokeWidth={3 / stageScale}
                  dash={[6 / stageScale, 4 / stageScale]}
                  shadowColor="black"
                  shadowBlur={2}
                  shadowOpacity={0.3}
                />
                
                {/* Node Indicators */}
                <KonvaCircle
                  x={p1.x}
                  y={p1.y}
                  radius={6 / stageScale}
                  fill="#3b82f6"
                  stroke="#ffffff"
                  strokeWidth={1.5 / stageScale}
                />
                <KonvaCircle
                  x={p2.x}
                  y={p2.y}
                  radius={6 / stageScale}
                  fill="#3b82f6"
                  stroke="#ffffff"
                  strokeWidth={1.5 / stageScale}
                />

                {/* Distance Badge */}
                <Group x={midX} y={midY}>
                  <Rect
                    x={-badgeWidth / 2}
                    y={-badgeHeight / 2}
                    width={badgeWidth}
                    height={badgeHeight}
                    fill={theme === 'dark' ? "#1e40af" : "#2563eb"}
                    stroke="#ffffff"
                    strokeWidth={1.5 / stageScale}
                    cornerRadius={11 / stageScale}
                    shadowColor="black"
                    shadowBlur={5}
                    shadowOpacity={0.4}
                  />
                  <Text
                    text={textStr}
                    fontSize={9.5 / stageScale}
                    fontFamily="JetBrains Mono, monospace"
                    fontStyle="bold"
                    fill="#ffffff"
                    align="center"
                    verticalAlign="middle"
                    x={-badgeWidth / 2}
                    y={-badgeHeight / 2 + 1 / stageScale}
                    width={badgeWidth}
                    height={badgeHeight}
                  />
                </Group>
              </Group>
            );
          })()}

          {/* Marquee Selection Rectangle */}
          {selectedTool === 'MARQUEE' && marqueeStart && marqueeEnd && (
            <Rect
              x={Math.min(marqueeStart.x, marqueeEnd.x)}
              y={Math.min(marqueeStart.y, marqueeEnd.y)}
              width={Math.abs(marqueeStart.x - marqueeEnd.x)}
              height={Math.abs(marqueeStart.y - marqueeEnd.y)}
              fill="rgba(16, 185, 129, 0.08)"
              stroke="#10b981"
              strokeWidth={1.5 / stageScale}
              dash={[5 / stageScale, 4 / stageScale]}
              listening={false}
            />
          )}
        </Layer>

        {/* Layer 4: Translucent placement preview (Ghost) */}
        {(() => {
          const customEquip = customEquipmentTypes.find(t => t.id === selectedTool);
          const activeToolKey = customEquip ? customEquip.iconKey : selectedTool;
          const isPlacing = ['CCTV', 'NETWORK', 'FIRE', 'WIFI', 'SECURITY', 'CCTV_DOME', 'CCTV_BULLET', 'WIFI_ROUTER', 'FIRE_DETECTOR', 'SWITCH_RACK', 'SERVER_RACK', 'ALARM_SIREN', 'CONTROL_PANEL', 'ACCESS_CONTROL', 'INTERCOM', 'UPS_BATTERY'].includes(activeToolKey as any);
          if (!isPlacing || !mousePos) return null;
          
          return (
            <Layer listening={false}>
              <Group x={mousePos.x} y={mousePos.y} opacity={0.65}>
                {(activeToolKey === 'CCTV' || activeToolKey === 'CCTV_DOME' || activeToolKey === 'CCTV_BULLET') && (() => {
                  const specs = getCameraSpecs(2.8);
                  return (
                    <Wedge
                      x={0}
                      y={0}
                      radius={specs.reach}
                      angle={specs.fovAngle}
                      rotation={-90 - specs.fovAngle / 2}
                      fill="rgba(59, 130, 246, 0.12)"
                      stroke="rgba(59, 130, 246, 0.35)"
                      strokeWidth={1 / stageScale}
                      dash={[4 / stageScale, 4 / stageScale]}
                    />
                  );
                })()}

                {(activeToolKey === 'WIFI' || activeToolKey === 'WIFI_ROUTER') && (
                  <>
                    {/* Safety propagation range background indicator */}
                    <KonvaCircle
                      radius={80}
                      fillRadialGradientStartPoint={{ x: 0, y: 0 }}
                      fillRadialGradientStartRadius={0}
                      fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                      fillRadialGradientEndRadius={80}
                      fillRadialGradientColorStops={[0, 'rgba(34, 197, 94, 0.18)', 1, 'transparent']}
                    />

                    {/* Concentric broadcast waves */}
                    <KonvaCircle
                      radius={20 / stageScale}
                      stroke="rgba(34, 197, 94, 0.4)"
                      strokeWidth={0.75 / stageScale}
                      dash={[3 / stageScale, 3 / stageScale]}
                    />
                  </>
                )}

                {(activeToolKey === 'FIRE' || activeToolKey === 'FIRE_DETECTOR') && (
                  /* Alarm range circle */
                  <KonvaCircle
                    radius={50}
                    stroke="rgba(239, 68, 68, 0.18)"
                    strokeWidth={1 / stageScale}
                    dash={[4 / stageScale, 4 / stageScale]}
                  />
                )}

                {activeToolKey === 'ALARM_SIREN' && (
                  /* Alarm range circle */
                  <KonvaCircle
                    radius={60}
                    stroke="rgba(244, 63, 94, 0.25)"
                    strokeWidth={1 / stageScale}
                    dash={[2 / stageScale, 4 / stageScale]}
                  />
                )}

                {/* Centralized High-Consistency SVG Icon Preview */}
                <EquipmentIcon type={activeToolKey} stageScale={stageScale} iconScale={iconScale} />

                <Text
                  text="📍 Drop / Click"
                  fontSize={8 / stageScale}
                  fill="#3b82f6"
                  y={(22 * iconScale + 6) / stageScale}
                  align="center"
                  width={90 / stageScale}
                  x={-45 / stageScale}
                  fontStyle="bold"
                  shadowColor="black"
                  shadowBlur={3}
                />
              </Group>
            </Layer>
          );
        })()}

        {/* Layer 5: Snap alignment guide visual feedback */}
        {enableSnapping && snapFeedback && (
          <Layer listening={false}>
            {/* 1. Equipment Snapping Feedback (CABLE drawing tool) */}
            {selectedTool === 'CABLE' && snapFeedback.snappedEquipment && (
              <Group>
                {/* Draw all available ports for this snapped equipment as subtle anchors */}
                {getEquipmentPorts(snapFeedback.snappedEquipment, iconScale).map((port) => (
                  <KonvaCircle
                    key={port.id}
                    x={port.x}
                    y={port.y}
                    radius={3 / stageScale}
                    fill={snapFeedback.snappedPort?.id === port.id ? '#3b82f6' : 'rgba(59, 130, 246, 0.45)'}
                    stroke="#ffffff"
                    strokeWidth={0.5 / stageScale}
                    opacity={snapFeedback.snappedPort?.id === port.id ? 1 : 0.6}
                  />
                ))}

                {/* Highlight the specifically snapped port with an extra pulsing magnetic ring */}
                {snapFeedback.snappedPort && (
                  <>
                    {/* Pulsing/magnetic ring */}
                    <KonvaCircle
                      x={snapFeedback.snappedPort.x}
                      y={snapFeedback.snappedPort.y}
                      radius={7.5 / stageScale}
                      stroke="#3b82f6"
                      strokeWidth={1.5 / stageScale}
                      dash={[3, 2]}
                      shadowColor="#3b82f6"
                      shadowBlur={6}
                    />
                    
                    {/* Glowing snapped port inner circle */}
                    <KonvaCircle
                      x={snapFeedback.snappedPort.x}
                      y={snapFeedback.snappedPort.y}
                      radius={4.5 / stageScale}
                      fill="#3b82f6"
                      stroke="#ffffff"
                      strokeWidth={1.5 / stageScale}
                      shadowColor="#3b82f6"
                      shadowBlur={10}
                    />

                    {/* Port name tooltip */}
                    <Text
                      text={`🧲 SNAPPED: ${snapFeedback.snappedPort.name.toUpperCase()}`}
                      x={snapFeedback.snappedPort.x + 10 / stageScale}
                      y={snapFeedback.snappedPort.y - 4 / stageScale}
                      fontSize={8 / stageScale}
                      fill="#3b82f6"
                      fontStyle="bold"
                      shadowColor="black"
                      shadowBlur={2}
                    />
                  </>
                )}
              </Group>
            )}

            {/* 2. Fallback Architectural Feature Snap Guides */}
            {(!snapFeedback.snappedEquipment || selectedTool !== 'CABLE') && (
              <>
                {/* Draw snap line alignment guide */}
                {snapFeedback.feature && snapFeedback.feature.type === 'line' && snapFeedback.feature.p1 && snapFeedback.feature.p2 && (
                  <Line
                    points={[
                      snapFeedback.feature.p1.x,
                      snapFeedback.feature.p1.y,
                      snapFeedback.feature.p2.x,
                      snapFeedback.feature.p2.y
                    ]}
                    stroke="#10b981"
                    strokeWidth={2 / stageScale}
                    dash={[6, 4]}
                    opacity={0.8}
                    shadowColor="#10b981"
                    shadowBlur={4}
                  />
                )}

                {/* Draw snap point highlight circle */}
                <KonvaCircle
                  x={snapFeedback.x}
                  y={snapFeedback.y}
                  radius={5 / stageScale}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth={1.5 / stageScale}
                  shadowColor="#10b981"
                  shadowBlur={6}
                />

                {/* Draw small indicator text */}
                <Text
                  text={snapFeedback.feature?.type === 'point' ? "🧲 SNAPPED TO JUNCTION" : "🧲 SNAPPED TO WALL"}
                  x={snapFeedback.x + 8 / stageScale}
                  y={snapFeedback.y - 6 / stageScale}
                  fontSize={8 / stageScale}
                  fill="#10b981"
                  fontStyle="bold"
                  shadowColor="black"
                  shadowBlur={2}
                />
              </>
            )}
          </Layer>
        )}



        {/* Layer: Cable Draft */}
        {selectedTool === 'CABLE' && cableDraftPoints.length > 0 && (
          <Layer>
            {(() => {
              const pointsToDraw = [...cableDraftPoints];
              if (mousePos && cableDraftPoints.length > 0 && !cableDraftPoints.some(p => p.x === mousePos.x && p.y === mousePos.y)) {
                pointsToDraw.push(mousePos);
              }
              const flatPoints = pointsToDraw.flatMap(p => [p.x, p.y]);
              const elements = [];

              elements.push(
                <Line
                  key="cable-draft-line"
                  points={flatPoints}
                  stroke="#3b82f6"
                  strokeWidth={2 / stageScale}
                  lineCap="round"
                  lineJoin="round"
                  tension={cableType === 'curved' ? cableTension : 0}
                  dash={pointsToDraw.length > cableDraftPoints.length ? [4 / stageScale, 4 / stageScale] : []}
                />
              );

              cableDraftPoints.forEach((p, idx) => {
                elements.push(
                  <KonvaCircle
                    key={`cable-draft-node-${idx}`}
                    x={p.x}
                    y={p.y}
                    radius={4 / stageScale}
                    fill="#3b82f6"
                  />
                );
              });

              return elements;
            })()}
          </Layer>
        )}

        {/* Layer 6: Active Selected Equipment Controls */}
        {false && selectedEquipmentId && (
          <Layer>
            {(() => {
              const selectedItem = equipment.find(item => item.id === selectedEquipmentId);
              if (!selectedItem) return null;

              const isCamera = selectedItem.type === 'CCTV' || selectedItem.type === 'CCTV_DOME' || selectedItem.type === 'CCTV_BULLET';
              const isWifi = selectedItem.type === 'WIFI' || selectedItem.type === 'WIFI_ROUTER';
              const isFire = selectedItem.type === 'FIRE' || selectedItem.type === 'FIRE_DETECTOR';
              const isSiren = selectedItem.type === 'ALARM_SIREN';
              if (!isCamera && !isWifi && !isFire && !isSiren) return null;

              const specs = isCamera 
                ? getCameraSpecs(selectedItem.properties?.focalLength || 2.8, selectedItem.properties?.reach, selectedItem.properties?.fovAngle)
                : { reach: selectedItem.properties?.coverageRange || (isWifi ? 80 : isFire ? 50 : isSiren ? 60 : 0), fovAngle: 360 };

              // Better calibration: use actual reach but ensure minimum for visibility
              const visualReach = Math.max(specs.reach, (28 * iconScale) / stageScale);
              const pointingAngleRad = (selectedItem.rotation - 90) * Math.PI / 180;
              const reachHandleX = selectedItem.x + visualReach * Math.cos(pointingAngleRad);
              const reachHandleY = selectedItem.y + visualReach * Math.sin(pointingAngleRad);
              const handleColor = isCamera ? '#3b82f6' : isWifi ? '#22c55e' : isFire ? '#ef4444' : '#f43f5e';

              return (
                <Group>
                  <Line
                    points={[selectedItem.x, selectedItem.y, reachHandleX, reachHandleY]}
                    stroke={handleColor}
                    strokeWidth={1 / stageScale}
                    dash={[3, 3]}
                    opacity={0.6}
                    listening={false}
                  />
                  <KonvaCircle
                    x={reachHandleX}
                    y={reachHandleY}
                    radius={8 / stageScale}
                    fill={handleColor}
                    stroke="#ffffff"
                    strokeWidth={1.5 / stageScale}
                    shadowColor="#000000"
                    shadowBlur={4}
                    draggable
                    onDragStart={(e) => {
                      e.cancelBubble = true;
                    }}
                    onDragMove={(e) => {
                      e.cancelBubble = true;
                      const dragNode = e.target;
                      const stage = dragNode.getStage();
                      const pointer = stage.getPointerPosition();
                      if (!pointer) return;
                      const transform = stage.getAbsoluteTransform().copy().invert();
                      const pointerWorld = transform.point(pointer);
                      const dx = pointerWorld.x - selectedItem.x;
                      const dy = pointerWorld.y - selectedItem.y;
                      const dist = Math.sqrt(dx * dx + dy * dy);
                      const newReach = Math.min(10000, Math.max(20, Math.round(dist)));
                      if (onUpdateEquipment) {
                        onUpdateEquipment({
                          ...selectedItem,
                          properties: {
                            ...selectedItem.properties,
                            [isCamera ? 'reach' : 'coverageRange']: newReach
                          }
                        });
                      }
                    }}
                    onDragEnd={(e) => {
                      e.cancelBubble = true;
                      e.target.x(reachHandleX);
                      e.target.y(reachHandleY);
                      e.target.getLayer().batchDraw();
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage().container();
                      container.style.cursor = 'ns-resize';
                    }}
                    onMouseLeave={(e) => {
                      const container = e.target.getStage().container();
                      container.style.cursor = selectedTool === 'SELECT' ? 'default' : 'crosshair';
                    }}
                  />
                  <Group x={reachHandleX} y={reachHandleY - 18 / stageScale}>
                    <Rect
                      x={-24 / stageScale}
                      y={-7 / stageScale}
                      width={48 / stageScale}
                      height={14 / stageScale}
                      fill={handleColor}
                      cornerRadius={3 / stageScale}
                      shadowColor="black"
                      shadowBlur={2}
                    />
                    <Text
                      text={`${(specs.reach / scaleRatio).toFixed(1)}m`}
                      fontSize={8 / stageScale}
                      fontStyle="bold"
                      fill="#ffffff"
                      align="center"
                      width={48 / stageScale}
                      x={-24 / stageScale}
                      y={-4 / stageScale}
                    />
                    <Text
                      text="Reach"
                      fontSize={6 / stageScale}
                      fill="#ffffff"
                      opacity={0.8}
                      align="center"
                      width={48 / stageScale}
                      x={-24 / stageScale}
                      y={-12 / stageScale}
                    />
                  </Group>
                  {isCamera && (() => {
                    const fovStartAngleRad = (selectedItem.rotation - 90 - specs.fovAngle / 2) * Math.PI / 180;
                    const fovHandleX = selectedItem.x + visualReach * Math.cos(fovStartAngleRad);
                    const fovHandleY = selectedItem.y + visualReach * Math.sin(fovStartAngleRad);
                    return (
                      <Group>
                        <Line
                          points={[selectedItem.x, selectedItem.y, fovHandleX, fovHandleY]}
                          stroke="#a78bfa"
                          strokeWidth={1 / stageScale}
                          dash={[3, 3]}
                          opacity={0.6}
                          listening={false}
                        />
                        <KonvaCircle
                          x={fovHandleX}
                          y={fovHandleY}
                          radius={8 / stageScale}
                          fill="#8b5cf6"
                          stroke="#ffffff"
                          strokeWidth={1.5 / stageScale}
                          shadowColor="#000000"
                          shadowBlur={4}
                          draggable
                          onDragStart={(e) => {
                            e.cancelBubble = true;
                          }}
                          onDragMove={(e) => {
                            e.cancelBubble = true;
                            const dragNode = e.target;
                            const stage = dragNode.getStage();
                            const pointer = stage.getPointerPosition();
                            if (!pointer) return;
                            const transform = stage.getAbsoluteTransform().copy().invert();
                            const pointerWorld = transform.point(pointer);
                            const dx = pointerWorld.x - selectedItem.x;
                            const dy = pointerWorld.y - selectedItem.y;
                            const pointerAngleRad = Math.atan2(dy, dx);
                            let diffRad = pointerAngleRad - pointingAngleRad;
                            diffRad = Math.atan2(Math.sin(diffRad), Math.cos(diffRad));
                            let fovAngle = Math.round(2 * Math.abs(diffRad * 180 / Math.PI));
                            fovAngle = Math.min(360, Math.max(10, fovAngle));
                            if (onUpdateEquipment) {
                              onUpdateEquipment({
                                ...selectedItem,
                                properties: {
                                  ...selectedItem.properties,
                                  fovAngle: fovAngle
                                }
                              });
                            }
                          }}
                          onDragEnd={(e) => {
                            e.cancelBubble = true;
                            e.target.x(fovHandleX);
                            e.target.y(fovHandleY);
                            e.target.getLayer().batchDraw();
                          }}
                          onMouseEnter={(e) => {
                            const container = e.target.getStage().container();
                            container.style.cursor = 'ew-resize';
                          }}
                          onMouseLeave={(e) => {
                            const container = e.target.getStage().container();
                            container.style.cursor = selectedTool === 'SELECT' ? 'default' : 'crosshair';
                          }}
                        />
                        <Group x={fovHandleX} y={fovHandleY - 18 / stageScale}>
                          <Rect
                            x={-20 / stageScale}
                            y={-7 / stageScale}
                            width={40 / stageScale}
                            height={14 / stageScale}
                            fill="#8b5cf6"
                            cornerRadius={3 / stageScale}
                            shadowColor="black"
                            shadowBlur={2}
                          />
                          <Text
                            text={`${specs.fovAngle}°`}
                            fontSize={8 / stageScale}
                            fontStyle="bold"
                            fill="#ffffff"
                            align="center"
                            width={40 / stageScale}
                            x={-20 / stageScale}
                            y={-4 / stageScale}
                          />
                          <Text
                            text="FOV"
                            fontSize={6 / stageScale}
                            fill="#ffffff"
                            opacity={0.8}
                            align="center"
                            width={40 / stageScale}
                            x={-20 / stageScale}
                            y={-12 / stageScale}
                          />
                        </Group>
                      </Group>
                    );
                  })()}
                </Group>
              );
            })()}
          </Layer>
        )}
      </Stage>

      {/* Dynamic Floating Legend */}
      <Legend equipment={equipment} theme={theme} />

      {selectedTool === 'MEASURE' && (
        <div className={cn(
          "absolute bottom-4 left-4 border rounded-xl p-4 shadow-2xl z-20 w-80 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300",
          theme === 'dark' ? "bg-zinc-950/95 border-zinc-800 text-white" : "bg-white/95 border-zinc-200 text-zinc-900 shadow-lg"
        )}>
          <div className={cn(
            "flex items-center justify-between mb-2 pb-2 border-b",
            theme === 'dark' ? "border-zinc-800" : "border-zinc-100"
          )}>
            <div className="flex items-center gap-2">
              <Ruler className="text-rose-500 w-4 h-4 animate-pulse" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Plan Scale & Calibration</h4>
            </div>
            <button 
              onClick={() => {
                setMeasurePoints([]);
              }}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-900 border border-zinc-800 px-2 py-1 rounded"
            >
              Reset Points
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Mode selection buttons */}
            <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setMeasureMode('single')}
                className={`py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                  measureMode === 'single'
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20 shadow-sm font-black'
                    : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                📏 Room Size
              </button>
              <button
                type="button"
                onClick={() => setMeasureMode('path')}
                className={`py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                  measureMode === 'path'
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20 shadow-sm font-black'
                    : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                🔌 Cabling Run
              </button>
            </div>

            {/* Guide message & values */}
            {measurePoints.length === 0 ? (
              <p className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-900/40 p-2.5 rounded border border-zinc-900">
                Click a starting point on the canvas to begin measuring.
              </p>
            ) : measurePoints.length === 1 ? (
              <p className="text-[11px] text-rose-300/80 leading-relaxed bg-rose-950/10 p-2.5 rounded border border-rose-950/20 animate-pulse">
                Click a second point to finish the first segment.
              </p>
            ) : (
              <div className="space-y-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">Segments:</span>
                  <span className="font-mono text-zinc-300">{measurePoints.length - 1}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">Total length (px):</span>
                  <span className="font-mono text-zinc-300">
                    {(() => {
                      let pxLen = 0;
                      for (let i = 0; i < measurePoints.length - 1; i++) {
                        const dx = measurePoints[i+1].x - measurePoints[i].x;
                        const dy = measurePoints[i+1].y - measurePoints[i].y;
                        pxLen += Math.sqrt(dx * dx + dy * dy);
                      }
                      return Math.round(pxLen);
                    })()} px
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">Total physical length:</span>
                  <span className="font-mono text-rose-400 font-bold text-sm">
                    {(() => {
                      let pxLen = 0;
                      for (let i = 0; i < measurePoints.length - 1; i++) {
                        const dx = measurePoints[i+1].x - measurePoints[i].x;
                        const dy = measurePoints[i+1].y - measurePoints[i].y;
                        pxLen += Math.sqrt(dx * dx + dy * dy);
                      }
                      return (pxLen / scaleRatio).toFixed(2);
                    })()} m
                  </span>
                </div>
              </div>
            )}

            {/* Calibration Form */}
            <div className="pt-2 border-t border-zinc-900">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5 flex items-center gap-1">
                <Info size={10} className="text-zinc-500" /> Define Scale Reference
              </span>
              
              <div className="space-y-2">
                {/* 1. Direct input of pixels per meter */}
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] text-zinc-400">1 Meter corresponds to:</label>
                  <div className="flex items-center gap-1.5 w-1/2">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="500"
                      value={tempScaleVal !== undefined ? tempScaleVal : Math.round(scaleRatio * 10) / 10}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          setTempScaleVal(val);
                          onUpdateScaleRatio?.(val);
                        } else {
                          setTempScaleVal(e.target.value as any);
                        }
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-rose-500/50"
                    />
                    <span className="text-[10px] text-zinc-500 font-mono">px</span>
                  </div>
                </div>

                {/* 2. Interactive calibration from active line */}
                {measurePoints.length >= 2 && (
                  <div className="mt-2 p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-lg space-y-1.5">
                    <div className="text-[10px] text-rose-300 leading-normal">
                      Known physical length of drawn path:
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="e.g. 10.5"
                        step="0.1"
                        min="0.1"
                        id="calibration-input"
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-rose-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('calibration-input') as HTMLInputElement;
                          const meters = parseFloat(input?.value || '');
                          if (!isNaN(meters) && meters > 0) {
                            let pxLen = 0;
                            for (let i = 0; i < measurePoints.length - 1; i++) {
                              const dx = measurePoints[i+1].x - measurePoints[i].x;
                              const dy = measurePoints[i+1].y - measurePoints[i].y;
                              pxLen += Math.sqrt(dx * dx + dy * dy);
                            }
                            const newRatio = pxLen / meters;
                            onUpdateScaleRatio?.(newRatio);
                            setTempScaleVal(undefined);
                            setCalibratedSuccess(true);
                            setTimeout(() => setCalibratedSuccess(false), 3000);
                          }
                        }}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase px-3 py-1 rounded transition-colors"
                      >
                        Calibrate
                      </button>
                    </div>
                    {calibratedSuccess && (
                      <div className="text-[9px] text-emerald-400 font-bold font-mono animate-bounce mt-1 flex items-center gap-1">
                        <Check size={10} /> Scale set: 1m = {Math.round(scaleRatio * 10) / 10} px
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedTool === 'CABLE' && (
        <div className="absolute bottom-4 left-4 bg-zinc-950/95 border border-zinc-800 text-white rounded-xl p-4 shadow-2xl z-20 w-80 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Cable Routing</h4>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Cable Library Selector inside drawing tool */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Select Cable Type</label>
              <select
                value={selectedCableTypeId}
                onChange={(e) => setSelectedCableTypeId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="" disabled>-- Choose Cable --</option>
                {customCableTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (Cost: €{t.costPerMeter.toFixed(2)}/m)</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg">
              <button
                type="button"
                onClick={() => setCableType('straight')}
                className={`flex-1 text-[10px] font-bold uppercase py-1.5 rounded transition-all cursor-pointer ${cableType === 'straight' ? 'bg-blue-600 text-white shadow-sm font-semibold' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Straight
              </button>
              <button
                type="button"
                onClick={() => setCableType('curved')}
                className={`flex-1 text-[10px] font-bold uppercase py-1.5 rounded transition-all cursor-pointer ${cableType === 'curved' ? 'bg-blue-600 text-white shadow-sm font-semibold' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Curved
              </button>
            </div>

            {cableType === 'curved' && (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs text-zinc-400">
                  <span>Curve Tension</span>
                  <span>{cableTension.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.1"
                  value={cableTension}
                  onChange={(e) => setCableTension(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}

            {cableDraftPoints.length === 0 ? (
              <p className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-900/40 p-2.5 rounded border border-zinc-900">
                Click points on the canvas to route the cable.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
                  <span className="text-zinc-500 font-medium">Nodes:</span>
                  <span className="font-mono text-zinc-300">{cableDraftPoints.length}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      if (cableDraftPoints.length > 1 && onAddCable) {
                        const matchedType = customCableTypes.find(t => t.id === selectedCableTypeId);
                        onAddCable(
                          cableDraftPoints,
                          cableType,
                          cableTension,
                          matchedType?.color,
                          matchedType?.thickness,
                          matchedType?.id
                        );
                        setCableDraftPoints([]);
                      }
                    }}
                    disabled={cableDraftPoints.length < 2}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold text-[10px] uppercase py-2 rounded transition-colors cursor-pointer"
                  >
                    Finish Routing
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCableDraftPoints([])}
                    className="px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] uppercase rounded transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shift-Click Equipment Measurement Toast/Card */}
      {shiftSelectedEquipIds.length > 0 && (
        <div 
          className={cn(
            "absolute bottom-4 left-4 z-20 w-80 rounded-xl border p-3.5 shadow-2xl backdrop-blur-md transition-all duration-300",
            theme === 'dark' 
              ? "bg-zinc-950/95 border-zinc-800 text-white" 
              : "bg-white/95 border-zinc-200 text-zinc-900"
          )}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Ruler size={14} className="text-blue-500 animate-pulse" />
              <h4 className="text-[10px] font-bold uppercase tracking-wider">Mesure de Distance</h4>
            </div>
            <button
              type="button"
              onClick={() => setShiftSelectedEquipIds([])}
              className={cn(
                "p-1 rounded transition-colors",
                theme === 'dark' 
                  ? "hover:bg-zinc-850 text-zinc-400 hover:text-white" 
                  : "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
              )}
              title="Effacer la mesure"
            >
              <X size={14} />
            </button>
          </div>

          {shiftSelectedEquips.length === 1 ? (
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-500 font-medium">
                Premier équipement sélectionné :
              </p>
              <p className="text-xs font-bold text-blue-500 truncate">
                {getEquipmentLabel(shiftSelectedEquips[0])}
              </p>
              <p className="text-[9px] text-zinc-400 pt-1 leading-relaxed">
                👉 Maintenez <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-750 text-[8px] font-mono">Shift</kbd> et cliquez sur un second équipement pour mesurer la distance.
              </p>
            </div>
          ) : shiftSelectedEquips.length === 2 ? (
            (() => {
              const p1 = shiftSelectedEquips[0];
              const p2 = shiftSelectedEquips[1];
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const distMeters = len / scaleRatio;

              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-zinc-500/5 p-1.5 rounded-lg border border-zinc-500/10">
                    <div className="min-w-0">
                      <span className="text-zinc-500 block text-[8px] uppercase font-bold">Départ</span>
                      <span className="font-semibold truncate block text-blue-500">
                        {getEquipmentLabel(p1)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-zinc-500 block text-[8px] uppercase font-bold">Arrivée</span>
                      <span className="font-semibold truncate block text-blue-500">
                        {getEquipmentLabel(p2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-500/10">
                    <span className="text-[11px] font-bold text-zinc-400">Distance linéaire :</span>
                    <span className="text-base font-mono font-bold text-blue-500">
                      {distMeters.toFixed(2)} m
                    </span>
                  </div>
                </div>
              );
            })()
          ) : null}
        </div>
      )}

      {/* Persistent & Interactive 'Equipment Legend' Floating Panel */}
      <div 
        className={cn(
          "hidden absolute top-16 left-4 z-20 transition-all duration-300 shadow-2xl rounded-xl border backdrop-blur-md",
          isLegendCollapsed ? "w-10 h-10 p-0 flex items-center justify-center rounded-full overflow-hidden" : "w-64 p-3.5",
          theme === 'dark' 
            ? "bg-zinc-950/90 border-zinc-800 text-white" 
            : "bg-white/95 border-zinc-200 text-zinc-900"
        )}
      >
        {isLegendCollapsed ? (
          <button
            type="button"
            onClick={() => setIsLegendCollapsed(false)}
            className="w-full h-full flex items-center justify-center hover:bg-blue-600/10 text-blue-500 rounded-full transition-colors"
            title="Afficher la légende"
          >
            <Info size={18} />
          </button>
        ) : (
          <div className="space-y-3">
            {/* Header */}
            <div className={cn(
              "flex items-center justify-between pb-2 border-b",
              theme === 'dark' ? "border-zinc-800/60" : "border-zinc-200"
            )}>
              <div className="flex items-center gap-1.5">
                <Info size={14} className="text-blue-500" />
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider">Légende Équipements</h4>
                  <p className="text-[9px] text-zinc-500 font-medium font-sans">Active Equipment Legend</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLegendCollapsed(true)}
                className={cn(
                  "p-1 rounded transition-colors",
                  theme === 'dark' 
                    ? "hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200" 
                    : "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800"
                )}
                title="Réduire"
              >
                <ChevronUp size={14} />
              </button>
            </div>

            {/* Legend List */}
            <div className="space-y-2.5">
              {/* CCTV */}
              <div className={cn(
                "flex items-center justify-between gap-2 p-1.5 rounded-lg border",
                theme === 'dark' 
                  ? "bg-zinc-900/30 border-zinc-800/40" 
                  : "bg-zinc-50 border-zinc-200"
              )}>
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Video size={14} className="text-blue-500" />
                    {/* Tiny representation of the sector color */}
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3b82f6] border border-zinc-950" title="Zone de couverture (Bleu)" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold block">CCTV / Caméras</span>
                    <span className="text-[9px] text-zinc-500 block">
                      {cctvCount} {cctvCount > 1 ? 'actives' : 'active'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVisibleCoverage(prev => ({ ...prev, cctv: !prev.cctv }))}
                  className={cn(
                    "p-1.5 rounded-md border transition-all",
                    visibleCoverage.cctv 
                      ? "text-blue-500 bg-blue-500/10 border-blue-500/30" 
                      : theme === 'dark'
                        ? "text-zinc-600 bg-zinc-900/50 border-zinc-800 hover:text-zinc-400"
                        : "text-zinc-400 bg-zinc-100 border-zinc-200 hover:text-zinc-600"
                  )}
                  title={visibleCoverage.cctv ? "Masquer la couverture" : "Afficher la couverture"}
                >
                  {visibleCoverage.cctv ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              </div>

              {/* WIFI */}
              <div className={cn(
                "flex items-center justify-between gap-2 p-1.5 rounded-lg border",
                theme === 'dark' 
                  ? "bg-zinc-900/30 border-zinc-800/40" 
                  : "bg-zinc-50 border-zinc-200"
              )}>
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 rounded-md bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <Wifi size={14} className="text-green-600" />
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#22c55e] border border-zinc-950" title="Signal WiFi (Vert)" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold block">WiFi AP / Réseau</span>
                    <span className="text-[9px] text-zinc-500 block">
                      {wifiCount} {wifiCount > 1 ? 'actives' : 'active'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVisibleCoverage(prev => ({ ...prev, wifi: !prev.wifi }))}
                  className={cn(
                    "p-1.5 rounded-md border transition-all",
                    visibleCoverage.wifi 
                      ? "text-green-600 bg-green-500/10 border-green-500/30" 
                      : theme === 'dark'
                        ? "text-zinc-600 bg-zinc-900/50 border-zinc-800 hover:text-zinc-400"
                        : "text-zinc-400 bg-zinc-100 border-zinc-200 hover:text-zinc-600"
                  )}
                  title={visibleCoverage.wifi ? "Masquer la couverture" : "Afficher la couverture"}
                >
                  {visibleCoverage.wifi ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              </div>

              {/* FIRE */}
              <div className={cn(
                "flex items-center justify-between gap-2 p-1.5 rounded-lg border",
                theme === 'dark' 
                  ? "bg-zinc-900/30 border-zinc-800/40" 
                  : "bg-zinc-50 border-zinc-200"
              )}>
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 rounded-md bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <Flame size={14} className="text-red-500" />
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#ef4444] border border-zinc-950" title="Rayon incendie (Rouge)" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold block">Incendie / Fumée</span>
                    <span className="text-[9px] text-zinc-500 block">
                      {fireCount} {fireCount > 1 ? 'actifs' : 'actif'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVisibleCoverage(prev => ({ ...prev, fire: !prev.fire }))}
                  className={cn(
                    "p-1.5 rounded-md border transition-all",
                    visibleCoverage.fire 
                      ? "text-red-500 bg-red-500/10 border-red-500/30" 
                      : theme === 'dark'
                        ? "text-zinc-600 bg-zinc-900/50 border-zinc-800 hover:text-zinc-400"
                        : "text-zinc-400 bg-zinc-100 border-zinc-200 hover:text-zinc-600"
                  )}
                  title={visibleCoverage.fire ? "Masquer la couverture" : "Afficher la couverture"}
                >
                  {visibleCoverage.fire ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              </div>

              {/* NETWORK / ALARM */}
              <div className={cn(
                "flex items-center justify-between gap-2 p-1.5 rounded-lg border",
                theme === 'dark' 
                  ? "bg-zinc-900/30 border-zinc-800/40" 
                  : "bg-zinc-50 border-zinc-200"
              )}>
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 rounded-md bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <Siren size={14} className="text-rose-500" />
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#f43f5e] border border-zinc-950" title="Portée Sirène (Rose)" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold block">Alarmes & Switchs</span>
                    <span className="text-[9px] text-zinc-500 block">
                      {networkCount} {networkCount > 1 ? 'actifs' : 'actif'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVisibleCoverage(prev => ({ ...prev, network: !prev.network }))}
                  className={cn(
                    "p-1.5 rounded-md border transition-all",
                    visibleCoverage.network 
                      ? "text-rose-500 bg-rose-500/10 border-rose-500/30" 
                      : theme === 'dark'
                        ? "text-zinc-600 bg-zinc-900/50 border-zinc-800 hover:text-zinc-400"
                        : "text-zinc-400 bg-zinc-100 border-zinc-200 hover:text-zinc-600"
                  )}
                  title={visibleCoverage.network ? "Masquer la couverture" : "Afficher la couverture"}
                >
                  {visibleCoverage.network ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Group Selection Toolbar */}
      {marqueeSelectedIds.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-950/95 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-3 shadow-2xl z-30 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 border-r border-zinc-800 pr-3">
            <div className="w-5 h-5 bg-emerald-500/15 text-emerald-400 rounded-md flex items-center justify-center">
              <MousePointerSquareDashed size={12} />
            </div>
            <span className="text-[11px] font-mono font-bold text-zinc-100">
              {marqueeSelectedIds.length} sélectionné{marqueeSelectedIds.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleGroupRotate(90)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-[10px] font-mono font-bold hover:bg-zinc-800 hover:text-white transition-all active:scale-95 cursor-pointer"
              title="Pivoter toute la sélection de 90°"
            >
              <RotateCw size={11} className="text-purple-400" />
              <span>PIVOTER 90°</span>
            </button>

            <button
              onClick={handleGroupDuplicate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-[10px] font-mono font-bold hover:bg-zinc-800 hover:text-white transition-all active:scale-95 cursor-pointer"
              title="Dupliquer la sélection"
            >
              <Copy size={11} className="text-emerald-400" />
              <span>DUPLIQUER</span>
            </button>

            <button
              onClick={handleGroupDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/45 border border-rose-900/40 text-rose-400 rounded-xl text-[10px] font-mono font-bold hover:bg-rose-900/30 transition-all active:scale-95 cursor-pointer"
              title="Supprimer la sélection"
            >
              <Trash2 size={11} />
              <span>SUPPRIMER</span>
            </button>

            <button
              onClick={() => setMarqueeSelectedIds([])}
              className="flex items-center justify-center p-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all active:scale-95 cursor-pointer"
              title="Deselect all"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

