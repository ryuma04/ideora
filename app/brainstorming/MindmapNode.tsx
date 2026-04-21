import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

export default memo(function MindmapNode({ id, data, isConnectable }: any) {
    const bgColor = data.color || 'bg-blue-500';

    return (
        <div className={`relative px-2 sm:px-4 py-2 sm:py-3 shadow-xl rounded-xl ${bgColor} text-white min-w-[150px] sm:min-w-[200px] flex items-center justify-center border-2 border-white/20 transition-all hover:shadow-2xl`}>
             <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-white border-2 border-slate-800" />
             <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-white border-2 border-slate-800" />
             
             <textarea 
                  className="bg-transparent text-white font-medium outline-none w-full text-center resize-none placeholder-white/70 nodrag"
                  value={data.label}
                  onChange={(e) => data.onChange(id, e.target.value)}
                  placeholder="Type an idea..."
                  rows={3}
             />
             
             {/* Branch Button */}
             <button
                 className="absolute -right-3 -top-3 bg-pink-500 hover:bg-pink-400 border-2 border-white rounded-full w-8 h-8 flex items-center justify-center text-white text-lg font-bold shadow-lg hover:scale-110 transition-transform nodrag z-10"
                 onClick={() => data.onBranch(id)}
                 title="Add branch"
             >
                 +
             </button>

             <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-white border-2 border-slate-800" />
             <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-white border-2 border-slate-800" />
        </div>
    );
});
