"use client";
import React, { useRef, useState, useEffect } from 'react';
import { Folder, FileCode, File, Box, Database, Lock, Globe, Server, AlertCircle } from 'lucide-react';

// --- Types ---
interface Node {
    id: string;
    type: 'folder' | 'file';
    name: string;
    x: number;
    y: number;
    connections: string[]; // Connected Node IDs
    fileType?: string;
    path?: string;
}

interface ApiNode {
    id: string;
    type: string;
    name: string;
    path: string;
    fileType?: string;
}

interface ApiLink {
    source: string;
    target: string;
}

interface RepoVisualizerProps {
    projectId?: string;
}

import { useUser } from '@/hooks/useUser';

// --- Component ---
export function RepoVisualizer({ projectId }: RepoVisualizerProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [graph, setGraph] = useState<{ nodes: Node[], width: number, height: number } | null>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [dragging, setDragging] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { session } = useUser();

    // --- Layout Engine (Simple Tree) ---
    const processGraph = (apiNodes: ApiNode[], apiLinks: ApiLink[]) => {
        const nodes: Node[] = [];
        const width = 2000;
        const height = 1500;

        // 1. Map API nodes to internal nodes (without XY yet)
        const nodeMap = new Map<string, Node>();

        // Find Root (usually id="ROOT")
        const rootApi = apiNodes.find(n => n.id === "ROOT") || apiNodes[0];

        if (!rootApi) return null;

        apiNodes.forEach(api => {
            nodeMap.set(api.id, {
                id: api.id,
                type: api.type as any,
                name: api.name,
                x: 0,
                y: 0,
                connections: [],
                fileType: api.fileType,
                path: api.path
            });
        });

        // 2. Build Hierarchy & Connections
        const childrenMap = new Map<string, string[]>();

        apiLinks.forEach(link => {
            const source = nodeMap.get(link.source);
            const target = nodeMap.get(link.target);
            if (source && target) {
                // Directional: Source (Parent) -> Target (Child)
                source.connections.push(target.id);

                if (!childrenMap.has(source.id)) childrenMap.set(source.id, []);
                childrenMap.get(source.id)?.push(target.id);
            }
        });

        // 3. Recursive Layout (Radial or Tree)
        // Let's do a simple Radial layout for "Cool Factor" or Layered Tree.
        // Layered Tree is safer for file systems.

        const levels = new Map<string, number>();
        const assignLevels = (id: string, level: number) => {
            levels.set(id, level);
            const children = childrenMap.get(id) || [];
            children.forEach(childId => assignLevels(childId, level + 1));
        };
        assignLevels(rootApi.id, 0);

        // Group by level
        const nodesByLevel = new Map<number, Node[]>();
        nodeMap.forEach(node => {
            const lvl = levels.get(node.id) || 0;
            if (!nodesByLevel.has(lvl)) nodesByLevel.set(lvl, []);
            nodesByLevel.get(lvl)?.push(node);
        });

        const LEVEL_HEIGHT = 180;

        nodesByLevel.forEach((levelNodes, level) => {
            const count = levelNodes.length;
            const rowWidth = count * 120;
            const startX = (width - rowWidth) / 2;

            levelNodes.forEach((node, idx) => {
                node.y = 100 + (level * LEVEL_HEIGHT);
                node.x = startX + (idx * 120) + (Math.random() * 20); // Add slight jitter
                nodes.push(node);
            });
        });

        // Center view on Root
        const rootNode = nodeMap.get(rootApi.id);
        if (rootNode) {
            setOffset({ x: (window.innerWidth / 2) - rootNode.x, y: 100 });
        }

        return { nodes, width, height };
    };

    useEffect(() => {
        if (!projectId || !session?.access_token) {
            setGraph(null);
            return;
        }

        const fetchGraph = async () => {
            setLoading(true);
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/v1/projects/${projectId}/structure`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.nodes.length > 0) {
                        const processed = processGraph(data.nodes, data.links);
                        setGraph(processed);
                    } else {
                        setGraph(null); // No structure found
                    }
                }
            } catch (e) {
                console.error("Failed to fetch repo structure", e);
                setGraph(null);
            } finally {
                setLoading(false);
            }
        };

        fetchGraph();
    }, [projectId, session?.access_token]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        setLastPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging) return;
        const dx = e.clientX - lastPos.x;
        const dy = e.clientY - lastPos.y;
        setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setDragging(false);
    const handleWheel = (e: React.WheelEvent) => {
        setZoom(prev => Math.min(Math.max(prev - e.deltaY * 0.001, 0.1), 3));
    };

    // Render Empty State
    if (!projectId) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#080b0f] text-foreground-muted">
                <div className="text-center p-8 border border-dashed border-white/10 rounded-xl bg-surface-elevated/20">
                    <Database className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <h3 className="text-sm font-medium text-foreground">No Repository Selected</h3>
                    <p className="text-xs mt-1">Select a project from the sidebar to visualize its architecture.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#080b0f] text-accent-blue font-mono text-xs animate-pulse">
                INITIALIZING TOPOLOGY MAP...
            </div>
        );
    }

    if (!graph) return (
        <div className="w-full h-full flex items-center justify-center bg-[#080b0f] text-foreground-muted">
            <div className="text-center">
                <h3 className="text-sm">Empty or Unindexed Repository</h3>
            </div>
        </div>
    );

    return (
        <div
            className="w-full h-full bg-[#080b0f] relative overflow-hidden cursor-move font-mono select-none"
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            <div className="absolute top-4 left-4 z-10 bg-surface-elevated/80 backdrop-blur border border-white/5 p-3 rounded-lg pointer-events-none">
                <div className="text-xs text-foreground font-semibold uppercase tracking-wider mb-1">Architecture Topology</div>
                <div className="text-[10px] text-foreground-muted">Pan to explore • Scroll to zoom</div>
            </div>

            <div
                className="absolute inset-0 transition-transform duration-75 origin-center ease-out"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
            >
                <svg width={graph.width} height={graph.height} className="overflow-visible">
                    {/* Links - Use a unique set to avoid duplicates if data is messy */}
                    {graph.nodes.flatMap(node =>
                        node.connections.map(targetId => {
                            const target = graph.nodes.find(n => n.id === targetId);
                            if (!target) return null;
                            // Unique Key: SourceID-TargetID
                            return (
                                <line
                                    key={`link-${node.id}-${targetId}`}
                                    x1={node.x} y1={node.y}
                                    x2={target.x} y2={target.y}
                                    stroke={hoveredNode === node.id || hoveredNode === targetId ? "#4F8BFF" : "#2d3342"}
                                    strokeWidth={hoveredNode === node.id || hoveredNode === targetId ? 2 : 1}
                                    className="transition-all duration-300"
                                />
                            );
                        })
                    )}
                </svg>

                {/* Nodes */}
                {graph.nodes.map(node => {
                    const isHovered = hoveredNode === node.id;
                    return (
                        <div
                            key={node.id}
                            className={`absolute flex flex-col items-center justify-center w-auto min-w-[32px] h-8 -ml-4 -mt-4 transition-all duration-300 group z-10
                                ${isHovered ? 'z-50 scale-110' : ''}
                            `}
                            style={{ left: node.x, top: node.y }}
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                        >
                            {/* Icon Circle */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isHovered
                                ? 'bg-surface-elevated border-accent-blue shadow-[0_0_15px_rgba(79,139,255,0.4)]'
                                : 'bg-surface border-white/10'
                                }`}>
                                {node.type === 'folder' && <Folder className="w-4 h-4 text-foreground-muted" />}
                                {node.type === 'file' && <FileCode className={`w-4 h-4 ${node.fileType === 'ts' || node.fileType === 'tsx' ? 'text-blue-400' : 'text-foreground-secondary'}`} />}
                            </div>

                            {/* Label (Only show on hover or for Folders) */}
                            {(isHovered || node.type === 'folder') && (
                                <div className={`absolute top-9 text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap ${isHovered ? 'bg-black/80 text-white' : 'text-foreground-muted/70'
                                    }`}>
                                    {node.name}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Grid Pattern Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px', transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
            />
        </div>
    );
}
