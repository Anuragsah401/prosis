"use client";

import { useState, useEffect, useCallback } from "react";

export type MicrophonePermission = "prompt" | "granted" | "denied" | "unavailable";

export function useMicrophone() {
  const [permission, setPermission] = useState<MicrophonePermission>("prompt");
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      setIsSupported(false);
      setPermission("unavailable");
      return;
    }

    // Check existing permission state if supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((status) => {
          setPermission(status.state as MicrophonePermission);
          status.onchange = () => {
            setPermission(status.state as MicrophonePermission);
          };
        })
        .catch(() => {
          // Fallback if query fails
        });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setPermission("unavailable");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release test tracks immediately
      stream.getTracks().forEach((track) => track.stop());
      setPermission("granted");
      return true;
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermission("denied");
      } else {
        setPermission("unavailable");
      }
      return false;
    }
  }, [isSupported]);

  return {
    permission,
    isSupported,
    requestPermission,
  };
}

