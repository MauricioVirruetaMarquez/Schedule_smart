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
    mostrarError('Completa todos los campos correctamente.');
    return;
  }

  const { error } = await db
    .from('utilisateurs')
    .insert([{
      Nombre: nombre,          
      Correo: correo,
      Contrasena: contrasena  
    }]);

  if (error) {
    mostrarError('Error al registrar usuario: ' + error.message);
    return;
  }

  alert('🙌 Usuario registrado correctamente.');
  signupForm.reset();
  signupError.classList.add('hidden');
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

  // Busca el usuario por correo
  const { data, error } = await db
    .from('utilisateurs')
    .select('*')
    .eq('Correo', correo);  

  if (error) {
    loginError.textContent = 'Error al conectar con la base de datos.';
    loginError.classList.remove('hidden');
    return;
  }

  if (!data || data.length === 0) {
    loginError.textContent = 'Correo no encontrado.';
    loginError.classList.remove('hidden');
    return;
  }

  const usuario = data[0];

  if (usuario.Contrasena !== contrasena) {  
    loginError.textContent = 'Contraseña incorrecta.';
    loginError.classList.remove('hidden');
    return;
  }

  alert('✅ Bienvenido ' + usuario.Nombre);

  // Guarda al usuario logueado en la sesión del navegador
  sessionStorage.setItem('currentUser', JSON.stringify(usuario));
  window.location.href = 'index.html';
  });
}

// === FUNCIÓN DE ERROR (para registro) ===
function mostrarError(mensaje) {
  if (!signupError) return; // por si estamos en otra página
  signupError.textContent = mensaje;
  signupError.classList.remove('hidden');
  
}


// === (Opcional) Social login no implementado ===
function socialLogin(provider) {
  alert(`Login con ${provider} aún no implementado`);
}
