import { useState, useEffect } from "react";

/**
 * React hook for using the mouse scroll.
 * @return An object with the x position, y position and scroll direction.
 */
function useScroll() {
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [bodyOffset, setBodyOffset] = useState(
    document.body.getBoundingClientRect()
  );
  const [y, setY] = useState(bodyOffset.top);
  const [x, setX] = useState(bodyOffset.left);
  const [direction, setDirection] = useState();

  const listener = (e) => {
    setBodyOffset(document.body.getBoundingClientRect());
    setY(-bodyOffset.top);
    setX(bodyOffset.left);
    setDirection(lastScrollTop > -bodyOffset.top ? "down" : "up");
    setLastScrollTop(-bodyOffset.top);
  };

  useEffect(() => {
    window.addEventListener("scroll", listener);
    return () => {
      window.removeEventListener("scroll", listener);
    };
  });

  return {
    y,
    x,
    direction
  };
}

export default useScroll;