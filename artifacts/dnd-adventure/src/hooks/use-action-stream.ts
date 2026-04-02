import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetNarrativeQueryKey } from "@workspace/api-client-react";

export function useActionStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const queryClient = useQueryClient();

  const performActionStream = useCallback(async (username: string, action: string) => {
    if (isStreaming) return;
    setIsStreaming(true);
    setStreamedText("");

    try {
      const response = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, action }),
      });

      if (!response.ok) {
        throw new Error("Failed to perform action");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        
        // Keep the last segment in buffer if it's incomplete
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.done) {
                break;
              }
              if (data.content) {
                setStreamedText((prev) => prev + data.content);
              }
            } catch (e) {
              console.error("[SSE] Failed to parse chunk:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("[ActionStream] Error:", error);
    } finally {
      setIsStreaming(false);
      // Invalidate the narrative query so we fetch the finalized saved message from the DB
      queryClient.invalidateQueries({ queryKey: getGetNarrativeQueryKey() });
    }
  }, [isStreaming, queryClient]);

  return { performActionStream, isStreaming, streamedText };
}
