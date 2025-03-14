import { useState, useEffect } from 'react';

const useViewport = (threshold = 1024) => {
  const [isSmallViewport, setIsSmallViewport] = useState(false);

  useEffect(() => {
    // Initialize state on client-side
    setIsSmallViewport(window.innerWidth < threshold);
    
    const handleResize = () => setIsSmallViewport(window.innerWidth < threshold);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [threshold]);

  return isSmallViewport;
};

export default useViewport;
