import { useState } from "react";
import { ReactReader } from "react-reader";

interface EpubViewerProps {
  url: string;
  title?: string;
}

export function EpubViewer({ url, title }: EpubViewerProps) {
  const [location, setLocation] = useState<string | number>(0);

  return (
    <div className="h-[calc(100vh-14rem)] border rounded-md overflow-hidden">
      <ReactReader
        url={url}
        title={title}
        location={location}
        locationChanged={(loc: string) => setLocation(loc)}
      />
    </div>
  );
}
