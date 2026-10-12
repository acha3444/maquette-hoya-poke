import { useRef, useEffect } from 'react';

/**
 * Hook permettant le swipe fluide à la souris (drag-to-scroll)
 * et au doigt (tactile natif) sur tous les conteneurs à défilement horizontal.
 */
export function useDragScroll() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let isMoved = false;

    const onMouseDown = (e) => {
      // Clic gauche uniquement et pas sur un bouton interactif actif
      if (e.button !== 0) return;
      isDown = true;
      isMoved = false;
      el.classList.add('is-dragging');
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const onMouseLeave = () => {
      if (!isDown) return;
      isDown = false;
      el.classList.remove('is-dragging');
    };

    const onMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      el.classList.remove('is-dragging');
    };

    const onMouseMove = (e) => {
      if (!isDown) return;
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.4;
      if (Math.abs(walk) > 6) {
        isMoved = true;
        e.preventDefault();
      }
      el.scrollLeft = scrollLeft - walk;
    };

    // Empêche le déclenchement intempestif du clic lors d'un drag
    const onClickCapture = (e) => {
      if (isMoved) {
        e.stopPropagation();
        e.preventDefault();
        isMoved = false;
      }
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('click', onClickCapture, true);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  const scrollLeftBy = (amount = 260) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -amount, behavior: 'smooth' });
    }
  };

  const scrollRightBy = (amount = 260) => {
    if (ref.current) {
      ref.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return { ref, bind: { ref }, scrollLeftBy, scrollRightBy };
}

export default useDragScroll;
