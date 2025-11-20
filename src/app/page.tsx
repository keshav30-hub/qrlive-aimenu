export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="flex min-h-screen">
      <div className="w-[10%] bg-gray-200 p-4">
        <h2 className="text-lg font-bold">Column 1</h2>
      </div>
      <div className="w-[90%] bg-gray-100 p-4">
        <h2 className="text-lg font-bold">Column 2</h2>
      </div>
    </main>
  );
}
