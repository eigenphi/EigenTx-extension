export function ChainIcon({
  icon,
  title,
  href,
}: {
  icon: string;
  title?: string;
  href: string;
}) {
  return (
    <a
      className="w-8 h-8 bg-slate-100 flex justify-center items-center cursor-pointer rounded-md"
      title={title}
      target="_blank"
      href={href}
    >
      <img src={icon} className="w-5 h-5" />
    </a>
  );
}
