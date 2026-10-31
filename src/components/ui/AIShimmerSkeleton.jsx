import React from 'react';

export const AIShimmerSkeleton = ({ title = "AI Intelligence Loading..." }) => {
  return (
    <div className="w-full h-full min-h-[400px] p-6 glass-panel rounded-2xl flex flex-col gap-6 relative overflow-hidden">
      {/* Top Banner Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg shimmer-skeleton" />
          <div className="space-y-2">
            <div className="w-48 h-5 rounded shimmer-skeleton" />
            <div className="w-32 h-3 rounded shimmer-skeleton" />
          </div>
        </div>
        <div className="px-4 py-2 rounded-full shimmer-skeleton w-36 h-8 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          {title}
        </div>
      </div>

      {/* Grid Content Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-2">
        <div className="h-44 rounded-xl shimmer-skeleton border border-white/5" />
        <div className="h-44 rounded-xl shimmer-skeleton border border-white/5" />
        <div className="h-44 rounded-xl shimmer-skeleton border border-white/5" />
      </div>

      {/* Detail Block */}
      <div className="flex-1 rounded-xl shimmer-skeleton border border-white/5 p-6 flex flex-col justify-end gap-3">
        <div className="w-3/4 h-6 rounded shimmer-skeleton" />
        <div className="w-1/2 h-4 rounded shimmer-skeleton" />
        <div className="w-full h-12 rounded-lg shimmer-skeleton mt-4" />
      </div>
    </div>
  );
};
