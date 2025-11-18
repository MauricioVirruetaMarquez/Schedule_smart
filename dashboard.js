// ===== Config y helpers =====
const FIXED_YEAR = 2025;
const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const dayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const dayNamesFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const today = new Date();

// Estado (con persistencia)
let events = JSON.parse(localStorage.getItem('events')) || {}; // clave ISO YYYY-MM-DD
let currentModalMonth = 0;       // 0..11
let currentModalYear = FIXED_YEAR;

let todos = JSON.parse(localStorage.getItem('todos')) || [];
let habits = [];


// ===== Función para obtener usuario logueado =====
function getCurrentUser() {
  const s = sessionStorage.getItem("currentUser");
  return s ? JSON.parse(s) : null;
}

// Utilidades de fecha
function getDaysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
}
function getFirstDayOfMonth(year, monthIndex) {
    return new Date(year, monthIndex, 1).getDay();
}
function formatKey(y, monthIndex, d) {
    // mes 0-based → ISO YYYY-MM-DD
    return `${y}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function getCurrentDateISO() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}
function saveEvents() {
    localStorage.setItem('events', JSON.stringify(events));
}

// ===== Nueva función para eliminar eventos =====
function deleteEvent(dateKey, eventIndex) {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
        events[dateKey].splice(eventIndex, 1);

        // Si ya no quedan eventos en esa fecha, eliminar la clave
        if (events[dateKey].length === 0) {
            delete events[dateKey];
        }

        saveEvents();
        updateModal();

        // Opcional: mostrar mensaje de confirmación
        showTemporaryMessage('Evento eliminado correctamente');
    }
}

// ===== Función para mostrar mensajes temporales =====
function showTemporaryMessage(message) {
    // Crear elemento de mensaje
    const msgDiv = document.createElement('div');
    msgDiv.className = 'temp-message';
    msgDiv.textContent = message;
    msgDiv.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;

    document.body.appendChild(msgDiv);

    // Eliminar después de 3 segundos
    setTimeout(() => {
        msgDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => msgDiv.remove(), 300);
    }, 3000);
}

// ===== Mini-calendarios (12) =====
function createMiniCalendar(monthIndex) {
    const calendarBox = document.createElement('div');
    calendarBox.className = 'calendar-box';

    const miniCalendar = document.createElement('div');
    miniCalendar.className = 'mini-calendar';
    miniCalendar.id = `calendar-${monthIndex + 1}`;

    const daysInMonth = getDaysInMonth(FIXED_YEAR, monthIndex);
    const firstDay = getFirstDayOfMonth(FIXED_YEAR, monthIndex);
    const daysInPrevMonth = getDaysInMonth(FIXED_YEAR, monthIndex - 1);

    const title = document.createElement('h3');
    title.textContent = monthNames[monthIndex];
    miniCalendar.appendChild(title);

    const headerDiv = document.createElement('div');
    headerDiv.className = 'calendar-header';
    dayNames.forEach(d => {
        const h = document.createElement('div');
        h.className = 'day-header';
        h.textContent = d;
        headerDiv.appendChild(h);
    });
    miniCalendar.appendChild(headerDiv);

    const daysDiv = document.createElement('div');
    daysDiv.className = 'calendar-days';

    // Relleno del mes anterior
    for (let i = firstDay - 1; i >= 0; i--) {
        const c = document.createElement('div');
        c.className = 'day-cell other-month';
        c.textContent = daysInPrevMonth - i;
        daysDiv.appendChild(c);
    }

    // Días del mes
    for (let d = 1; d <= daysInMonth; d++) {
        const c = document.createElement('div');
        c.className = 'day-cell';
        c.textContent = d;

        // Marcar si tiene eventos
        const dateKey = formatKey(FIXED_YEAR, monthIndex, d);
        if (events[dateKey] && events[dateKey].length > 0) {
            c.classList.add('has-events');
        }

        if (today.getFullYear() === FIXED_YEAR &&
            today.getMonth() === monthIndex &&
            today.getDate() === d) {
            c.classList.add('today');
        }
        daysDiv.appendChild(c);
    }

    // Relleno siguiente mes para completar 6 filas (42 celdas)
    const cellsUsed = firstDay + daysInMonth;
    const remaining = 42 - cellsUsed;
    for (let d = 1; d <= remaining; d++) {
        const c = document.createElement('div');
        c.className = 'day-cell other-month';
        c.textContent = d;
        daysDiv.appendChild(c);
    }

    miniCalendar.appendChild(daysDiv);

    // Botón para abrir modal del mes
    const arrowBtn = document.createElement('button');
    arrowBtn.className = 'arrow-btn';
    arrowBtn.textContent = '→';
    arrowBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openModal(monthIndex);
    });

    calendarBox.appendChild(miniCalendar);
    calendarBox.appendChild(arrowBtn);
    return calendarBox;
}

// ===== Calendario grande (modal) - ACTUALIZADO =====
function createLargeCalendar(monthIndex, year) {
    const container = document.getElementById('largeCalendar');
    container.innerHTML = '';

    const daysInMonth = getDaysInMonth(year, monthIndex);
    const firstDay = getFirstDayOfMonth(year, monthIndex);
    const daysInPrevMonth = getDaysInMonth(year, monthIndex - 1);

    const grid = document.createElement('div');
    grid.className = 'large-calendar-grid';

    // Encabezados
    dayNamesFull.forEach(d => {
        const h = document.createElement('div');
        h.className = 'large-day-header';
        h.textContent = d;
        grid.appendChild(h);
    });

    // Relleno mes anterior
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayNum = daysInPrevMonth - i;
        const cell = document.createElement('div');
        cell.className = 'large-day-cell other-month';
        cell.innerHTML = `<div class="day-number">${dayNum}</div><div class="event-list"></div>`;
        grid.appendChild(cell);
    }

    // Días del mes
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'large-day-cell';
        if (today.getFullYear() === year &&
            today.getMonth() === monthIndex &&
            today.getDate() === d) {
            cell.classList.add('today');
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = d;

        const eventList = document.createElement('div');
        eventList.className = 'event-list';

        const dateKey = formatKey(year, monthIndex, d);
        if (events[dateKey]) {
            events[dateKey].forEach((ev, index) => {
                const item = document.createElement('div');
                item.className = 'event-item';

                const eventText = document.createElement('span');
                eventText.className = 'event-text';
                eventText.textContent = `${ev.time ? ev.time + ' · ' : ''}${ev.title}`;

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'event-delete-btn';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.title = 'Eliminar evento';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteEvent(dateKey, index);
                });

                item.appendChild(eventText);
                item.appendChild(deleteBtn);
                item.setAttribute('data-category', ev.category || 'personal');
                eventList.appendChild(item);
            });
        }

        cell.appendChild(dayNumber);
        cell.appendChild(eventList);

        // Al hacer click, precarga la fecha en el form
        cell.addEventListener('click', (e) => {
            // Evitar que se active si se hizo click en el botón de eliminar
            if (!e.target.classList.contains('event-delete-btn')) {
                const formatted = formatKey(year, monthIndex, d);
                document.getElementById('eventDate').value = formatted;
                document.getElementById('eventTitle').focus();
            }
        });

        grid.appendChild(cell);
    }

    // Relleno siguiente mes
    const cellsUsed = firstDay + daysInMonth;
    const remaining = 42 - cellsUsed;
    for (let d = 1; d <= remaining; d++) {
        const cell = document.createElement('div');
        cell.className = 'large-day-cell other-month';
        cell.innerHTML = `<div class="day-number">${d}</div><div class="event-list"></div>`;
        grid.appendChild(cell);
    }

    container.appendChild(grid);
}

function openModal(monthIndex) {
    currentModalMonth = monthIndex;
    currentModalYear = FIXED_YEAR;
    document.getElementById('modalTitle').textContent =
        `${monthNames[monthIndex]} ${currentModalYear}`;
    createLargeCalendar(monthIndex, currentModalYear);

    const modal = document.getElementById('monthModal');
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
}
function closeModal() {
    const modal = document.getElementById('monthModal');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
}
function updateModal() {
    document.getElementById('modalTitle').textContent =
        `${monthNames[currentModalMonth]} ${currentModalYear}`;
    createLargeCalendar(currentModalMonth, currentModalYear);

    // Actualizar mini-calendarios también
    updateMiniCalendars();
}

// ===== Nueva función para actualizar mini-calendarios =====
function updateMiniCalendars() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    for (let m = 0; m < 12; m++) {
        grid.appendChild(createMiniCalendar(m));
    }
}

// ===== Navegación de secciones =====
function switchSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
}

// ===== ToDo =====
function saveTodos() { localStorage.setItem('todos', JSON.stringify(todos)); }
function renderTodos() {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';
    if (todos.length === 0) {
        const li = document.createElement('li');
        li.innerHTML = '<span style="color:#888; text-align:center; width:100%;">No hay tareas pendientes. ¡Agrega una nueva!</span>';
        li.style.background = 'none'; li.style.boxShadow = 'none'; li.style.borderLeft = 'none';
        list.appendChild(li);
        return;
    }
    todos.forEach((todo, i) => {
        const li = document.createElement('li');
        if (todo.done) li.classList.add('done');

        const span = document.createElement('span');
        span.textContent = todo.text;

        const checkBtn = document.createElement('button');
        checkBtn.className = 'check-btn';
        checkBtn.textContent = todo.done ? '↶' : '✓';
        checkBtn.title = todo.done ? 'Reactivar tarea' : 'Marcar como completada';
        checkBtn.addEventListener('click', () => { toggleTodo(i); });

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.textContent = 'X';
        delBtn.title = 'Eliminar tarea';
        delBtn.addEventListener('click', () => { deleteTodo(i); });

        li.appendChild(span);
        li.appendChild(checkBtn);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}
function addTodo(text) {
    todos.push({ text, done: false, createdAt: new Date().toISOString() });
    saveTodos(); renderTodos();
}
function toggleTodo(i) { todos[i].done = !todos[i].done; saveTodos(); renderTodos(); }
function deleteTodo(i) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        todos.splice(i, 1); saveTodos(); renderTodos();
    }
}

// ===== Hábitos (con Supabase) =====

// Muestra todos los hábitos en la interfaz
function renderHabits() {
    const c = document.getElementById('habits-list');
    c.innerHTML = '';

    if (habits.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'habit-item';
        empty.innerHTML = '<div style="text-align:center; width:100%; color:#888; padding:40px;">No hay hábitos registrados. ¡Agrega tu primer hábito!</div>';
        empty.style.background = 'none'; empty.style.boxShadow = 'none'; empty.style.borderLeft = 'none';
        c.appendChild(empty);
        return;
    }

    habits.forEach((habit, idx) => {
        const item = document.createElement('div');
        item.className = 'habit-item';

        const info = document.createElement('div');
        info.className = 'habit-info';

        const name = document.createElement('div');
        name.className = 'habit-name';
        name.textContent = habit.name;

        const counter = document.createElement('div');
        counter.className = 'habit-counter';
        counter.textContent = `Racha actual: ${habit.streak} día${habit.streak !== 1 ? 's' : ''}`;

        const calendar = document.createElement('div');
        calendar.className = 'calendar';

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const iso = d.toISOString().split('T')[0];

            const day = document.createElement('div');
            day.className = 'day';
            day.textContent = d.getDate();
            day.title = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

            if (i === 0) day.classList.add('today');
            if (habit.completedDates.includes(iso)) day.classList.add('checked');

            calendar.appendChild(day);
        }

        info.appendChild(name);
        info.appendChild(counter);
        info.appendChild(calendar);

        const actions = document.createElement('div');
        actions.className = 'habit-actions';

        const todayISO = getCurrentDateISO();

        const btnCheck = document.createElement('button');
        btnCheck.className = 'habit-check';
        btnCheck.textContent = '✓';
        if (habit.completedDates.includes(todayISO)) btnCheck.classList.add('checked');
        btnCheck.title = habit.completedDates.includes(todayISO) ? 'Desmarcar para hoy' : 'Marcar como completado hoy';
        btnCheck.addEventListener('click', () => toggleHabit(idx));

        const btnDelete = document.createElement('button');
        btnDelete.className = 'habit-delete';
        btnDelete.textContent = 'Eliminar';
        btnDelete.addEventListener('click', () => deleteHabit(idx));

        actions.appendChild(btnCheck);
        actions.appendChild(btnDelete);

        item.appendChild(info);
        item.appendChild(actions);
        c.appendChild(item);
    });
}
async function loadHabits() {
    const user = JSON.parse(sessionStorage.getItem("currentUser"));

    if (!user) return;

    const { data, error } = await db
        .from("habitos")
        .select("*")
        .eq("user_id", user.id_usuario);

    if (error) {
        console.error("❌ Error cargando hábitos:", error);
        return;
    }

    habits = data.map(h => ({
        id: h.id,
        name: h.name,
        streak: h.streak,
        completedDates: h.completed_dates || [],
        createdAt: h.created_at,
        user_id: h.user_id    
    }));


    renderHabits();
}


// Inserta un nuevo hábito en Supabase
async function addHabit(name) {
    const user = JSON.parse(sessionStorage.getItem("currentUser"));

    if (!user) {
        alert("❌ No hay usuario logueado");
        return;
    }

    // Guardar en Supabase
    const { error } = await db
        .from("habitos")
        .insert({
            name,
            streak: 0,
            completed_dates: [],
            user_id: user.id_usuario
        });

    if (error) {
        console.error("❌ Error guardando hábito:", error);
        alert("Error al guardar el hábito");
        return;
    }

    loadHabits();  // 🔄 Recargar hábitos desde Supabase
}


// Marca o desmarca el hábito como hecho hoy
async function toggleHabit(idx) {
    const today = getCurrentDateISO();
    const habit = habits[idx];
    const user = getCurrentUser();

    if (habit.completedDates.includes(today)) {
        habit.completedDates = habit.completedDates.filter(d => d !== today);
    } else {
        habit.completedDates.push(today);
    }

    recalculateStreak(idx);

    const { error } = await db
        .from("habitos")
        .update({
            streak: habit.streak,
            completed_dates: habit.completedDates
        })
        .eq("id", habit.id)
        .eq("user_id", user.id_usuario); 

    if (!error) renderHabits();
}


// Calcula la racha de días
function recalculateStreak(idx) {
    const habit = habits[idx];
    const set = new Set(habit.completedDates);
    let streak = 0;

    const date = new Date();
    while (true) {
        const iso = date.toISOString().split('T')[0];
        if (set.has(iso)) {
            streak++;
            date.setDate(date.getDate() - 1);
        } else break;
    }

    habit.streak = streak;
}

async function deleteHabit(idx) {
    if (!confirm("¿Seguro que quieres borrar este hábito?")) return;

    const habit = habits[idx];
    const user = getCurrentUser();

    const { error } = await db
        .from("habitos")
        .delete()
        .eq("id", habit.id)
        .eq("user_id", user.id_usuario);  // 🔥 ESTA ES LA CORRECTA

    if (error) {
        alert("❌ Error al borrar hábito");
    } else {
        await loadHabits();  // Recargar lista desde Supabase
    }
}




// ===== Inicio =====
document.addEventListener('DOMContentLoaded', () => {
    
    loadHabits();

    
    // Construir 12 mini-calendarios
    const grid = document.getElementById('calendarGrid');
    for (let m = 0; m < 12; m++) grid.appendChild(createMiniCalendar(m));

    // Modal
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('prevMonth').addEventListener('click', () => {
        if (currentModalMonth === 0) { currentModalMonth = 11; currentModalYear--; }
        else { currentModalMonth--; }
        updateModal();
    });
    document.getElementById('nextMonth').addEventListener('click', () => {
        if (currentModalMonth === 11) { currentModalMonth = 0; currentModalYear++; }
        else { currentModalMonth++; }
        updateModal();
    });
    document.getElementById('todayBtn').addEventListener('click', () => {
        const t = new Date();
        currentModalMonth = t.getMonth();
        currentModalYear = t.getFullYear();
        updateModal();
    });

    // Agregar evento
    document.getElementById('addEventBtn').addEventListener('click', () => {
        const title = document.getElementById('eventTitle').value.trim();
        const date = document.getElementById('eventDate').value;
        const time = document.getElementById('eventTime').value;
        const category = document.getElementById('eventCategory').value;

        if (!title || !date) {
            alert('Por favor completa al menos el título y la fecha del evento.');
            return;
        }
        const [yy, mm, dd] = date.split('-').map(n => parseInt(n, 10));
        const key = formatKey(yy, mm - 1, dd);

        if (!events[key]) events[key] = [];
        events[key].push({ title, time, category, date });
        saveEvents();

        // limpiar inputs
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventTime').value = '';

        // refrescar si se está viendo ese mes
        if ((mm - 1) === currentModalMonth && yy === currentModalYear) {
            updateModal();
        }

        showTemporaryMessage('¡Evento agregado correctamente!');
    });

    // Click fuera del modal para cerrar
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('monthModal');
        if (e.target === modal) closeModal();
    });

    // Menú lateral
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.currentTarget.getAttribute('data-section');
            switchSection(section);
        });
    });

    // ToDo
    document.getElementById('todo-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('todo-input');
        const text = input.value.trim();
        if (text) { addTodo(text); input.value = ''; input.focus(); }
    });

    // Hábitos
    document.getElementById('habit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('habit-input');
        const name = input.value.trim();
        if (name) { addHabit(name); input.value = ''; input.focus(); }
    });

    // Botón "Calendario completo" (placeholder)
    document.querySelector('.btn-calendario').addEventListener('click', () => {
        alert('Vista de calendario completo - Próximamente');
    });

    // Fecha por defecto del form de eventos
    document.getElementById('eventDate').value = today.toISOString().split('T')[0];

    // Pintar listas iniciales
    renderTodos();
    renderHabits();

    // Agregar estilos de animación para mensajes
    if (!document.getElementById('temp-message-styles')) {
        const style = document.createElement('style');
        style.id = 'temp-message-styles';
        style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
        document.head.appendChild(style);
    }
});
