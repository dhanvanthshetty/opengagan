import React, { useCallback, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { Connection, NodeProps, EdgeChange, EdgeMouseHandler } from 'reactflow'
import proceduresData from '../../../../shared/src/data/procedures.json'

// Procedure waypoint types in correct sequence order
const WAYPOINT_ORDER = proceduresData.waypointOrder as readonly ['IAF', 'IF', 'FAF', 'MAP', 'MISSED']
type WaypointType = typeof WAYPOINT_ORDER[number]

const WAYPOINT_COLORS = proceduresData.waypointColors as Record<WaypointType, string>

const WAYPOINT_LABELS = proceduresData.waypointLabels as Record<WaypointType, string>

interface WaypointData {
  waypointType: WaypointType
  label: string
}

function WaypointNode({ data }: NodeProps<WaypointData>) {
  const color = WAYPOINT_COLORS[data.waypointType]
  return (
    <div
      className="px-4 py-2.5 rounded-xl border-2 text-sm font-medium min-w-[160px] text-center"
      style={{
        background: 'rgba(236,232,212,0.95)',
        borderColor: color + 'aa',
        boxShadow: `0 2px 12px ${color}22`,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: color, border: `2px solid ${color}` }} />
      <div className="text-xs font-bold" style={{ color }}>{data.waypointType}</div>
      <div className="text-xs mt-0.5" style={{ color: '#2d3d5c' }}>{data.label}</div>
      <Handle type="source" position={Position.Right} style={{ background: color, border: `2px solid ${color}` }} />
    </div>
  )
}

const nodeTypes = { waypoint: WaypointNode }

// Build initial spaced-out nodes so user sees them pre-placed
function buildInitialNodes() {
  return WAYPOINT_ORDER.map((type, i) => ({
    id: type,
    type: 'waypoint' as const,
    position: { x: i * 200, y: 80 },
    data: { waypointType: type, label: WAYPOINT_LABELS[type].split('—')[1].trim() },
    draggable: true,
  }))
}

// Validate: edges must form the sequence IAF→IF→FAF→MAP→MISSED in order
function validateSequence(edgeList: Array<{ source: string; target: string }>): {
  valid: boolean
  message: string
  invalidPairs: Set<string>
} {
  const invalidPairs = new Set<string>()

  for (const edge of edgeList) {
    const srcIdx = WAYPOINT_ORDER.indexOf(edge.source as WaypointType)
    const tgtIdx = WAYPOINT_ORDER.indexOf(edge.target as WaypointType)
    if (srcIdx === -1 || tgtIdx === -1 || tgtIdx !== srcIdx + 1) {
      invalidPairs.add(`${edge.source}-${edge.target}`)
    }
  }

  let message = ''
  if (edgeList.length === 0) {
    message = 'Connect the waypoints in sequence to build the procedure.'
  } else if (invalidPairs.size > 0) {
    message = 'Wrong sequence — approach fixes must follow IAF → IF → FAF → MAP → MISSED.'
  } else if (edgeList.length < WAYPOINT_ORDER.length - 1) {
    message = `Good so far! Connect ${WAYPOINT_ORDER.length - 1 - edgeList.length} more.`
  } else {
    message = 'Correct procedure sequence!'
  }

  return { valid: invalidPairs.size === 0 && edgeList.length === WAYPOINT_ORDER.length - 1, message, invalidPairs }
}

export function ApproachPlateBuilder() {
  const [nodes, , onNodesChange] = useNodesState(buildInitialNodes())
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [, setHint] = useState('Connect the waypoints left to right to build your approach procedure.')

  const validation = validateSequence(edges)

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({
      ...connection,
      animated: true,
      style: { stroke: '#6b7838', strokeWidth: 2 },
      deletable: true,
    }, eds))
  }, [setEdges])

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes)
  }, [onEdgesChange])

  // Double-click an edge to delete it
  const onEdgeDoubleClick: EdgeMouseHandler = useCallback((_evt, edge) => {
    setEdges((eds) => eds.filter((e) => e.id !== edge.id))
  }, [setEdges])

  function reset() {
    setEdges([])
    setHint('Connect the waypoints left to right to build your approach procedure.')
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: '1px solid rgba(26,37,64,0.18)',
        boxShadow: '0 4px 16px rgba(26,37,64,0.10)',
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(26,37,64,0.12)', background: 'rgba(26,37,64,0.05)' }}
      >
        <div>
          <h3 className="font-semibold text-sm" style={{ color: '#1a2540' }}>Approach Plate Builder</h3>
          <p className="text-xs mt-0.5" style={{ color: '#6b7838' }}>
            Drag nodes · Drag between handles to connect · Double-click a line to remove it
          </p>
        </div>
        <button
          onClick={reset}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{
            background: 'rgba(26,37,64,0.08)',
            color: '#2d3d5c',
            border: '1px solid rgba(26,37,64,0.14)',
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ height: 280 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onEdgeDoubleClick={onEdgeDoubleClick}
          nodeTypes={nodeTypes}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          style={{ background: 'rgba(236,232,212,0.50)' }}
        >
          <Background color="rgba(26,37,64,0.08)" gap={20} />
          <Controls
            showInteractive={false}
            style={{
              background: 'rgba(236,232,212,0.93)',
              border: '1px solid rgba(26,37,64,0.14)',
            }}
          />
        </ReactFlow>
      </div>

      <div
        className="px-5 py-3 text-sm flex items-center gap-2"
        style={{
          borderTop: '1px solid rgba(26,37,64,0.12)',
          background: 'rgba(26,37,64,0.04)',
          color: validation.valid ? '#15803d' : validation.invalidPairs.size > 0 ? '#dc2626' : '#2d3d5c',
        }}
      >
        <span className="text-base">{validation.valid ? '✓' : validation.invalidPairs.size > 0 ? '✗' : 'ℹ'}</span>
        {validation.message}
      </div>
    </div>
  )
}
