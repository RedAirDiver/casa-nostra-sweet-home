import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

const ASSET_BASE = "https://casa-nostra-sweet-home.lovable.app/__l5e/assets-v1";
const logoUrl = `${ASSET_BASE}/5fabc25b-c579-4c19-8939-9fd2e28c12bf/a86ce1af-2fa4-4341-9c11-5e2bd0854372.jpg`;
const heroVideoUrl = `${ASSET_BASE}/95f27c06-f16d-4e13-b9a4-6ed7cfd853f8/a0807e17-5a76-499e-bdb3-e5fc36987993.mp4`;
const restaurantUrl = `${ASSET_BASE}/eba95576-acac-436f-a852-0477f57636c4/31d9ffae-2ecb-4627-bf6d-1ff4f5e38fef.jpg`;
const galleryOneUrl = `${ASSET_BASE}/fab5099b-4e0d-4c4f-80f5-e72b5c552808/b1493e75-324d-4bc9-8e74-8eac5ea5340d.jpg`;
const galleryTwoUrl = `${ASSET_BASE}/52717201-d3b8-4b82-9b85-f12b07aecac8/41ce71bd-c1ba-45f5-80a8-45b827814cb8.jpg`;

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Casa Nostra Kjula – Italiensk restaurang" },
    { name: "description", content: "Italienskt kök i Kjula med pizza, pasta, lunch och à la carte." },
    { property: "og:title", content: "Casa Nostra Kjula – Ristorante" },
    { property: "og:description", content: "Pizza, pasta, lunch och à la carte i Kjula." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: Index,
});

const nav = [["Hem", "#top"], ["Meny", "#meny"], ["Lunch", "#lunch"], ["Om oss", "#om"], ["Galleri", "#galleri"], ["Hitta hit", "#hitta"]];
const menu = [
  ["Pizzor", "32 rätter"], ["Pasta", "13 rätter"], ["Sallader", "11 rätter"],
  ["Kebab & grill", "14 rätter"], ["À la carte", "7 rätter"], ["Dryck", "Öl, vin & alkoholfritt"],
];

function ArrowLink({ href, children, external = false }: { href: string; children: React.ReactNode; external?: boolean }) {
  return <a className="arrow-link" href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}><span>{children}</span><i /><b>→</b></a>;
}

