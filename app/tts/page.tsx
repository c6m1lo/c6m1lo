"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type VoiceOption = {
  id: string;
  label: string;
  lang: string;
};

function getSpeechSynthesis() {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

function listVoices() {
  const synth = getSpeechSynthesis();
  if (!synth) return [];

  return synth.getVoices();
}

function normalizeVoiceId(voice: SpeechSynthesisVoice) {
  return `${voice.name}::${voice.lang}`;
}

function safeNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function TtsPage() {
  const synth = useMemo(() => getSpeechSynthesis(), []);
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [status, setStatus] = useState<"idle" | "speaking" | "paused" | "ended">("idle");
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!synth) return;

    const load = () => {
      const next = listVoices();
      setVoices(next);
    };

    load();
    synth.addEventListener("voiceschanged", load);

    return () => {
      synth.removeEventListener("voiceschanged", load);
    };
  }, [synth]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedText = window.localStorage.getItem("tts:text") ?? "";
    const savedVoice = window.localStorage.getItem("tts:voiceId") ?? "";
    const savedRate = safeNumber(window.localStorage.getItem("tts:rate") ?? "", 1);
    const savedPitch = safeNumber(window.localStorage.getItem("tts:pitch") ?? "", 1);
    const savedVolume = safeNumber(window.localStorage.getItem("tts:volume") ?? "", 1);

    setText(savedText);
    setSelectedVoiceId(savedVoice);
    setRate(Math.max(0.5, Math.min(2, savedRate)));
    setPitch(Math.max(0, Math.min(2, savedPitch)));
    setVolume(Math.max(0, Math.min(1, savedVolume)));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("tts:text", text);
  }, [text]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("tts:voiceId", selectedVoiceId);
  }, [selectedVoiceId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("tts:rate", String(rate));
  }, [rate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("tts:pitch", String(pitch));
  }, [pitch]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("tts:volume", String(volume));
  }, [volume]);

  const voiceOptions = useMemo<VoiceOption[]>(() => {
    return voices
      .map((voice) => ({
        id: normalizeVoiceId(voice),
        label: `${voice.name}${voice.default ? " (default)" : ""}`,
        lang: voice.lang,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [voices]);

  const selectedVoice = useMemo(() => {
    if (!selectedVoiceId) return null;
    return voices.find((voice) => normalizeVoiceId(voice) === selectedVoiceId) ?? null;
  }, [selectedVoiceId, voices]);

  useEffect(() => {
    if (selectedVoiceId) return;
    const defaultVoice = voices.find((voice) => voice.default) ?? voices[0] ?? null;
    if (!defaultVoice) return;
    setSelectedVoiceId(normalizeVoiceId(defaultVoice));
  }, [selectedVoiceId, voices]);

  const stop = () => {
    if (!synth) return;
    synth.cancel();
    utteranceRef.current = null;
    setStatus("idle");
  };

  const speak = () => {
    if (!synth) {
      setError("Text-to-speech is not supported in this browser.");
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    setError(null);
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => setStatus("ended");
    utterance.onerror = () => {
      setStatus("idle");
      setError("Speech synthesis failed to play this text.");
    };
    utterance.onpause = () => setStatus("paused");
    utterance.onresume = () => setStatus("speaking");

    utteranceRef.current = utterance;
    synth.speak(utterance);
  };

  const pause = () => {
    if (!synth) return;
    if (!synth.speaking) return;
    synth.pause();
  };

  const resume = () => {
    if (!synth) return;
    if (!synth.paused) return;
    synth.resume();
  };

  useEffect(() => {
    return () => {
      if (!synth) return;
      synth.cancel();
    };
  }, [synth]);

  return (
    <div className="page-wrap">
      <section className="panel p-8 sm:p-10">
        <span className="kicker">App</span>
        <h1 className="mt-5 text-4xl font-semibold sm:text-5xl">Text to Speech</h1>
        <p className="muted mt-4 max-w-3xl">
          Paste text, choose a voice, and play it back. Uses your browser’s built-in speech engine (no
          server).
        </p>

        <div className="mt-8 grid gap-4">
          <article className="info-card">
            <label className="text-sm font-semibold">
              Text
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Paste something to read…"
                className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                rows={6}
              />
            </label>
          </article>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="info-card">
              <label className="text-sm font-semibold">
                Voice
                <select
                  value={selectedVoiceId}
                  onChange={(event) => setSelectedVoiceId(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                >
                  {voiceOptions.length ? (
                    voiceOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label} — {option.lang}
                      </option>
                    ))
                  ) : (
                    <option value="">Loading voices…</option>
                  )}
                </select>
              </label>
              <p className="muted mt-2 text-xs">
                Tip: Some browsers only populate voices after the first interaction.
              </p>
            </article>

            <article className="info-card">
              <p className="text-sm font-semibold">Playback</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={speak}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
                >
                  Speak
                </button>
                <button
                  type="button"
                  onClick={pause}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold"
                >
                  Pause
                </button>
                <button
                  type="button"
                  onClick={resume}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold"
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={stop}
                  className="rounded-lg border border-red-900/70 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-950/50"
                >
                  Stop
                </button>
              </div>
              <p className="muted mt-3 text-xs">
                Status: <span className="text-white">{status}</span>
              </p>
            </article>
          </div>

          <article className="info-card">
            <p className="text-sm font-semibold">Controls</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-xs">
                Rate ({rate.toFixed(2)}x)
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={rate}
                  onChange={(event) => setRate(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
              <label className="text-xs">
                Pitch ({pitch.toFixed(2)})
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={pitch}
                  onChange={(event) => setPitch(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
              <label className="text-xs">
                Volume ({volume.toFixed(2)})
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
            </div>
          </article>

          {error ? (
            <p className="rounded-lg border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

