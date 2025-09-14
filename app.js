// Inicializar Firebase (Auth apenas)
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

// Seletores
const categoriesContainer = document.querySelector('.categories');
const newCategoryInput = document.getElementById('new-category');
const addCategoryBtn = document.getElementById('add-category-btn');
const resetBtn = document.getElementById('reset-btn');
const logoutBtn = document.getElementById('logout-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// Ícones padrão
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

let shoppingList = {};
let currentUser = null;

// ====================== FUNÇÕES ======================

// Tema
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
  updateThemeButton();
}

function updateThemeButton() {
  themeToggleBtn.innerHTML = document.body.classList.contains('dark-mode')
    ? '<i class="fas fa-sun"></i> Modo Claro'
    : '<i class="fas fa-moon"></i> Modo Escuro';
}

// LocalStorage
function saveListForUser() {
  if (!currentUser) return;
  localStorage.setItem(`shoppingList_${currentUser.uid}`, JSON.stringify(shoppingList));
}

function loadListForUser() {
  if (!currentUser) return;
  const data = localStorage.getItem(`shoppingList_${currentUser.uid}`);
  shoppingList = data ? JSON.parse(data) : {};
}

// Ícone categoria
function getCategoryIcon(categoryName) {
  for (const key in categoryIcons) {
    if (categoryName.toLowerCase().includes(key.toLowerCase())) return categoryIcons[key];
  }
  return categoryIcons['Padrão'];
}

// Renderizar categorias
function renderCategories() {
  categoriesContainer.innerHTML = '';
  Object.keys(shoppingList).forEach((categoryName, index) => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category';

    // Header
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
    deleteCategoryBtn.className = 'delete-category';
    deleteCategoryBtn.innerHTML = '<i class="fas fa-trash"></i> Excluir';
    deleteCategoryBtn.addEventListener('click', () => {
      if (confirm(`Excluir categoria "${categoryName}"?`)) {
        delete shoppingList[categoryName];
        saveListForUser();
        renderCategories();
      }
    });

    categoryHeader.appendChild(categoryTitle);
    categoryHeader.appendChild(deleteCategoryBtn);

    // Itens
    const itemsListEl = document.createElement('ul');
    itemsListEl.className = 'items-list';
    (shoppingList[categoryName] || []).forEach((item, idx) => {
      const itemLi = document.createElement('li');
      itemLi.className = item.completed ? 'completed' : '';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = item.completed;
      checkbox.addEventListener('change', () => {
        shoppingList[categoryName][idx].completed = checkbox.checked;
        saveListForUser();
        renderCategories();
      });

      const itemName = document.createElement('span');
      itemName.textContent = item.name;
      itemName.addEventListener('click', () => {
        shoppingList[categoryName][idx].completed = !shoppingList[categoryName][idx].completed;
        saveListForUser();
        renderCategories();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '<i class="fas fa-times-circle"></i>';
      deleteBtn.addEventListener('click', () => {
        shoppingList[categoryName].splice(idx, 1);
        saveListForUser();
        renderCategories();
      });

      itemLi.appendChild(checkbox);
      itemLi.appendChild(itemName);
      itemLi.appendChild(deleteBtn);
      itemsListEl.appendChild(itemLi);
    });

    // Adicionar item
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
        if (!shoppingList[categoryName]) shoppingList[categoryName] = [];
        shoppingList[categoryName].push({ name, completed: false });
        saveListForUser();
        renderCategories();
        addItemInput.value = '';
      }
    });
    addItemInput.addEventListener('keypress', e => { if (e.key==='Enter') addItemBtn.click(); });

    addItemDiv.appendChild(addItemInput);
    addItemDiv.appendChild(addItemBtn);

    categoryDiv.appendChild(categoryHeader);
    categoryDiv.appendChild(itemsListEl);
    categoryDiv.appendChild(addItemDiv);

    categoriesContainer.appendChild(categoryDiv);
  });
}

// ====================== EVENTOS ======================

// Adicionar categoria
addCategoryBtn.addEventListener('click', () => {
  const name = newCategoryInput.value.trim();
  if (name && !shoppingList[name]) {
    shoppingList[name] = [];
    saveListForUser();
    renderCategories();
    newCategoryInput.value = '';
  }
});
newCategoryInput.addEventListener('keypress', e => { if (e.key==='Enter') addCategoryBtn.click(); });

// Logout
logoutBtn.addEventListener('click', () => { auth.signOut().then(()=>{window.location.href='index.html';}); });

// Reset
resetBtn.addEventListener('click', () => {
  if(confirm('Criar nova lista? Isso apagará os dados atuais.')){
    shoppingList = {};
    saveListForUser();
    renderCategories();
  }
});

// Tema
themeToggleBtn.addEventListener('click', toggleTheme);
if(localStorage.getItem('darkMode')==='enabled') document.body.classList.add('dark-mode');
updateThemeButton();

// Auth
auth.onAuthStateChanged(user => {
  if(!user) { window.location.href='index.html'; return; }
  currentUser = user;
  loadListForUser();
  renderCategories();
});