function Index() {
  const [open, setOpen] = useState(false);
  return <main>
    <header className="site-nav">
      <a href="#top" className="brand"><img src={logoUrl} alt="Casa Nostra Kjula" /><span>Casa <em>Nostra</em></span></a>
      <nav className="desktop-nav">{nav.map(([label, href], i) => <a className={i === 0 ? "active" : ""} href={href} key={label}>{label}</a>)}</nav>
      <a className="phone-pill" href="tel:016-2004909">016-200 49 09</a>
      <button className="menu-button" aria-label="Öppna meny" onClick={() => setOpen(true)}><span /></button>
    </header>
    {open && <div className="mobile-menu"><button aria-label="Stäng meny" onClick={() => setOpen(false)}>×</button><nav>{nav.map(([label, href]) => <a href={href} onClick={() => setOpen(false)} key={label}>{label}</a>)}</nav><a href="tel:016-2004909">Beställ · 016-200 49 09</a></div>}

    <section id="top" className="hero">
      <video src={heroVideoUrl} autoPlay muted loop playsInline />
      <div className="hero-shade" />
      <div className="hero-content"><p className="eyebrow">Ristorante · Kjula</p><h1>Casa Nostra</h1><p className="intro">Mötesplatsen för dig och det italienska köket. Med stor erfarenhet och passion för goda råvaror välkomnas du alltid med omsorg – och lämnar med ett leende. Fullständiga rättigheter.</p><div className="hero-links"><ArrowLink href="#meny">Utforska menyn</ArrowLink><ArrowLink href="tel:016-2004909">Ring & beställ</ArrowLink><ArrowLink external href="https://irp.cdn-website.com/6e599bd4/files/uploaded/Meny_Casa+Nostra+Kjula+A4_2025-2.pdf">Ladda ner menyn (PDF)</ArrowLink></div></div>
    </section>

    <section id="lunch" className="offers"><article><p className="gold-label">Dagens lunch</p><div className="price"><strong>149:-</strong><span>Måndag–fredag kl. 11–14.30</span></div><p>Sallad nr 1, 2, 3, 6, 7, 8<br/>Pasta nr 1, 2, 5, 6, 8, 9, 10, 11, 12<br/>Pizzor nr 4–22 & 29</p></article><article><p className="gold-label">Kvällsdeal</p><div className="price"><strong>209:-</strong><span>Alla dagar 15–19 · äta här</span></div><p>Välj mellan utvalda pizzor, pasta eller fläskfilé Oscar – inkl. öl eller vin. Alkoholfritt alternativ finns.</p><small>Pasta nr 1, 2, 5, 6, 8–12 · Pizzor nr 4–22 & 29</small></article></section>

    <section id="meny" className="section menu-section"><div className="section-heading"><div><p className="eyebrow">Vår meny</p><h2>Våra rätter</h2></div><a className="gold-link" href="#meny">Hela menyn →</a></div><div className="menu-grid">{menu.map(([name, count], i) => <a href="tel:016-2004909" className="menu-card" key={name}><div className={`food food-${i}`}><img src={i % 2 ? galleryTwoUrl : galleryOneUrl} alt="Italiensk mat från Casa Nostra" /></div><div><strong>{name}</strong><span>{count}</span></div></a>)}</div></section>

    <section id="om" className="about"><div className="about-photo"><img src={restaurantUrl} alt="Restaurangen Casa Nostra i Kjula" /></div><div className="about-copy"><p className="eyebrow">Om oss</p><h2>Det finns inget mer romantiskt än italiensk mat</h2><p>Vår filosofi är enkel: god mat lagad på råvaror av hög kvalitet. Vi har plats för stora sällskap inomhus, och varje vardag serverar vi lunch som är lika bra att äta här som att ta med på språng.</p><p>Oavsett vad du är sugen på att dricka till din måltid har vi något som passar – en kall Ramlösa, ett glas vin eller en öl. Vi har fullständiga rättigheter.</p><ArrowLink href="tel:016-2004909">Ring oss</ArrowLink></div></section>

    <section id="galleri" className="section gallery"><div className="section-heading right"><div><p className="eyebrow">Atmosfär</p><h2>Galleri</h2></div></div><div className="gallery-grid"><img className="gallery-main" src={galleryOneUrl} alt="Miljö hos Casa Nostra"/><img src={galleryTwoUrl} alt="Italiensk mat"/><img src={restaurantUrl} alt="Casa Nostra restaurang"/><img src={galleryTwoUrl} alt="Mat från köket"/><img src={galleryOneUrl} alt="Restaurangmiljö"/></div></section>

    <section id="hitta" className="visit"><div><p className="eyebrow">Besök oss</p><h2>Hitta hit</h2><Info title="Adress"><a target="_blank" rel="noreferrer" href="https://maps.google.com/?q=Williams+v%C3%A4g+2,+635+06+Eskilstuna">Williams väg 2, 635 06 Eskilstuna</a></Info><Info title="Öppettider"><div className="hours"><small>Sommartid</small><span>Måndag–fredag</span><span>11:00–21:00</span><span>Lördag–söndag</span><span>12:00–21:00</span><small>Vintertid</small><span>Måndag–torsdag</span><span>11:00–20:00</span><span>Fredag</span><span>11:00–21:00</span><span>Lördag</span><span>12:00–21:00</span><span>Söndag</span><span>12:00–20:00</span></div></Info><Info title="Telefon"><a href="tel:016-2004909">016-200 49 09</a><a className="mail" href="mailto:info@casanostrakjula.se">info@casanostrakjula.se</a></Info></div><div className="map"><iframe title="Karta" src="https://www.openstreetmap.org/export/embed.html?bbox=16.6650%2C59.3560%2C16.7150%2C59.3760&layer=mapnik&marker=59.3660%2C16.6900" /></div></section>

    <footer><div className="footer-grid"><div><h3>Casa <em>Nostra</em> Kjula</h3><p>Italienskt kök i Kjula – pizza, pasta, sallader och à la carte. Fullständiga rättigheter.</p><div className="social"><a href="https://instagram.com/casanostrakjula">Instagram</a><a href="https://facebook.com/casanostrakjula">Facebook</a></div></div><div><h3>Kjula</h3><p>Williams väg 2, 635 06 Eskilstuna</p><a href="tel:016-2004909">016-200 49 09</a><a href="mailto:info@casanostrakjula.se">info@casanostrakjula.se</a></div><div><p className="gold-label">Sidor</p>{nav.filter((_,i) => [0,1,3,5].includes(i)).map(([l,h]) => <a href={h} key={l}>{l}</a>)}</div></div><div className="copyright">© 2026 Casa Nostra Kjula</div></footer>
  </main>;
}

function Info({ title, children }: { title: string; children: React.ReactNode }) { return <div className="info"><p className="gold-label">{title}</p>{children}</div> }