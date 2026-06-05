"use client";

import { useEffect, useRef } from "react";

export function CameraScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | undefined;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } }).then((mediaStream) => {
      stream = mediaStream;
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    });
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, []);

  return <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-md bg-black object-cover" />;
}
