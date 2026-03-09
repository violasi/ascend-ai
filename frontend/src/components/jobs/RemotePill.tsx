export function RemotePill({ remote }: { remote: boolean }) {
  if (!remote) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
      🌍 Remote
    </span>
  );
}
