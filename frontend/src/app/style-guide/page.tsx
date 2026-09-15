"use client";

import { useState } from "react";
import { Lora, Space_Grotesk } from "next/font/google";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = Lora({
  subsets: ["latin"],
  variable: "--font-body",
});

export default function StyleGuidePage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  return (
    <main
      className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-paper text-ink`}
    >
      <nav className="border-b-4 border-ink bg-butter">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 lg:px-8">
          <a
            href="#top"
            className="font-display text-xl font-black tracking-tight"
          >
            BLOG//LAB
          </a>
          <div className="hidden items-center gap-5 font-display text-sm font-bold sm:flex">
            <a href="#components" className="hover:underline">
              Components
            </a>
            <a href="#reading" className="hover:underline">
              Reading
            </a>
          </div>
          <Button className="min-h-9 px-3 py-1.5 text-xs" type="button">
            Subscribe
          </Button>
        </div>
      </nav>

      <div id="top" className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-20">
        <header className="max-w-4xl">
          <Badge tone="coral">Style guide / 01</Badge>
          <h1 className="mt-5 max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
            Loud UI. Quiet reading.
          </h1>
          <p className="mt-6 max-w-2xl font-body text-lg leading-8 sm:text-xl">
            Neubrutalism Hybrid memberi interface energi visual yang berani,
            sementara area artikel tetap memberi ruang untuk membaca dengan
            nyaman.
          </p>
        </header>

        <section className="mt-16 grid gap-8 border-y-4 border-ink py-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-xs font-bold uppercase">Accent</p>
            <div className="mt-3 h-16 border-3 border-ink bg-butter shadow-brutal" />
            <p className="mt-3 font-display font-bold">Butter / #FFD43B</p>
          </div>
          <div>
            <p className="font-display text-xs font-bold uppercase">
              Secondary
            </p>
            <div className="mt-3 h-16 border-3 border-ink bg-mint shadow-brutal" />
            <p className="mt-3 font-display font-bold">Mint / #B8F2D0</p>
          </div>
          <div>
            <p className="font-display text-xs font-bold uppercase">
              Secondary
            </p>
            <div className="mt-3 h-16 border-3 border-ink bg-coral shadow-brutal" />
            <p className="mt-3 font-display font-bold">Coral / #FF7A70</p>
          </div>
          <div>
            <p className="font-display text-xs font-bold uppercase">Base</p>
            <div className="mt-3 h-16 border-3 border-ink bg-ink shadow-brutal" />
            <p className="mt-3 font-display font-bold">Ink / #111111</p>
          </div>
        </section>

        <section id="components" className="scroll-mt-8 pt-20">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b-4 border-ink pb-5">
            <div>
              <Badge tone="sky">UI kit</Badge>
              <h2 className="mt-3 font-display text-4xl font-black">
                Components
              </h2>
            </div>
            <p className="max-w-sm font-body text-sm leading-6">
              Semua kontrol memakai garis tegas, warna kontras, dan shadow
              solid.
            </p>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-8">
              <div>
                <p className="mb-4 font-display text-sm font-bold uppercase">
                  Buttons
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button type="button">Primary action</Button>
                  <Button type="button" variant="secondary">
                    Secondary
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-4 font-display text-sm font-bold uppercase">
                  Badges
                </p>
                <div className="flex flex-wrap gap-3">
                  <Badge tone="butter">Technology</Badge>
                  <Badge tone="mint">Next.js</Badge>
                  <Badge tone="coral">Featured</Badge>
                  <Badge tone="sky">New</Badge>
                </div>
              </div>

              <Card className="bg-coral">
                <Badge tone="butter">Article card</Badge>
                <h3 className="mt-5 font-display text-2xl font-black">
                  Cara membuat ide jadi artikel yang selesai
                </h3>
                <p className="mt-3 font-body leading-7">
                  Card memakai border dan offset shadow untuk memberi bobot
                  visual.
                </p>
                <Button type="button" variant="secondary" className="mt-6">
                  Baca artikel
                </Button>
              </Card>
            </div>

            <Card as="section" className="bg-mint">
              <div className="border-b-2 border-ink pb-4">
                <Badge tone="butter">Form controls</Badge>
                <h3 className="mt-3 font-display text-2xl font-black">
                  Write to the blog
                </h3>
              </div>
              <form
                className="mt-6 space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  setMessage(
                    email ? `Preview sent to ${email}` : "Add an email first",
                  );
                }}
              >
                <label
                  className="block font-display text-sm font-bold"
                  htmlFor="preview-email"
                >
                  Email
                </label>
                <Input
                  id="preview-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
                <label
                  className="block font-display text-sm font-bold"
                  htmlFor="preview-message"
                >
                  Note
                </label>
                <Textarea
                  id="preview-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tell us what you are writing..."
                />
                <div className="flex flex-wrap items-center gap-4">
                  <Button type="submit">Send note</Button>
                  {message ? (
                    <span className="font-display text-sm font-bold">
                      {message}
                    </span>
                  ) : null}
                </div>
              </form>
            </Card>
          </div>
        </section>

        <section id="reading" className="scroll-mt-8 pt-24">
          <div className="border-b-4 border-ink pb-5">
            <Badge tone="mint">Reading mode</Badge>
            <h2 className="mt-3 font-display text-4xl font-black">
              A softer article body
            </h2>
          </div>
          <article className="mx-auto max-w-3xl py-12 font-body text-lg leading-9">
            <p className="mb-6 text-sm font-bold uppercase tracking-wide text-ink/60">
              Design notes / 4 min read
            </p>
            <h3 className="mb-6 font-display text-3xl font-black leading-tight">
              Let the interface shout so the story does not have to
            </h3>
            <p className="mb-6">
              Area baca sengaja dilepaskan dari border tebal dan shadow offset.
              Kontras tetap datang dari tipografi, ukuran ruang, dan ritme
              paragraf yang lapang.
            </p>
            <p>
              Dengan begitu, komponen interaktif terasa playful dan tactile,
              tetapi teks panjang tetap netral, tenang, dan mudah dipindai di
              layar kecil maupun besar.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
