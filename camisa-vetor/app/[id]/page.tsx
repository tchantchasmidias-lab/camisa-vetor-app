export default function ProductPage({ params }: { params: { id: string } }) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-900 text-white">
            <h1 className="text-4xl">Produto {params.id}</h1>
        </main>
    );
}
