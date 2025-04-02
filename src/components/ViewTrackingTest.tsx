import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { api } from "../services/apiService";

/**
 * Test component to manually trigger view tracking
 * This is for testing purposes only and should be removed after verification
 */
export function ViewTrackingTest() {
  const [postId, setPostId] = useState("");
  const [token, setToken] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackView = async () => {
    if (!postId || !token) {
      setError("Please provide both postId and token");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`Testing trackPostView for post: ${postId}`);
      const response = await api.trackPostView(token, postId);
      console.log("Track view response:", response);
      setResult(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error tracking view:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg mb-4">
      <h3 className="text-lg font-medium mb-3">View Tracking Test</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Post ID:</label>
          <input
            type="text"
            value={postId}
            onChange={(e) => setPostId((e.target as HTMLInputElement).value)}
            className="w-full p-2 border rounded"
            placeholder="Enter post ID"
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">Token:</label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken((e.target as HTMLInputElement).value)}
            className="w-full p-2 border rounded"
            placeholder="Enter authentication token"
          />
        </div>
        
        <button
          onClick={trackView}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test View Tracking"}
        </button>
        
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            Error: {error}
          </div>
        )}
        
        {result && (
          <div className="mt-3">
            <h4 className="font-medium mb-1">Response:</h4>
            <pre className="p-3 bg-gray-100 rounded overflow-auto text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
