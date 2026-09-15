import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const COMMON_ITEMS = [
  { to: "/calendar", label: "Calendar", icon: "📅" },
  { to: "/my-tasks", label: "My Tasks", icon: "✅" },
  { to: "/previous-meetings", label: "Previous Meetings", icon: "🗂" },
];

const ADMIN_ITEMS = [
  { to: "/people", label: "People", icon: "👥" },
  { to: "/activity-log", label: "Activity Log", icon: "📜" },
];

export function NavSidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="mark">M</div>
        Meeting Action Tracker
      </div>
      <nav className="nav-sidebar" aria-label="Main navigation">
        <ul>
          {COMMON_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
              >
                <span aria-hidden="true">{item.icon}</span> {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        {isAdmin && (
          <>
            <div className="nav-section-label">Admin</div>
            <ul>
              {ADMIN_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
                  >
                    <span aria-hidden="true">{item.icon}</span> {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>
    </div>
  );
}
