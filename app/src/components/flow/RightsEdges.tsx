import React from 'react'
import { BaseEdge, EdgeLabelRenderer, getStraightPath } from 'reactflow'
import type { EdgeProps } from 'reactflow'

export function RightsEdge({
  id, sourceX, sourceY, targetX, targetY, label, data,
}: EdgeProps & { data?: { active?: boolean } }) {
  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  const active = data?.active ?? false

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: active ? '#60a5fa' : '#334155',
          strokeWidth: active ? 2 : 1,
          transition: 'stroke 0.3s',
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)` }}
            className="absolute text-[10px] text-slate-500 pointer-events-none bg-slate-900 px-1 rounded"
          >
            {label as string}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const rightsEdgeTypes = {
  default: RightsEdge,
}
