import { useAuth } from "../../context/AuthContext";

function initials(name: string): string {
  return name.slice(0, 1).toUpperCase();
}

export function TopBar({ title }: { title: string }) {
  const { user, logout } = useAuth();

  return (
    <div className="topbar">
      <h2>{title}</h2>
      <div className="topbar-right">
        {user && (
          <div className="user-badge">
            <span className="avatar">{initials(user.employeeName)}</span>
            <div className="who">
              <div className="uname">{user.employeeName}</div>
              <div className="urole">
                {user.role === "ADMIN" ? "Admin" : "Team Member"}
              </div>
            </div>
          </div>
        )}
        <button type="button" className="btn btn-secondary" onClick={logout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
