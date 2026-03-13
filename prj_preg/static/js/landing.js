// Slideshow functionality
let currentSlideIndex = 0;
let slideInterval;

function showSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    if (index >= slides.length) {
        currentSlideIndex = 0;
    } else if (index < 0) {
        currentSlideIndex = slides.length - 1;
    } else {
        currentSlideIndex = index;
    }
    
    slides[currentSlideIndex].classList.add('active');
    dots[currentSlideIndex].classList.add('active');
}

function nextSlide() {
    showSlide(currentSlideIndex + 1);
}

function currentSlide(index) {
    clearInterval(slideInterval);
    showSlide(index);
    startSlideshow();
}

function startSlideshow() {
    slideInterval = setInterval(nextSlide, 5000);
}

// Start slideshow on page load
window.addEventListener('DOMContentLoaded', () => {
    startSlideshow();
    // if server-side messages are present inside either modal, open it automatically
    const loginMsgs = document.querySelectorAll('#loginModal .modal-messages p');
    const regMsgs = document.querySelectorAll('#registerModal .modal-messages p');
    if (loginMsgs && loginMsgs.length > 0) {
        openModal(loginModal);
    } else if (regMsgs && regMsgs.length > 0) {
        openModal(registerModal);
    }
});

// Modal functionality
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const blurOverlay = document.getElementById('blurOverlay');
const closeLogin = document.getElementById('closeLogin');
const closeRegister = document.getElementById('closeRegister');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');

function openModal(modal) {
    modal.classList.add('active');
    blurOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    blurOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

loginBtn.addEventListener('click', () => openModal(loginModal));
registerBtn.addEventListener('click', () => openModal(registerModal));

closeLogin.addEventListener('click', () => closeModal(loginModal));
closeRegister.addEventListener('click', () => closeModal(registerModal));

blurOverlay.addEventListener('click', () => {
    closeModal(loginModal);
    closeModal(registerModal);
});

switchToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(loginModal);
    openModal(registerModal);
});

switchToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(registerModal);
    openModal(loginModal);
});

// Form submissions are handled on the server side now; remove client-side interceptors
// previous implementation stored values in localStorage and redirected to a static page.
// let the browser perform a normal POST so Django views can validate and authenticate.
