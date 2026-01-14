export function BackgroundDecor() {
  // Scattered positions - carefully placed to avoid clustering
  // and ensure same images aren't adjacent
  const images = [
    // 15 images total - each appears 3 times, well spaced
    // Row 1 - top
    { src: "/images/martini.png", top: "5%", left: "3%", size: 130, rotate: -12, opacity: 0.18 },
    { src: "/images/trees.png", top: "4%", left: "50%", size: 140, rotate: 8, opacity: 0.45 },
    { src: "/images/wineglasses.png", top: "5%", left: "88%", size: 130, rotate: 10, opacity: 0.55 },
    // Row 2
    { src: "/images/ring.png", top: "20%", left: "15%", size: 120, rotate: -5, opacity: 0.25 },
    { src: "/images/bonfire.png", top: "22%", left: "75%", size: 130, rotate: 12, opacity: 0.18 },
    // Row 3
    { src: "/images/wineglasses.png", top: "38%", left: "2%", size: 130, rotate: 10, opacity: 0.55 },
    { src: "/images/bonfire.png", top: "40%", left: "45%", size: 130, rotate: 15, opacity: 0.18 },
    { src: "/images/ring.png", top: "38%", left: "85%", size: 120, rotate: -8, opacity: 0.25 },
    // Row 4
    { src: "/images/trees.png", top: "55%", left: "20%", size: 140, rotate: -3, opacity: 0.45 },
    { src: "/images/martini.png", top: "58%", left: "65%", size: 130, rotate: 8, opacity: 0.18 },
    // Row 5
    { src: "/images/bonfire.png", top: "72%", left: "3%", size: 130, rotate: -10, opacity: 0.18 },
    { src: "/images/wineglasses.png", top: "75%", left: "42%", size: 130, rotate: 5, opacity: 0.55 },
    { src: "/images/trees.png", top: "73%", left: "82%", size: 140, rotate: 12, opacity: 0.45 },
    // Row 6 - bottom
    { src: "/images/martini.png", top: "90%", left: "25%", size: 130, rotate: 8, opacity: 0.18 },
    { src: "/images/ring.png", top: "88%", left: "68%", size: 120, rotate: -5, opacity: 0.25 },
  ];

  return (
    <>
      {images.map((img, i) => (
        <img
          key={i}
          src={img.src}
          alt=""
          aria-hidden="true"
          style={{
            position: "fixed",
            top: img.top,
            left: img.left,
            width: img.size,
            height: "auto",
            opacity: img.opacity,
            transform: `rotate(${img.rotate}deg)`,
            filter: "grayscale(100%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ))}
    </>
  );
}
