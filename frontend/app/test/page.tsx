'use client';

import '@xyflow/react/dist/style.css';

import {
  ReactFlow,
  Position,
  useNodesState,
  Node,
  Background,
  Controls,
} from '@xyflow/react';

import {
  TooltipNode,
  TooltipContent,
  TooltipTrigger,
} from '@/components/tooltip-node';

function Tooltip() {
  return (
    <TooltipNode>
      <TooltipContent position={Position.Top}>Hidden Content</TooltipContent>
      <TooltipTrigger>Hover</TooltipTrigger>
    </TooltipNode>
  );
}

const nodeTypes = {
  tooltip: Tooltip,
};

const initialNodes: Node[] = [
  {
    id: '1',
    position: { x: 0, y: 0 },
    data: {},
    type: 'tooltip',
  },
];

export default function Page() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);

  return (
    <div className="h-screen w-screen p-8">
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
