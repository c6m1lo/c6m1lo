"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Verse = {
  number: number;
  text: string;
};

type Chapter = {
  number: number;
  verses: Verse[];
};

type Book = {
  id: string;
  name: string;
  chapters: Chapter[];
};

type BookIndexEntry = {
  id: string;
  name: string;
  chapters: number;
};

type ProgressMap = Record<string, number[]>;

const PROGRESS_KEY = "bible:chapterProgress";

function cleanVerseText(text: string) {
  return text.replace(/^#\s*/, "").trim();
}

function getSavedBookId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("bible:selectedBook") ?? "";
}

function getSavedChapter(bookId: string) {
  if (typeof window === "undefined") return 1;

  const raw = window.localStorage.getItem(`bible:selectedChapter:${bookId}`);
  const parsed = Number(raw);

  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return parsed;
}

function getSavedProgress(): ProgressMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as ProgressMap;
    if (!parsed || typeof parsed !== "object") return {};

    return parsed;
  } catch {
    return {};
  }
}

function saveProgress(progress: ProgressMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function toPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

export default function BiblePage() {
  const [bookIndex, setBookIndex] = useState<BookIndexEntry[]>([]);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [bookData, setBookData] = useState<Book | null>(null);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState<ProgressMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chapterEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setProgress(getSavedProgress());
  }, []);

  useEffect(() => {
    const loadIndex = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/kjv/index.json", { cache: "force-cache" });
        if (!response.ok) {
          throw new Error("KJV dataset not found.");
        }

        const index = (await response.json()) as BookIndexEntry[];
        if (!index.length) {
          throw new Error("KJV dataset is empty.");
        }

        setBookIndex(index);

        const savedBookId = getSavedBookId();
        const firstBook = index[0];
        const initialBookId = index.some((book) => book.id === savedBookId)
          ? savedBookId
          : firstBook.id;

        setSelectedBookId(initialBookId);
        setSelectedChapter(getSavedChapter(initialBookId));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load KJV index.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadIndex();
  }, []);

  useEffect(() => {
    const loadBook = async () => {
      if (!selectedBookId) return;

      try {
        setError(null);

        const response = await fetch(`/kjv/books/${selectedBookId}.json`, { cache: "force-cache" });
        if (!response.ok) {
          throw new Error(`Missing book file for ${selectedBookId}.`);
        }

        const nextBookData = (await response.json()) as Book;
        setBookData(nextBookData);

        const savedChapter = getSavedChapter(selectedBookId);
        const isSavedChapterValid = nextBookData.chapters.some(
          (chapter) => chapter.number === savedChapter,
        );
        const nextChapter = isSavedChapterValid ? savedChapter : nextBookData.chapters[0]?.number ?? 1;

        setSelectedChapter(nextChapter);
        window.localStorage.setItem(`bible:selectedChapter:${selectedBookId}`, String(nextChapter));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load selected book.");
      }
    };

    void loadBook();
  }, [selectedBookId]);

  const activeChapter = useMemo(() => {
    if (!bookData) return null;
    return bookData.chapters.find((chapter) => chapter.number === selectedChapter) ?? null;
  }, [bookData, selectedChapter]);

  const visibleVerses = useMemo(() => {
    if (!activeChapter) return [];
    const normalized = search.trim().toLowerCase();

    if (!normalized) return activeChapter.verses;

    return activeChapter.verses.filter((verse) =>
      cleanVerseText(verse.text).toLowerCase().includes(normalized),
    );
  }, [activeChapter, search]);

  const handleBookChange = (bookId: string) => {
    const meta = bookIndex.find((book) => book.id === bookId);
    if (!meta) return;

    setSelectedBookId(bookId);
    window.localStorage.setItem("bible:selectedBook", bookId);

    const chapterFromStorage = getSavedChapter(bookId);
    const chapter = chapterFromStorage > meta.chapters ? 1 : chapterFromStorage;
    setSelectedChapter(chapter);
    window.localStorage.setItem(`bible:selectedChapter:${bookId}`, String(chapter));
  };

  const handleChapterChange = useCallback(
    (chapter: number) => {
      setSelectedChapter(chapter);
      if (selectedBookId) {
        window.localStorage.setItem(`bible:selectedChapter:${selectedBookId}`, String(chapter));
      }
    },
    [selectedBookId],
  );

  const chapterCount = bookData?.chapters.length ?? 0;
  const canGoPrevious = selectedChapter > 1;
  const canGoNext = selectedChapter < chapterCount;
  const readChaptersInBook = progress[selectedBookId]?.length ?? 0;
  const bookProgressPercent = toPercent(readChaptersInBook, chapterCount);
  const totalChapters = useMemo(
    () => bookIndex.reduce((sum, book) => sum + book.chapters, 0),
    [bookIndex],
  );
  const readChaptersTotal = useMemo(
    () => Object.values(progress).reduce((sum, chapters) => sum + chapters.length, 0),
    [progress],
  );
  const totalProgressPercent = toPercent(readChaptersTotal, totalChapters);
  const isCurrentChapterRead =
    !!selectedBookId &&
    (progress[selectedBookId] ?? []).includes(selectedChapter);

  const handlePreviousChapter = () => {
    if (!canGoPrevious) return;
    handleChapterChange(selectedChapter - 1);
  };

  const handleNextChapter = () => {
    if (!canGoNext) return;
    handleChapterChange(selectedChapter + 1);
  };

  const markCurrentChapterRead = useCallback(() => {
    if (!selectedBookId || !activeChapter) return;

    setProgress((current) => {
      const existing = current[selectedBookId] ?? [];
      if (existing.includes(activeChapter.number)) {
        return current;
      }

      const nextForBook = [...existing, activeChapter.number].sort((a, b) => a - b);
      const next = { ...current, [selectedBookId]: nextForBook };
      saveProgress(next);
      return next;
    });
  }, [activeChapter, selectedBookId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isTypingContext =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT" ||
        target?.isContentEditable;

      if (isTypingContext || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      if (event.key === "ArrowLeft" && canGoPrevious) {
        event.preventDefault();
        handleChapterChange(selectedChapter - 1);
      }

      if (event.key === "ArrowRight" && canGoNext) {
        event.preventDefault();
        handleChapterChange(selectedChapter + 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canGoNext, canGoPrevious, handleChapterChange, selectedChapter]);

  useEffect(() => {
    if (!chapterEndRef.current || !activeChapter || !selectedBookId || isCurrentChapterRead) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          markCurrentChapterRead();
        }
      },
      { threshold: 1 },
    );

    observer.observe(chapterEndRef.current);
    return () => observer.disconnect();
  }, [activeChapter, isCurrentChapterRead, markCurrentChapterRead, selectedBookId]);

  return (
    <div className="page-wrap space-y-6">
      <section className="panel p-6 sm:p-8">
        <span className="kicker">KJV Reader</span>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">King James Bible</h1>
        <p className="muted mt-3 max-w-3xl">
          Full-text, chapter-based reading with fast local loading. Built for broad access and long-form daily use. Use the right and left arrow keys to navigate chapters.
        </p>
      </section>

      <section className="panel p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Reader Controls</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-xs">
            <span className="text-neutral-300">Book</span>
            <select
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-2 text-sm text-neutral-100"
              value={selectedBookId}
              onChange={(event) => handleBookChange(event.target.value)}
              disabled={!bookIndex.length || isLoading}
            >
              {bookIndex.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs">
            <span className="text-neutral-300">Chapter</span>
            <select
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-2 text-sm text-neutral-100"
              value={selectedChapter}
              onChange={(event) => handleChapterChange(Number(event.target.value))}
              disabled={!chapterCount || isLoading}
            >
              {Array.from({ length: chapterCount }, (_, index) => {
                const chapter = index + 1;
                return (
                  <option key={chapter} value={chapter}>
                    {chapter}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2 sm:col-span-2">
            <button
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-2 text-sm text-neutral-200 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handlePreviousChapter}
              disabled={!canGoPrevious}
              type="button"
            >
              ← Prev
            </button>
            <button
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-2 text-sm text-neutral-200 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleNextChapter}
              disabled={!canGoNext}
              type="button"
            >
              Next →
            </button>
          </div>

          <label className="flex flex-col gap-1.5 text-xs sm:col-span-2 lg:col-span-4">
            <span className="text-neutral-300">Search in chapter</span>
            <input
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-2 text-sm text-neutral-100 placeholder:text-neutral-500"
              placeholder="Search words or phrase"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
            <p className="text-xs text-neutral-400">Current Book Progress</p>
            <p className="mt-1 text-sm font-semibold text-neutral-100">
              {readChaptersInBook}/{chapterCount || 0} chapters ({bookProgressPercent}%)
            </p>
            <div className="mt-2 h-2 rounded-full bg-neutral-800">
              <div
                className="h-2 rounded-full bg-neutral-200 transition-all"
                style={{ width: `${bookProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
            <p className="text-xs text-neutral-400">Whole Bible Progress</p>
            <p className="mt-1 text-sm font-semibold text-neutral-100">
              {readChaptersTotal}/{totalChapters || 0} chapters ({totalProgressPercent}%)
            </p>
            <div className="mt-2 h-2 rounded-full bg-neutral-800">
              <div
                className="h-2 rounded-full bg-neutral-200 transition-all"
                style={{ width: `${totalProgressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="panel p-6 sm:p-8">
        {isLoading ? (
          <p className="muted">Loading Bible index...</p>
        ) : error ? (
          <div className="info-card">
            <p className="font-semibold text-neutral-200">KJV data not loaded yet.</p>
            <p className="muted mt-2">{error}</p>
            <p className="muted mt-2">
              Run <code>npm run bible:download-kjv</code> and redeploy so <code>/public/kjv</code> is
              available.
            </p>
          </div>
        ) : activeChapter ? (
          <>
            <header className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-2xl font-semibold">
                {bookData?.name} {activeChapter.number}
              </h2>
              <p className="muted text-sm">
                Chapter {activeChapter.number} of {chapterCount} • {visibleVerses.length} verses shown
              </p>
            </header>

            {visibleVerses.length === 0 ? (
              <p className="muted">No verses match your search.</p>
            ) : (
              <article className="info-card mx-auto max-w-4xl overflow-hidden">
                <p
                  className="max-w-full overflow-hidden text-pretty wrap-break-word text-[1rem] leading-[1.75]"
                >
                  {visibleVerses.map((verse) => (
                    <span key={verse.number} id={`verse-${verse.number}`} className="scroll-mt-28 block">
                      <sup className="mr-1 text-[0.72em] font-semibold text-neutral-400">
                        {verse.number}
                      </sup>
                      {cleanVerseText(verse.text)}
                    </span>
                  ))}
                </p>
                <div ref={chapterEndRef} aria-hidden="true" className="h-1 w-full" />
              </article>
            )}
          </>
        ) : (
          <p className="muted">Select a book and chapter to begin reading.</p>
        )}
      </section>
    </div>
  );
}
