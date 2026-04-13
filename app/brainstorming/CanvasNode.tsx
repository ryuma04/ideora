import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

export default memo(function CanvasNode({ id, data, isConnectable }: any) {
    const bgColor = data.color || 'bg-white';
    
    return (
        <div className={`relative px-4 py-3 shadow-sm rounded-md ${bgColor} text-slate-900 min-w-[150px] flex items-center justify-center border border-slate-300 transition-all hover:shadow-md hover:border-indigo-400 group`}>
            {/* Minimal invisible handles to allow connecting elements on the canvas if desired */}
            <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 bg-indigo-500 border-none" />
            <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 bg-indigo-500 border-none" />
             
            <textarea 
                className="bg-transparent text-slate-800 font-medium outline-none w-full resize-none placeholder-slate-400 nodrag min-h-[40px] overflow-hidden"
                value={data.label}
                onChange={(e) => {
                    // Auto-resize textarea height
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                    data.onChange(id, e.target.value);
                }}
                onFocus={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                }}
                placeholder="Type text..."
                rows={1}
            />
             
            <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 bg-indigo-500 border-none" />
            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 bg-indigo-500 border-none" />
        </div>
    );
});
