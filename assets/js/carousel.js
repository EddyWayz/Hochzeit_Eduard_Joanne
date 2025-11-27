/**
 * Simple Carousel
 */
document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.carousel-track');
    if (!track) return;

    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.carousel-btn.next');
    const prevButton = document.querySelector('.carousel-btn.prev');
    const dotsNav = document.querySelector('.carousel-dots');
    const dots = Array.from(dotsNav.children);

    let currentIndex = 0;

    function updateSlide(index) {
        track.style.transform = `translateX(-${index * 100}%)`;

        dots.forEach(dot => dot.classList.remove('active'));
        dots[index].classList.add('active');

        currentIndex = index;
    }

    nextButton.addEventListener('click', () => {
        const nextIndex = (currentIndex + 1) % slides.length;
        updateSlide(nextIndex);
    });

    prevButton.addEventListener('click', () => {
        const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateSlide(prevIndex);
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            updateSlide(index);
        });
    });

    // Auto-play
    setInterval(() => {
        const nextIndex = (currentIndex + 1) % slides.length;
        updateSlide(nextIndex);
    }, 5000);
});
