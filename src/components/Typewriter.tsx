import React, { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
  text: string;
  animate?: boolean;
  speed?: number; // ms per interval
  onComplete?: () => void;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  animate = false,
  speed = 10,
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState(animate ? '' : text);
  const textRef = useRef(text);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!animate) {
      setDisplayedText(text);
      return;
    }

    setDisplayedText('');
    let currentIndex = 0;
    let isMounted = true;
    let timer: NodeJS.Timeout;

    const type = () => {
      if (!isMounted) return;
      const fullText = textRef.current;
      if (currentIndex < fullText.length) {
        // Dynamic speed up for longer text strings
        const remaining = fullText.length - currentIndex;
        const step = remaining > 1000 ? 10 : remaining > 500 ? 6 : remaining > 200 ? 3 : 1;
        currentIndex = Math.min(currentIndex + step, fullText.length);
        
        setDisplayedText(fullText.slice(0, currentIndex));
        timer = setTimeout(type, speed);
      } else {
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    };

    timer = setTimeout(type, speed);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [text, animate, speed]);

  return <>{displayedText}</>;
};
