// === Configuración de Supabase ===
const { createClient } = supabase;

const SUPABASE_URL = 'https://fnloybhznmzukltmrtuw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZubG95Ymh6bm16dWtsdG1ydHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MjQwMTYsImV4cCI6MjA3NTIwMDAxNn0.is6vrMiCneeLMJQVjgEGGQej3sZeiFDCs0q_40GgGb8';

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
      mostrarError(signupError, 'Completa todos los campos correctamente.');
      return;
    }

    try {
      // Verificar si el correo ya existe
      const { data: existingUser } = await db
        .from('utilisateurs')
        .select('Correo')
        .eq('Correo', correo)
        .single();

      if (existingUser) {
        mostrarError(signupError, '❌ Este correo ya está registrado.');
        return;
      }

      // Inserta directamente en la tabla
      const { error } = await db
        .from('utilisateurs')
        .insert([{ Nombre: nombre, Correo: correo, Password: contrasena }]);

      if (error) {
        console.error('Error al registrar:', error);
        mostrarError(signupError, 'Error al registrar usuario: ' + error.message);
        return;
      }

      mostrarExito('✅ Usuario registrado correctamente. Redirigiendo...');
      signupForm.reset();
      signupError.classList.add('hidden');
      
      // Redirigir al login después de 1.5 segundos
      setTimeout(() => {
        showLogin();
      }, 1500);

    } catch (err) {
      console.error('Error inesperado:', err);
      mostrarError(signupError, 'Error al conectar con la base de datos.');
    }
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

    if (!correo || !contrasena) {
      mostrarError(loginError, 'Por favor completa todos los campos.');
      return;
    }

    try {
      const { data, error } = await db
        .from('utilisateurs')
        .select('*')
        .eq('Correo', correo)
        .single();

      if (error || !data) {
        mostrarError(loginError, '❌ Correo no encontrado.');
        return;
      }

      const usuario = data;

      if (usuario.Password !== contrasena) {
        mostrarError(loginError, '❌ Contraseña incorrecta.');
        return;
      }

      // ✅ Guardar sesión en sessionStorage (más seguro)
      const userData = {
        id_usuario: usuario.id,
        nombre: usuario.Nombre,
        correo: usuario.Correo
      };

      sessionStorage.setItem('currentUser', JSON.stringify(userData));

      mostrarExito('✅ Bienvenido ' + usuario.Nombre + '. Redirigiendo...');

      // ✅ Redirigir después de un momento
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);

    } catch (err) {
      console.error('Error inesperado:', err);
      mostrarError(loginError, 'Error al conectar con la base de datos.');
    }
  });
}

// === FUNCIONES DE ERROR Y ÉXITO ===
function mostrarError(elemento, mensaje) {
  if (elemento) {
    elemento.textContent = mensaje;
    elemento.classList.remove('hidden');
    elemento.classList.remove('success-message');
    elemento.classList.add('error-message');
  }
}

function mostrarExito(mensaje) {
  const signupError = document.getElementById('signupError');
  const loginError = document.getElementById('loginError');
  
  const targetElement = signupError && !signupError.classList.contains('hidden') 
    ? signupError 
    : loginError;

  if (targetElement) {
    targetElement.textContent = mensaje;
    targetElement.classList.remove('hidden', 'error-message');
    targetElement.classList.add('success-message');
  }
}

// === Cambiar entre formularios ===
function showLogin() {
  const signup = document.getElementById('signupSection');
  const login = document.getElementById('loginSection');

  if (signup && login) {
    signup.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      signup.classList.add('hidden');
      login.classList.remove('hidden');
      login.style.animation = 'fadeIn 0.3s ease';
    }, 300);

    clearErrors();
  }
}

function showSignup() {
  const login = document.getElementById('loginSection');
  const signup = document.getElementById('signupSection');

  if (login && signup) {
    login.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      login.classList.add('hidden');
      signup.classList.remove('hidden');
      signup.style.animation = 'fadeIn 0.3s ease';
    }, 300);

    clearErrors();
  }
}

function clearErrors() {
  const signupError = document.getElementById('signupError');
  const loginError = document.getElementById('loginError');
  
  if (signupError) signupError.classList.add('hidden');
  if (loginError) loginError.classList.add('hidden');
}

// === (Opcional) Social login no implementado ===
function socialLogin(provider) {
  alert(`Login con ${provider} aún no implementado`);
}

// === Verificar si ya hay sesión activa ===
window.addEventListener('DOMContentLoaded', () => {
  const currentUser = sessionStorage.getItem('currentUser');
  
  // Si estamos en login y ya hay sesión, redirigir al dashboard
  if (currentUser && window.location.pathname.includes('login')) {
    window.location.href = 'index.html';
  }
});
