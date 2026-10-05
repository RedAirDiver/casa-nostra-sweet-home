import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mediaUrl } from "@/lib/media";

type GalleryPhoto = { id: string; image_url: string; caption: string | null };

export function GalleryCarousel({ photos, onOpen, paused }: {
  photos: GalleryPhoto[];
  onOpen: (src: string) => void;
  paused: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current;
    const slides = track?.querySelectorAll<HTMLElement>(".gallery-slide");
    if (!track || !slides?.length) return;
    const next = (index + slides.length) % slides.length;
    const target = slides[next];
    const first = slides[0];
    if (!target || !first) return;
    track.scrollTo({ left: target.offsetLeft - first.offsetLeft, behavior: reducedMotion ? "instant" : "smooth" });
    setSelected(next);
  }, [reducedMotion]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0.15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(motion.matches);
    update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, []);

  const manualUntilRef = useRef(0);
  const markManual = useCallback(() => { manualUntilRef.current = Date.now() + 9000; }, []);

  useEffect(() => {
    if (photos.length < 2 || !visible || reducedMotion || paused) return;
    const timer = window.setInterval(() => {
      if (document.hidden || Date.now() < manualUntilRef.current) return;
      scrollTo(selected + 1);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [photos.length, visible, reducedMotion, paused, scrollTo, selected]);

  const syncPosition = () => {
    const track = trackRef.current;
    const slides = track?.querySelectorAll<HTMLElement>(".gallery-slide");
    if (!track || !slides?.length) return;
    const first = slides[0];
    if (!first) return;
    let closest = 0;
    let distance = Infinity;
    slides.forEach((slide, index) => {
      const current = Math.abs(slide.offsetLeft - first.offsetLeft - track.scrollLeft);
      if (current < distance) { closest = index; distance = current; }
    });
    setSelected(closest);
  };

  return (
    <div ref={sectionRef} className="gallery-carousel">
      <div className="gallery-controls">
        <span aria-live="polite">{String(selected + 1).padStart(2, "0")} <span aria-hidden="true">/</span> {String(photos.length).padStart(2, "0")}</span>
        <div>
          <Button type="button" variant="ghost" size="icon" className="gallery-arrow" aria-label="Föregående bild" title="Föregående bild" disabled={photos.length < 2} onClick={() => { markManual(); scrollTo(selected - 1); }}><ArrowLeft aria-hidden="true" /></Button>
          <Button type="button" variant="ghost" size="icon" className="gallery-arrow" aria-label="Nästa bild" title="Nästa bild" disabled={photos.length < 2} onClick={() => { markManual(); scrollTo(selected + 1); }}><ArrowRight aria-hidden="true" /></Button>
        </div>
      </div>
      <div ref={trackRef} className="gallery-track" role="region" aria-label="Bilder från Casa Nostra" tabIndex={0} onScroll={syncPosition} onTouchStart={markManual} onWheel={markManual} onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); markManual(); scrollTo(selected + (event.key === "ArrowRight" ? 1 : -1)); } }}>
        {photos.map((photo, index) => {
          const src = mediaUrl(photo.image_url);
          return <div className="gallery-slide" key={photo.id} role="group" aria-label={`${index + 1} av ${photos.length}`}>
            <Button type="button" variant="ghost" className="gallery-photo" aria-label={`Förstora bild: ${photo.caption || `bild ${index + 1}`}`} onClick={() => { if (src) onOpen(src); }}>
              <img src={src ?? ""} alt={photo.caption || `Casa Nostra, bild ${index + 1}`} loading="lazy" />
            </Button>
            {photo.caption && <p className="gallery-caption">{photo.caption}</p>}
          </div>;
        })}
      </div>
    </div>
  );
}
