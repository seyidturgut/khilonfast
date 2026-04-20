import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { Automation, AutomationNodeType, NodeConfig, ValidationResult } from '../types';
import { nodeTypes } from '../components/nodes/nodeRegistry';
import NodePalette from '../components/sidebar/NodePalette';
import NodeInspector from '../components/inspector/NodeInspector';
import BuilderToolbar from '../components/toolbar/BuilderToolbar';
import {
  getAutomationById,
  updateAutomation,
  activateAutomation,
  deactivateAutomation,
  validateFlow,
} from '../services/automationService';
import {
  automationNodesToFlowNodes,
  automationEdgesToFlowEdges,
  flowNodesToAutomationNodes,
  flowEdgesToAutomationEdges,
  generateNodeId,
  generateEdgeId,
} from '../utils/transform';

// ─── Inner canvas (needs ReactFlow context) ──────────────────

function BuilderCanvas({ id }: { id: string }) {
  const navigate = useNavigate();
  const { screenToFlowPosition } = useReactFlow();

  const [automation, setAutomation] = useState<Automation | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const draggedType = useRef<AutomationNodeType | null>(null);

  // Load automation
  useEffect(() => {
    getAutomationById(id).then(auto => {
      if (!auto) return;
      setAutomation(auto);
      setName(auto.name);
      setNodes(automationNodesToFlowNodes(auto.nodes));
      setEdges(automationEdgesToFlowEdges(auto.edges));
    });
  }, [id]);

  // Connect edges
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges(eds =>
        addEdge(
          {
            ...params,
            id: generateEdgeId(),
            type: 'smoothstep',
            markerEnd: { type: 'arrowclosed' as const },
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          },
          eds
        )
      ),
    [setEdges]
  );

  // Drag-and-drop from palette
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = draggedType.current;
      if (!type) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const newNode: Node = {
        id: generateNodeId(),
        type,
        position,
        data: { config: {}, label: undefined },
      };
      setNodes(ns => [...ns, newNode]);
      draggedType.current = null;
    },
    [screenToFlowPosition, setNodes]
  );

  // Node selection
  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  // Inspector: update node config
  const handleNodeUpdate = useCallback(
    (nodeId: string, config: NodeConfig) => {
      setNodes(ns =>
        ns.map(n =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, config } }
            : n
        )
      );
      // Keep selectedNode in sync
      setSelectedNode(prev =>
        prev?.id === nodeId
          ? { ...prev, data: { ...prev.data, config } }
          : prev
      );
    },
    [setNodes]
  );

  // Inspector: delete node
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes(ns => ns.filter(n => n.id !== nodeId));
      setEdges(es => es.filter(e => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  // Toolbar: save draft
  const handleSaveDraft = useCallback(async () => {
    if (!automation) return;
    setSaving(true);
    try {
      const updated = await updateAutomation(automation.id, {
        name,
        nodes: flowNodesToAutomationNodes(nodes),
        edges: flowEdgesToAutomationEdges(edges),
      });
      setAutomation(updated);
    } finally {
      setSaving(false);
    }
  }, [automation, name, nodes, edges]);

  // Toolbar: validate
  const handleValidate = useCallback(() => {
    const autoNodes = flowNodesToAutomationNodes(nodes);
    const autoEdges = flowEdgesToAutomationEdges(edges);
    setValidation(validateFlow(autoNodes, autoEdges));
  }, [nodes, edges]);

  // Toolbar: activate
  const handleActivate = useCallback(async () => {
    if (!automation) return;
    await updateAutomation(automation.id, {
      name,
      nodes: flowNodesToAutomationNodes(nodes),
      edges: flowEdgesToAutomationEdges(edges),
    });
    try {
      const updated = await activateAutomation(automation.id);
      setAutomation(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Aktivasyon başarısız');
    }
  }, [automation, name, nodes, edges]);

  // Toolbar: deactivate
  const handleDeactivate = useCallback(async () => {
    if (!automation) return;
    const updated = await deactivateAutomation(automation.id);
    setAutomation(updated);
  }, [automation]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <BuilderToolbar
        automation={automation}
        name={name}
        onNameChange={setName}
        onBack={() => navigate('/admin/automations')}
        onSaveDraft={handleSaveDraft}
        onValidate={handleValidate}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        saving={saving}
        validation={validation}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Node palette */}
        <NodePalette onDragStart={type => { draggedType.current = type; }} />

        {/* Center: React Flow canvas */}
        <div style={{ flex: 1, position: 'relative', background: '#0f2236' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            deleteKeyCode="Delete"
          >
            <Background color="#1e3a52" gap={20} />
            <Controls style={{ background: '#1a3a52', border: '1px solid #334155' }} />
            <MiniMap
              style={{ background: '#0f2236', border: '1px solid #334155' }}
              nodeColor="#334155"
            />
          </ReactFlow>
        </div>

        {/* Right: Inspector */}
        <NodeInspector
          node={selectedNode}
          onUpdate={handleNodeUpdate}
          onDelete={handleNodeDelete}
        />
      </div>
    </div>
  );
}

// ─── Page (provides ReactFlow context) ───────────────────────

export default function AutomationBuilderPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div style={{ padding: 32 }}>Geçersiz otomasyon ID</div>;
  }

  return (
    <ReactFlowProvider>
      <BuilderCanvas id={id} />
    </ReactFlowProvider>
  );
}
