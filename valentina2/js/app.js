/* VALENTINA · Funciones de navegación y presentación. Sin dependencias externas. */
(() => {
  'use strict';
  const doc = document;
  const menuButton = doc.querySelector('.menu-toggle');
  const navigation = doc.getElementById('site-navigation');
  const links = Array.from(doc.querySelectorAll('.main-nav a[href^="#"]'));

  const setMenu = (open) => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    navigation.classList.toggle('is-open', open);
    doc.body.classList.toggle('menu-open', open);
  };

  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
    links.forEach(link => link.addEventListener('click', () => setMenu(false)));
    doc.addEventListener('keydown', event => {
      if (event.key === 'Escape') setMenu(false);
    });
    doc.addEventListener('click', event => {
      if (menuButton.getAttribute('aria-expanded') === 'true' &&
        !navigation.contains(event.target) && !menuButton.contains(event.target)) setMenu(false);
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 980) setMenu(false); }, { passive: true });
  }

  // Al pasar el cursor, la portada gira suavemente y se funde con el vídeo.
  // El vídeo no se reproduce hasta la interacción y se detiene al salir.
  // En pantallas táctiles, un toque activa o desactiva la reproducción.
  const coverPreview = doc.getElementById('cover-preview');
  const previewVideo = doc.getElementById('valentina-preview-video');
  if (coverPreview && previewVideo) {
    const hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let previewPlaying = false;

    function showPreview() {
      if (previewPlaying) return;
      previewPlaying = true;
      coverPreview.classList.add('is-video-active');
      coverPreview.setAttribute('aria-pressed', 'true');
      const playback = previewVideo.play();
      if (playback && typeof playback.catch === 'function') {
        playback.catch(() => {
          // Si el navegador impide reproducirlo, queda visible el fotograma póster.
        });
      }
    }

    function hidePreview() {
      if (!previewPlaying) return;
      previewPlaying = false;
      coverPreview.classList.remove('is-video-active');
      coverPreview.setAttribute('aria-pressed', 'false');
      previewVideo.pause();
      try { previewVideo.currentTime = 0; } catch (error) { /* Puede no estar cargado. */ }
    }

    coverPreview.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && hoverCapable.matches && !reducedMotion.matches) showPreview();
    });
    coverPreview.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse' && hoverCapable.matches && !reducedMotion.matches) hidePreview();
    });
    coverPreview.addEventListener('click', event => {
      // Con ratón, manda el hover; con teclado o pantalla táctil, el clic.
      if (event.detail !== 0 && hoverCapable.matches && !reducedMotion.matches) return;
      if (previewPlaying) hidePreview(); else showPreview();
    });
    coverPreview.addEventListener('blur', () => {
      if (!coverPreview.matches(':hover')) hidePreview();
    });
    doc.addEventListener('visibilitychange', () => {
      if (doc.hidden) hidePreview();
    });
  }

  // La barra solo comunica avance de lectura de la página, sin recoger datos.
  const progress = doc.getElementById('scroll-progress');
  let scrollQueued = false;
  function updateScrollUI() {
    const max = doc.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0}%`;
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateScrollUI);
    }
  }, { passive: true });
  updateScrollUI();

  // Filtrado de artículos: conserva enlaces originales accesibles en el HTML.
  const filters = Array.from(doc.querySelectorAll('.filter[data-filter]'));
  const pressCards = Array.from(doc.querySelectorAll('.press-card[data-category]'));
  const noArticles = doc.getElementById('press-empty');
  filters.forEach(button => button.addEventListener('click', () => {
    const current = button.dataset.filter;
    filters.forEach(b => {
      const active = b === button;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    let count = 0;
    pressCards.forEach(card => {
      const visible = current === 'todos' || card.dataset.category === current;
      card.hidden = !visible;
      if (visible) count++;
    });
    if (noArticles) noArticles.hidden = count !== 0;
  }));

  // Animaciones progresivas. La página se ve completa si JavaScript falla.
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    doc.documentElement.classList.add('js-ready');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -25px 0px' });
    doc.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }

  // Indica la sección activa, sin modificar el historial ni las rutas.
  if ('IntersectionObserver' in window && links.length) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => link.classList.toggle('is-current', link.hash === `#${entry.target.id}`));
      });
    }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });
    links.forEach(link => {
      const section = doc.querySelector(link.hash);
      if (section) navObserver.observe(section);
    });
  }

  // Lectura interactiva: una cubierta que se abre y revela las páginas interiores.
  // Conservamos el PDF de prensa accesible también desde la sección Medios.
  const readerTrigger = doc.getElementById('discover-book-trigger');
  const readerPages = doc.getElementById('discover-reading');
  const readerClose = doc.getElementById('discover-close');
  const readerLabel = doc.getElementById('discover-open-label');
  const readerHint = doc.getElementById('discover-interaction-hint');
  if (readerTrigger && readerPages && readerClose) {
    function setReader(open, returnFocus = false) {
      readerPages.hidden = !open;
      readerTrigger.classList.toggle('is-reading', open);
      readerTrigger.setAttribute('aria-expanded', String(open));
      readerTrigger.setAttribute('aria-label', open ? 'Cerrar el libro Valentina' : 'Abrir el libro Valentina para leer las primeras páginas');
      if (readerLabel) readerLabel.textContent = open ? 'Cerrar el libro' : 'Abrir el libro';
      if (readerHint) readerHint.textContent = open ? 'Las primeras páginas están abiertas justo debajo.' : 'Pulsa sobre la cubierta para abrir el libro.';
      if (returnFocus) readerTrigger.focus({ preventScroll: true });
    }
    readerTrigger.addEventListener('click', () => setReader(readerPages.hidden));
    readerClose.addEventListener('click', () => setReader(false, true));
    readerPages.addEventListener('keydown', e => {
      if (e.key === 'Escape') setReader(false, true);
    });
  }

  // Compartir o copiar URL desde el propio navegador.
  const share = doc.getElementById('copy-url');
  const toast = doc.getElementById('toast');
  let toastTimeout;
  function notify(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 2800);
  }
  if (share) share.addEventListener('click', async () => {
    const url = window.location.href.split('#')[0];
    if (navigator.share && window.location.protocol !== 'file:') {
      try { await navigator.share({ title: 'Valentina — María Zabay', url }); return; }
      catch (err) { if (err && err.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(url); notify('Enlace copiado'); }
    catch (err) { notify('Copia el enlace de la barra de direcciones'); }
  });

  const year = doc.getElementById('current-year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
