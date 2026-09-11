// Renders a menu image only when a valid URL exists.
// Never renders a broken <img> for "", null, or undefined,
// and hides the element if the URL fails to load.
function MenuImage({ src, alt, className }) {
  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

export default MenuImage;
