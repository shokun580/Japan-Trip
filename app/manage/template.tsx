// A template, not part of the layout, because it remounts on every tab change, and
// that remount is what replays the entrance. The header, tabs and bottom bar sit in
// the layout and stay still.
export default function ManageTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
