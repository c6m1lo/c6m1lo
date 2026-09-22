export default function clothes() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-4xl font-bold mb-4">Clothes Store</h1>
            <p className="text-lg text-gray-600 mb-8">Browse our collection.</p>
            <br />
            <a
                href="/clothes"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-black text-white rounded hover:bg-gray-200 transition duration-300"
            >
                View Store
            </a>
        </div>
    );
}