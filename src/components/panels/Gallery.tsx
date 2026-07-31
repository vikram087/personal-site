export type GalleryImage = { src: string; alt: string }

/**
 * Photo grid for MDX content. Tiles are square and cropped via object-fit,
 * so source photos don't need a uniform aspect ratio.
 */
export function Gallery({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) return null
  return (
    <div className="gallery">
      {images.map((image) => (
        <img key={image.src} src={image.src} alt={image.alt} loading="lazy" />
      ))}
    </div>
  )
}
