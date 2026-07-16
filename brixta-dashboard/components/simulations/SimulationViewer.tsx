"use client";

import { useMemo, useState } from "react";
import { Box, Gauge, Waves } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { SimulationVisualization } from "@/types/types";

type Point = [number, number];

function bounds(scene: SimulationVisualization) {
  const values = scene.meshes.flatMap((mesh) => mesh.vertices);
  const dimensions = [0, 1, 2].map((axis) => {
    const axisValues = values.map((value) => value[axis] || 0);
    return [Math.min(...axisValues), Math.max(...axisValues)] as const;
  });
  return dimensions;
}

export default function SimulationViewer({ scene }: { scene: SimulationVisualization }) {
  const [deformationScale, setDeformationScale] = useState(1);
  const projection = useMemo(() => {
    const domain = bounds(scene);
    const dx = Math.max(domain[0][1] - domain[0][0], 1e-9);
    const dy = Math.max(domain[1][1] - domain[1][0], 1e-9);
    const dz = Math.max(domain[2][1] - domain[2][0], 1e-9);
    const scale = Math.min(610 / (dx + dy * 0.55), 240 / (dz + dy * 0.35));
    const project = (value: number[]): Point => {
      const x = (value[0] - domain[0][0]) + (value[1] - domain[1][0]) * 0.55;
      const y = (value[2] - domain[2][0]) + (value[1] - domain[1][0]) * 0.35;
      return [80 + x * scale, 300 - y * scale];
    };
    return { project };
  }, [scene]);

  const mesh = scene.meshes[0];
  const vertices = mesh.vertices.map((vertex, index) => {
    const displacement = mesh.displacements?.[index] || [0, 0, 0];
    return projection.project(vertex.map((value, axis) => value + (displacement[axis] || 0) * deformationScale));
  });
  const scalar = mesh.scalar;

  return (
    <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-muted/60 to-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">{scene.kind === "flow" ? <Waves size={16} /> : <Box size={16} />}{scene.title}</p>
          <p className="text-xs text-muted-foreground">{scene.source_label}</p>
        </div>
        <Badge variant="secondary">{scene.units}</Badge>
      </div>
      <svg viewBox="0 0 800 360" className="h-auto min-h-72 w-full" role="img" aria-label={scene.title}>
        <defs>
          <linearGradient id="brixta-field" x1="0" x2="1">
            <stop offset="0" stopColor="hsl(215 90% 58%)" />
            <stop offset="0.55" stopColor="hsl(165 75% 45%)" />
            <stop offset="1" stopColor="hsl(18 88% 58%)" />
          </linearGradient>
          <marker id="brixta-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker>
        </defs>
        <rect width="800" height="360" fill="transparent" />
        {mesh.triangles.map((triangle, index) => {
          const points = triangle.map((vertexIndex) => vertices[vertexIndex].join(",")).join(" ");
          return <polygon key={`${triangle.join("-")}-${index}`} points={points} fill="url(#brixta-field)" fillOpacity={mesh.opacity ?? 0.45} stroke="currentColor" strokeOpacity="0.45" strokeWidth="1" />;
        })}
        {scene.streamlines.map((line, index) => <polyline key={index} points={line.points.map((point) => projection.project(point).join(",")).join(" ")} fill="none" stroke="hsl(195 85% 52%)" strokeOpacity="0.72" strokeWidth="2" />)}
        {scene.vectors.slice(0, 80).map((vector, index) => {
          const start = projection.project(vector.position);
          const length = 14 + Math.min(vector.magnitude * 10, 34);
          return <line key={index} x1={start[0]} y1={start[1]} x2={start[0] + length} y2={start[1]} stroke="hsl(18 88% 58%)" strokeWidth="1.5" markerEnd="url(#brixta-arrow)" />;
        })}
        {scene.annotations.map((annotation) => {
          const point = projection.project(annotation.position);
          return <g key={`${annotation.label}-${point.join("-")}`}><circle cx={point[0]} cy={point[1]} r="3" fill="currentColor" /><text x={point[0] + 7} y={point[1] - 7} fill="currentColor" fontSize="12">{annotation.label}</text></g>;
        })}
      </svg>
      <div className="grid gap-4 border-t p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="deformation-scale">Visual deformation scale · {deformationScale.toFixed(1)}×</Label>
          <input id="deformation-scale" className="w-full accent-current" type="range" min="0" max="25" step="0.5" value={deformationScale} onChange={(event) => setDeformationScale(Number(event.target.value))} disabled={scene.kind === "flow"} />
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2 text-xs">
          <Gauge size={16} />
          <span>{scalar ? `${scalar.name}: ${Math.min(...scalar.values).toPrecision(4)}–${Math.max(...scalar.values).toPrecision(4)} ${scalar.unit}` : "No normalized scalar field"}</span>
        </div>
      </div>
    </div>
  );
}
