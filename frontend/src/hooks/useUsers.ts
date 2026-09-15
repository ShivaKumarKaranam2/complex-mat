import { useCallback, useState } from "react";

import * as usersApi from "../services/usersApi";
import type { UserSummary } from "../services/usersApi";

export function useUserSearch() {
  const [results, setResults] = useState<UserSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (q: string) => {
    setIsSearching(true);
    try {
      const users = await usersApi.searchUsers(q);
      setResults(users);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { results, isSearching, search };
}
