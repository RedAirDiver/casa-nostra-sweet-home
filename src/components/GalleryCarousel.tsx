import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { mediaUrl } from "@/lib/media";

type GalleryPhoto = { id: string; image_url: string; caption: string | null };

export function GalleryCarousel({ photos, onOpen, paused }: {
  photos: GalleryPhoto[];
  onOpen: (src: string) => void;
  paused: boolean;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [visible, setVisible] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!api) return;
    const update = () => setSelected(api.selectedScrollSnap());
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => { api.off("select", update); api.off("reInit", update); };
  }, [api]);

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

  useEffect(() => {
    if (!api || photos.length < 2 || !visible || interacting || reducedMotion || paused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) api.scrollNext();
    }, 4500);
    return () => window.clearInterval(timer);
  }, [api, photos.length, visible, interacting, reducedMotion, paused]);

  return (
    <div ref={sectionRef} className="gallery-carousel" onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
      <div className="gallery-controls">
        <span aria-live="polite">{String(selected + 1).padStart(2, "0")} <span aria-hidden="true">/</span> {String(photos.length).padStart(2, "0")}</span>
        <div>
          <Button type="button" variant="ghost" size="icon" className="gallery-arrow" aria-label="Föregående bild" title="Föregående bild" disabled={photos.length < 2} onClick={() => api?.scrollPrev()}><ArrowLeft aria-hidden="true" /></Button>
          <Button type="button" variant="ghost" size="icon" className="gallery-arrow" aria-label="Nästa bild" title="Nästa bild" disabled={photos.length < 2} onClick={() => api?.scrollNext()}><ArrowRight aria-hidden="true" /></Button>
        </div>
      </div>
      <Carousel setApi={setApi} opts={{ loop: photos.length > 1, align: "start" }} aria-label="Bilder från Casa Nostra">
        <CarouselContent className="gallery-track">
          {photos.map((photo, index) => {
            const src = mediaUrl(photo.image_url);
            return <CarouselItem className="gallery-slide" key={photo.id} aria-label={`${index + 1} av ${photos.length}`}>
              <Button type="button" variant="ghost" className="gallery-photo" aria-label={`Förstora bild: ${photo.caption || `bild ${index + 1}`}`} onClick={() => { if (src) onOpen(src); }}>
                <img src={src ?? ""} alt={photo.caption || `Casa Nostra, bild ${index + 1}`} loading="lazy" />
              </Button>
              {photo.caption && <p className="gallery-caption">{photo.caption}</p>}
            </CarouselItem>;
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}