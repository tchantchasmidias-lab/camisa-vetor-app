export default function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] w-full rounded-xl bg-gray-300" />
      <div className="mt-4 space-y-2">
        <div className="h-4 rounded-md bg-gray-300 w-3/4" />
        <div className="h-4 rounded-md bg-gray-300 w-1/2" />
      </div>
    </div>
  );
}
