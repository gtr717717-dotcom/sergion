// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle && navLinks) {
  toggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
    }
  });
}

// Mark active nav link
const currentPath = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPath || (currentPath === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// Contact form validation
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll('.form-group').forEach(group => {
      const input = group.querySelector('input, textarea');
      if (!input) return;
      const errorEl = group.querySelector('.error-msg');
      group.classList.remove('has-error');

      if (input.required && !input.value.trim()) {
        group.classList.add('has-error');
        if (errorEl) errorEl.textContent = 'This field is required.';
        valid = false;
      } else if (input.type === 'email' && input.value.trim()) {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(input.value.trim())) {
          group.classList.add('has-error');
          if (errorEl) errorEl.textContent = 'Please enter a valid email address.';
          valid = false;
        }
      }
    });

    if (valid) {
      form.style.display = 'none';
      document.getElementById('form-success').style.display = 'block';
    }
  });
}
