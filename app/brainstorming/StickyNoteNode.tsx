import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

export default memo(function StickyNoteNode({ id, data, isConnectable }: any) {
    const bgColor = data.color || 'bg-[#ffc034]';
    const borderColor = data.borderColor || 'border-[#ffae00]';

    return (
        <div className={`relative w-40 h-40 sm:w-48 sm:h-48 shadow-lg ${bgColor} border-t-[8px] sm:border-t-[12px] ${borderColor} flex flex-col items-center justify-start p-2 sm:p-3 transition-transform hover:-translate-y-1 hover:shadow-2xl rounded-b-md`}>
            <Handle type="target" position={Position.Top} id="t" isConnectable={isConnectable} className="w-3 h-3 bg-slate-800" />
            <Handle type="source" position={Position.Right} id="r" isConnectable={isConnectable} className="w-3 h-3 bg-slate-800" />
            <Handle type="source" position={Position.Bottom} id="b" isConnectable={isConnectable} className="w-3 h-3 bg-slate-800" />
            <Handle type="target" position={Position.Left} id="l" isConnectable={isConnectable} className="w-3 h-3 bg-slate-800" />

            <textarea
                className="bg-transparent text-slate-900 font-medium outline-none w-full h-full resize-none placeholder-slate-800/60 nodrag text-base leading-relaxed"
                value={data.label}
                onChange={(e) => data.onChange(id, e.target.value)}
                placeholder="Type note here..."
            />
        </div>
    );
});
