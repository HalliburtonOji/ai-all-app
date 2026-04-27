export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-black sm:text-6xl dark:text-white">
          AI All App
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-zinc-600 sm:text-xl dark:text-zinc-400">
          Coming soon — your AI workshop, classroom, and earnings hub in one place.
        </p>
      </div>
      <p className="absolute bottom-6 text-sm text-zinc-500 dark:text-zinc-500">
        Built by Halli
      </p>
    </main>
  );
}
