export function Button({
  icon,
  iconhover,
  children,
  onClick,
}: {
  icon?: string;
  iconhover?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLElement>;
}) {
  return (
    <a
      onClick={onClick}
      className="group px-2 py-1 cursor-pointer rounded-md hover:text-purple-600 hover:bg-slate-50 flex items-center gap-x-2"
    >
      <img src={icon} className="w-4 h-4 group-hover:hidden" />
      <img
        src={iconhover}
        className="w-4 h-4 hidden group-hover:block whitespace-nowrap"
      />
      {children}
    </a>
  );
}
