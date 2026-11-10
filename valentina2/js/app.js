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

  // Lector del fragmento: ventana centrada, giro de portada y una página por vez
  // en móvil. Evitamos que el libro se abra fuera de la zona visible.
  const readerTrigger = doc.getElementById('discover-book-trigger');
  const readerDialog = doc.getElementById('valentina-reader');
  const readerClose = doc.getElementById('reader-close');
  const readerPrev = doc.getElementById('reader-prev');
  const readerNext = doc.getElementById('reader-next');
  const readerZoom = doc.getElementById('reader-zoom');
  const readerStage = doc.getElementById('reader-stage');
  const readerPosition = doc.getElementById('reader-position');
  const readerHint = doc.getElementById('discover-interaction-hint');
  const readerPages = Array.from(doc.querySelectorAll('.reader-page'));

  if (readerTrigger && readerDialog && readerClose && readerPages.length === 2) {
    let currentPage = 0;
    let lastFocus = null;
    const mobileReader = window.matchMedia('(max-width: 700px)');
    const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    function setZoom(enabled) {
      readerStage.classList.toggle('is-zoomed', enabled);
      readerZoom.setAttribute('aria-pressed', String(enabled));
      readerZoom.innerHTML = enabled ? 'Ajustar <span aria-hidden="true">−</span>' : 'Ampliar <span aria-hidden="true">＋</span>';
      readerPages.forEach(page => { page.scrollTop = 0; page.scrollLeft = 0; });
    }
    function setPage(index) {
      currentPage = Math.min(readerPages.length - 1, Math.max(0, index));
      readerPages.forEach((page, i) => page.classList.toggle('is-active', i === currentPage));
      readerPosition.textContent = `Página ${currentPage + 9} de 10`;
      readerPrev.disabled = currentPage === 0;
      readerNext.disabled = currentPage === readerPages.length - 1;
      setZoom(false);
    }
    function openReader() {
      if (readerDialog.open) return;
      lastFocus = doc.activeElement;
      setPage(0);
      readerDialog.showModal();
      doc.body.classList.add('reader-is-open');
      readerTrigger.setAttribute('aria-expanded', 'true');
      readerTrigger.setAttribute('aria-label', 'Libro Valentina abierto');
      readerDialog.classList.remove('reader-animated');
      // Reinicia el giro de la cubierta al volver a abrir el libro.
      void readerDialog.offsetWidth;
      readerDialog.classList.add('reader-animated');
      readerClose.focus({ preventScroll: true });
      if (readerHint) readerHint.textContent = 'El libro está abierto en el lector.';
    }
    function closeReader() {
      if (readerDialog.open) readerDialog.close();
    }
    readerTrigger.addEventListener('click', openReader);
    readerClose.addEventListener('click', closeReader);
    readerDialog.addEventListener('close', () => {
      doc.body.classList.remove('reader-is-open');
      readerTrigger.setAttribute('aria-expanded', 'false');
      readerTrigger.setAttribute('aria-label', 'Abrir el libro Valentina para leer las primeras páginas');
      readerDialog.classList.remove('reader-animated');
      setZoom(false);
      if (readerHint) readerHint.textContent = 'Pulsa la portada para abrir el libro y leerlo aquí.';
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
    });
    readerDialog.addEventListener('click', event => {
      // Se puede cerrar pulsando el exterior de la ventana.
      if (event.target === readerDialog) closeReader();
    });
    readerPrev.addEventListener('click', () => setPage(currentPage - 1));
    readerNext.addEventListener('click', () => setPage(currentPage + 1));
    readerZoom.addEventListener('click', () => setZoom(!readerStage.classList.contains('is-zoomed')));
    readerDialog.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' && mobileReader.matches) { e.preventDefault(); setPage(currentPage + 1); }
      if (e.key === 'ArrowLeft' && mobileReader.matches) { e.preventDefault(); setPage(currentPage - 1); }
    });
    let touchX = null;
    readerStage.addEventListener('touchstart', e => {
      if (!mobileReader.matches || readerStage.classList.contains('is-zoomed') || e.touches.length !== 1) return;
      touchX = e.touches[0].clientX;
    }, { passive: true });
    readerStage.addEventListener('touchend', e => {
      if (touchX === null || !mobileReader.matches || readerStage.classList.contains('is-zoomed')) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 70) setPage(currentPage + (dx < 0 ? 1 : -1));
      touchX = null;
    }, { passive: true });
    mobileReader.addEventListener('change', () => setZoom(false));
    if (motionReduced.matches) readerDialog.classList.add('reader-reduced-motion');
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
