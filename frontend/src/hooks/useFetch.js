import { useState, useEffect, useCallback } from "react";

export default function useFetch(apiFunction, params = null, auto = true) {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(auto);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (customParams = params) => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiFunction(customParams);
      setData(result);

      return result;
    } catch (err) {
      setData(undefined);
      setError(err.response?.data?.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  }, [apiFunction, params]);

  useEffect(() => {
    if (auto) {
      fetchData();
    }
  }, [fetchData, auto]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}
