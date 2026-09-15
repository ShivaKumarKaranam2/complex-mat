import type { ReactNode } from "react";

import { NavSidebar } from "./NavSidebar";
import { TopBar } from "./TopBar";

export function ResponsiveShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="app-shell">
      <NavSidebar />
      <div className="main-col">
        <TopBar title={title} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
