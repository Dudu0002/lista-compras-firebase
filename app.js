// ---------- CONFIGURAÇÃO FIREBASE (substitua se necessário) ----------
const firebaseConfig = {
  apiKey: "AIzaSyDjcxSEbrbm3GsECKeT5wh4wL5VgnNxXs0",
  authDomain: "lista-de-compras-23a0b.firebaseapp.com",
  projectId: "lista-de-compras-23a0b",
  storageBucket: "lista-de-compras-23a0b.firebasestorage.app",
  messagingSenderId: "409193205537",
  appId: "1:409193205537:web:069b34c58ae88de623b860"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
let db = null;
try { db = firebase.firestore(); } catch (e) { console.warn('Firestore não inicializado:', e); }

// Se você quiser forçar o uso do Firestore mesmo sem fallbacks, troque para true.
// Com o valor false, o app tentará usar Firestore mas volta para localStorage se houver erro.
const TRY_USE_FIRESTORE = true;

// ---------- DOM ----------
const categoriesContainer = document.querySelector('.categories');
const newCategoryInput = document.getElementById('new-category');
const addCategoryBtn = document.getElementById('add-category-btn');
const resetBtn = document.getElementById('reset-btn');
const logoutBtn = document.getElementById('logout-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const userEmailEl = document.getElementById('user-email');

const categoryIcons = {
  'Frutas': 'fa-apple-alt',
  'Laticínios': 'fa-cheese',
  'Padaria': 'fa-bread-slice',
  'Carnes': 'fa-drumstick-bite',
  'Bebidas': 'fa-wine-bottle',
  'Limpeza': 'fa-spray-can',
  'Higiene': 'fa-soap',
  'Congelados': 'fa-snowflake',
  'Padrão': 'fa-shopping-basket'
};

let shoppingList = {};     // { categoria: [ {name, completed}, ... ] }
let currentUser = null;
let activeCategory = null;
let usingFirestore = false; // estado em runtime (se true -> usamos Firestore com sucesso)

// ---------- Tema ----------
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
  updateThemeButton();
}
function updateThemeButton() {
  const isDark = document.body.classList.contains('dark-mode');
  themeToggleBtn.innerHTML = isDark
    ? '<i class="fas fa-sun"></i> Modo Claro'
    : '<i class="fas fa-moon"></i> Modo Escuro';
}
if (localStorage.getItem('darkMode') === 'enabled') document.body.classList.add('dark-mode');
updateThemeButton();
themeToggleBtn.addEventListener('click', toggleTheme);

// ---------- Helpers ----------
function getCategoryIcon(categoryName) {
  for (const key in categoryIcons) {
    if (categoryName.toLowerCase().includes(key.toLowerCase())) return categoryIcons[key];
  }
  return categoryIcons['Padrão'];
}

// ---------- Persistência: tentativa Firestore, fallback localStorage ----------
async function saveListForUser() {
  if (!currentUser) return;
  // Primeiro tenta Firestore
  if (TRY_USE_FIRESTORE && db) {
    try {
      await db.collection('listas').doc(currentUser.uid).set({ shoppingList }, { merge: true });
      usingFirestore = true;
      console.log('Salvo no Firestore.');
      return;
    } catch (err) {
      console.warn('Falha ao salvar no Firestore, fallback para localStorage:', err);
      usingFirestore = false;
    }
  }
  // Fallback localStorage
  try {
    localStorage.setItem(`shoppingList_${currentUser.uid}`, JSON.stringify(shoppingList));
    console.log('Salvo no localStorage.');
  } catch (err) {
    console.error('Erro salvando no localStorage:', err);
  }
}

async function loadListForUser() {
  if (!currentUser) return;
  // Tenta Firestore primeiro (se configurado)
  if (TRY_USE_FIRESTORE && db) {
    try {
      const doc = await db.collection('listas').doc(currentUser.uid).get();
      if (doc.exists) {
        const data = doc.data();
        shoppingList = data.shoppingList || {};
      } else {
        shoppingList = {};
      }
      usingFirestore = true;
      console.log('Carregado do Firestore.');
      return;
    } catch (err) {
      console.warn('Falha ao carregar do Firestore, fallback localStorage:', err);
      usingFirestore = false;
    }
  }
  // Fallback localStorage
  const data = localStorage.getItem(`shoppingList_${currentUser.uid}`);
  shoppingList = data ? JSON.parse(data) : {};
  console.log('Carregado do localStorage.');
}

// ---------- Renderização ----------
function renderCategories() {
  categoriesContainer.innerHTML = '';
  const keys = Object.keys(shoppingList);
  if (keys.length === 0) {
    categoriesContainer.innerHTML = '<p class="empty">Nenhuma categoria ainda. Adicione uma!</p>';
    return;
  }

  keys.forEach((categoryName, index) => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category';
    categoryDiv.style.animationDelay = `${index * 0.05}s`;

    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'category-header';

    const categoryTitle = document.createElement('h2');
    categoryTitle.className = 'category-title';
    const iconEl = document.createElement('i');
    iconEl.className = `fas ${getCategoryIcon(categoryName)}`;
    const titleSpan = document.createElement('span');
    titleSpan.textContent = categoryName;
    categoryTitle.appendChild(iconEl);
    categoryTitle.appendChild(titleSpan);

    const deleteCategoryBtn = document.createElement('button');
    deleteCategoryBtn.className = 'delete-category btn-small';
    deleteCategoryBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteCategoryBtn.title = 'Excluir categoria';
    deleteCategoryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Excluir categoria "${categoryName}"?`)) {
        delete shoppingList[categoryName];
        if (activeCategory === categoryName) activeCategory = null;
        saveListForUser();
        renderCategories();
        renderRightPanel();
      }
    });

    categoryHeader.appendChild(categoryTitle);
    categoryHeader.appendChild(deleteCategoryBtn);
    categoryDiv.appendChild(categoryHeader);

    const items = shoppingList[categoryName] || [];
    const preview = document.createElement('div');
    preview.className = 'category-preview';
    preview.textContent = items.slice(0,3).map(i => i.name).join(', ');
    categoryDiv.appendChild(preview);

    categoryDiv.addEventListener('click', () => {
      activeCategory = categoryName;
      // marcar ativo visualmente
      document.querySelectorAll('.category').forEach(el=>el.classList.remove('active'));
      categoryDiv.classList.add('active');
      renderRightPanel();
    });

    categoriesContainer.appendChild(categoryDiv);
  });
}

function renderRightPanel() {
  const right = document.querySelector('.right');
  if (!right) return;
  const infoNote = right.querySelector('.info-note');

  right.querySelectorAll('.category-details, .items-list, .add-item').forEach(n=>n.remove());

  if (!activeCategory) {
    if (infoNote) infoNote.style.display = 'block';
    return;
  }
  if (infoNote) infoNote.style.display = 'none';

  const details = document.createElement('div');
  details.className = 'category-details';

  const title = document.createElement('h2');
  title.textContent = activeCategory;
  details.appendChild(title);

  const itemsList = document.createElement('ul');
  itemsList.className = 'items-list';
  const items = shoppingList[activeCategory] || [];

  items.forEach((item, idx) => {
    const itemLi = document.createElement('li');
    itemLi.className = `item ${item.completed ? 'completed' : ''}`;

    const left = document.createElement('div');
    left.className = 'item-left';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.completed;
    checkbox.addEventListener('change', () => {
      shoppingList[activeCategory][idx].completed = checkbox.checked;
      saveListForUser();
      renderRightPanel();
      renderCategories();
    });

    const itemName = document.createElement('span');
    itemName.textContent = item.name;
    itemName.style.cursor = 'pointer';
    itemName.addEventListener('click', () => {
      shoppingList[activeCategory][idx].completed = !shoppingList[activeCategory][idx].completed;
      saveListForUser();
      renderRightPanel();
      renderCategories();
    });

    left.appendChild(checkbox);
    left.appendChild(itemName);

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-small';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.title = 'Editar item';
    editBtn.addEventListener('click', () => {
      const newName = prompt('Editar item:', item.name);
      if (newName && newName.trim()) {
        shoppingList[activeCategory][idx].name = newName.trim();
        saveListForUser();
        renderRightPanel();
        renderCategories();
      }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-small';
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    deleteBtn.title = 'Remover item';
    deleteBtn.addEventListener('click', () => {
      if (confirm('Remover este item?')) {
        shoppingList[activeCategory].splice(idx, 1);
        saveListForUser();
        renderRightPanel();
        renderCategories();
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    itemLi.appendChild(left);
    itemLi.appendChild(actions);
    itemsList.appendChild(itemLi);
  });

  const addItemDiv = document.createElement('div');
  addItemDiv.className = 'add-item';
  const addItemInput = document.createElement('input');
  addItemInput.type = 'text';
  addItemInput.placeholder = 'Adicionar novo item...';
  const addItemBtn = document.createElement('button');
  addItemBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar';

  addItemBtn.addEventListener('click', () => {
    const name = addItemInput.value.trim();
    if (name) {
      if (!shoppingList[activeCategory]) shoppingList[activeCategory] = [];
      shoppingList[activeCategory].push({ name, completed: false });
      saveListForUser();
      renderRightPanel();
      renderCategories();
      addItemInput.value = '';
    }
  });
  addItemInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addItemBtn.click(); });

  addItemDiv.appendChild(addItemInput);
  addItemDiv.appendChild(addItemBtn);

  details.appendChild(itemsList);
  details.appendChild(addItemDiv);

  right.appendChild(details);
}

// ---------- Eventos UI ----------
addCategoryBtn.addEventListener('click', () => {
  const name = newCategoryInput.value.trim();
  if (!name) return alert('Digite o nome da categoria.');
  if (shoppingList[name]) return alert('Já existe uma categoria com esse nome.');
  shoppingList[name] = [];
  newCategoryInput.value = '';
  saveListForUser();
  renderCategories();
});
newCategoryInput.addEventListener('keypress', (e)=>{ if(e.key==='Enter') addCategoryBtn.click(); });

resetBtn.addEventListener('click', () => {
  if (confirm('Criar nova lista? Isso apagará os dados atuais.')) {
    shoppingList = {};
    activeCategory = null;
    saveListForUser();
    renderCategories();
    renderRightPanel();
  }
});

logoutBtn.addEventListener('click', () => {
  auth.signOut().then(()=>{ window.location.href='index.html' });
});

// ---------- Autenticação e inicialização ----------
auth.onAuthStateChanged(async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  currentUser = user;
  userEmailEl.textContent = user.email || '(usuário)';
  await loadListForUser();
  renderCategories();
  renderRightPanel();
});
