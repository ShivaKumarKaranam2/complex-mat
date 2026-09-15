import { useEffect, useRef, useState } from "react";

import * as usersApi from "../../services/usersApi";
import type { UserSummary } from "../../services/usersApi";

const DEBOUNCE_MS = 250;

export function AttendeeSearchInput({
  selected,
  onAdd,
  onRemove,
  lockedIds = [],
}: {
  selected: UserSummary[];
  onAdd: (user: UserSummary) => void;
  onRemove: (userId: number) => void;
  lockedIds?: number[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    setIsOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const users = await usersApi.searchUsers(value);
      const selectedIds = new Set(selected.map((user) => user.id));
      setResults(users.filter((user) => !selectedIds.has(user.id)));
    }, DEBOUNCE_MS);
  }

  return (
    <div className="search-box">
      <input
        className="text-input"
        placeholder="Search internal members by Employee Name or Employee ID…"
        value={query}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={() => handleInputChange(query)}
      />
      {isOpen && results.length > 0 && (
        <div className="search-results">
          {results.map((user) => (
            <div
              className="opt"
              key={user.id}
              onClick={() => {
                onAdd(user);
                setQuery("");
                setResults([]);
                setIsOpen(false);
              }}
            >
              <span className="avatar">{user.employeeName.slice(0, 1).toUpperCase()}</span>
              {user.employeeName}
              <span className="muted" style={{ marginLeft: "auto" }}>
                {user.role}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="attendee-chips">
        {selected.map((user) => {
          const locked = lockedIds.includes(user.id);
          return (
            <span className="chip" key={user.id}>
              {user.employeeName}
              {locked ? " (Owner)" : ""}
              {!locked && (
                <span
                  role="button"
                  aria-label={`Remove ${user.employeeName}`}
                  style={{ cursor: "pointer", color: "var(--muted)", marginLeft: "6px" }}
                  onClick={() => onRemove(user.id)}
                >
                  ✕
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
