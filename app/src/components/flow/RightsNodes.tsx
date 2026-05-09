import React from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'

interface NodeData {
  label: string
  rule?: string
  amount?: number
  active?: boolean
}

export function StartNode({ data }: NodeProps<NodeData>) {
  return (
    <div className={`px-4 py-2 rounded-full border-2 text-sm font-bold transition-colors ${
      data.active ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-700 border-slate-500 text-slate-200'
    }`}>
      {data.label}
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  )
}

export function CheckNode({ data }: NodeProps<NodeData>) {
  return (
    <div className={`px-4 py-3 rounded-xl border text-sm font-medium min-w-[160px] text-center transition-colors ${
      data.active ? 'bg-amber-500/20 border-amber-400/60 text-amber-200' : 'bg-slate-800 border-slate-600 text-slate-400'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-500" />
      {data.label}
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500" />
    </div>
  )
}

export function EntitlementNode({ data }: NodeProps<NodeData>) {
  return (
    <div className={`px-4 py-3 rounded-xl border text-sm min-w-[180px] transition-colors ${
      data.active ? 'bg-green-500/20 border-green-400/60 text-green-300' : 'bg-slate-800 border-slate-700 text-slate-500'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-500" />
      <div className="font-medium">{data.label}</div>
      {data.amount && (
        <div className={`text-xs font-mono mt-0.5 ${data.active ? 'text-green-400' : 'text-slate-600'}`}>
          ₹{data.amount.toLocaleString('en-IN')}
        </div>
      )}
      {data.rule && (
        <div className="text-xs text-slate-600 mt-0.5">{data.rule}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500" />
    </div>
  )
}

export function ActionNode({ data }: NodeProps<NodeData>) {
  return (
    <div className={`px-5 py-3 rounded-xl border-2 text-sm font-semibold min-w-[200px] text-center transition-colors ${
      data.active ? 'bg-blue-700/30 border-blue-400/70 text-blue-300' : 'bg-slate-800 border-slate-600 text-slate-400'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      {data.label}
    </div>
  )
}

export const rightsNodeTypes = {
  start:       StartNode,
  check:       CheckNode,
  entitlement: EntitlementNode,
  action:      ActionNode,
}
