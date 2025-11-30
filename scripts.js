// === Configuración de Supabase ===
const { createClient } = supabase;

const SUPABASE_URL = 'https://zfwrnlzzbeklomfekmpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmd3JubHp6YmVrbG9tZmVrbXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTI1NzYsImV4cCI6MjA3OTI2ODU3Nn0.Bbuxa89AMdqU4yjWQPq0LFWnV07iqlHf3zeaTPKWOH8';

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// === VERIFICAR SESIÓN AL CARGAR ===
// Si estamos en index.html, verificar que el usuario esté autenticado
if (window.location.pathname.includes('index.html')) {
  db.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      // No hay sesión, redirigir al login
      window.location.href = 'login_page.html';
    }
  });
}

// === FORMULARIO DE REGISTRO ===
const signupForm = document.getElementById('signupForm');
const signupError = document.getElementById('signupError');

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('signupName').value.trim();
    const correo = document.getElementById('signupEmail').value.trim();
    const contrasena = document.getElementById('signupPassword').value.trim();

    if (!nombre || !correo || contrasena.length < 6) {
      mostrarError('Completa todos los campos. La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Registrar con Supabase Auth
    const { data, error } = await db.auth.signUp({
      email: correo,
      password: contrasena,
      options: {
        data: {
          nombre: nombre
        }
      }
    });

    if (error) {
      mostrarError('Error al registrar usuario: ' + error.message);
      return;
    }

    alert('✅ Usuario registrado correctamente. Por favor, inicia sesión.');
    signupForm.reset();
    signupError.classList.add('hidden');

    // Cambiar a pestaña de login
    document.querySelector('[data-tab="login"]')?.click();
  });
}

// === FORMULARIO DE LOGIN ===
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const correo = document.getElementById('loginEmail').value.trim();
    const contrasena = document.getElementById('loginPassword').value.trim();

    // Iniciar sesión con Supabase Auth
    const { data, error } = await db.auth.signInWithPassword({
      email: correo,
      password: contrasena
    });

    if (error) {
      loginError.textContent = 'Correo o contraseña incorrectos.';
      loginError.classList.remove('hidden');
      return;
    }

    alert('✅ Bienvenido ' + (data.user.user_metadata?.nombre || 'Usuario'));

    // Supabase maneja la sesión automáticamente
    window.location.href = 'index.html';
  });
}

// === FUNCIÓN DE ERROR (para registro) ===
function mostrarError(mensaje) {
  if (!signupError) return; // por si estamos en otra página
  signupError.textContent = mensaje;
  signupError.classList.remove('hidden');
}

// === LOGOUT ===
async function logout() {
  const { error } = await db.auth.signOut();
  if (!error) {
    window.location.href = 'login_page.html';
  }
}

// === (Opcional) Social login no implementado ===
function socialLogin(provider) {
  alert(`Login con ${provider} aún no implementado`);
}
