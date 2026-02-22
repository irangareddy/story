import { useState } from "react";
import { ReactReader, ReactReaderStyle } from "react-reader";

interface EpubViewerProps {
  url: string;
  title?: string;
}

const readerStyles = {
  ...ReactReaderStyle,
  arrow: {
    ...ReactReaderStyle.arrow,
    zIndex: 2,
  },
};

export function EpubViewer({ url, title }: EpubViewerProps) {
  const [location, setLocation] = useState<string | number>(0);

  return (
    <div style={{ height: "calc(100vh - 14rem)" }} className="border rounded-md">
      <ReactReader
        url={url}
        title={title}
        location={location}
        locationChanged={(epubcfi: string) => setLocation(epubcfi)}
        readerStyles={readerStyles}
      />
    </div>
  );
}
