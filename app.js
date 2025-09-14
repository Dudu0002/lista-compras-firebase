// Firebase Auth
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

const categoriesContainer = document.querySelector('.categories');
const newCategoryInput = document.getElementById('new-category');
const addCategoryBtn = document.getElementById('add-category-btn');
const resetBtn = document.getElementById('reset-btn');
const logoutBtn = document.getElementById('logout-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

const categoryIcons = {
  'Frutas': 'fa-apple-alt','Laticínios': 'fa-cheese','Padaria': 'fa-bread-slice',
  'Carnes': 'fa-drumstick-bite','Bebidas': 'fa-wine-bottle','Limpeza': 'fa-spray-can',
  'Higiene': 'fa-soap','Congelados': 'fa-snowflake','Padrão': 'fa-shopping-basket'
};

let shoppingList = {};
let currentUser = null;

function toggleTheme(){
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'enabled':'disabled');
  themeToggleBtn.innerHTML = document.body.classList.contains('dark-mode') ? '<i class="fas fa-sun"></i> Modo Claro':'<i class="fas fa-moon"></i> Modo Escuro';
}

function saveList(){ if(currentUser) localStorage.setItem(`shoppingList_${currentUser.uid}`, JSON.stringify(shoppingList)); }
function loadList(){ if(currentUser){ const data=localStorage.getItem(`shoppingList_${currentUser.uid}`); shoppingList=data?JSON.parse(data):{}; } }
function getCategoryIcon(cat){ for(const k in categoryIcons) if(cat.toLowerCase().includes(k.toLowerCase())) return categoryIcons[k]; return categoryIcons['Padrão']; }

function renderCategories(){
  categoriesContainer.innerHTML='';
  Object.keys(shoppingList).forEach(cat=>{
    const div=document.createElement('div'); div.className='category';
    const header=document.createElement('div'); header.className='category-header';
    const h2=document.createElement('h2'); h2.className='category-title';
    const icon=document.createElement('i'); icon.className=`fas ${getCategoryIcon(cat)}`;
    h2.appendChild(icon); h2.appendChild(document.createTextNode(cat));
    const delBtn=document.createElement('button'); delBtn.className='delete-category';
    delBtn.innerHTML='<i class="fas fa-trash"></i> Excluir';
    delBtn.addEventListener('click',()=>{ if(confirm(`Excluir "${cat}"?`)){ delete shoppingList[cat]; saveList(); renderCategories(); }});
    header.appendChild(h2); header.appendChild(delBtn);

    const ul=document.createElement('ul'); ul.className='items-list';
    (shoppingList[cat]||[]).forEach((item,idx)=>{
      const li=document.createElement('li'); li.className=item.completed?'completed':'';
      const checkbox=document.createElement('input'); checkbox.type='checkbox'; checkbox.checked=item.completed;
      checkbox.addEventListener('change',()=>{ shoppingList[cat][idx].completed=checkbox.checked; saveList(); renderCategories(); });
      const span=document.createElement('span'); span.textContent=item.name; span.addEventListener('click',()=>{ shoppingList[cat][idx].completed=!shoppingList[cat][idx].completed; saveList(); renderCategories(); });
      const delItemBtn=document.createElement('button'); delItemBtn.innerHTML='<i class="fas fa-times-circle"></i>'; delItemBtn.addEventListener('click',()=>{ shoppingList[cat].splice(idx,1); saveList(); renderCategories(); });
      li.appendChild(checkbox); li.appendChild(span); li.appendChild(delItemBtn); ul.appendChild(li);
    });

    const addDiv=document.createElement('div'); addDiv.className='add-item';
    const addInput=document.createElement('input'); addInput.type='text'; addInput.placeholder='Adicionar novo item...';
    const addBtn=document.createElement('button'); addBtn.innerHTML='<i class="fas fa-plus"></i> Adicionar';
    addBtn.addEventListener('click',()=>{ const name=addInput.value.trim(); if(name){ if(!shoppingList[cat]) shoppingList[cat]=[]; shoppingList[cat].push({name,completed:false}); saveList(); renderCategories(); addInput.value=''; }});
    addInput.addEventListener('keypress',e=>{ if(e.key==='Enter') addBtn.click(); });
    addDiv.appendChild(addInput); addDiv.appendChild(addBtn);

    div.appendChild(header); div.appendChild(ul); div.appendChild(addDiv);
    categoriesContainer.appendChild(div);
  });
}

addCategoryBtn.addEventListener('click',()=>{ const name=newCategoryInput.value.trim(); if(name && !shoppingList[name]){ shoppingList[name]=[]; saveList(); renderCategories(); newCategoryInput.value=''; }});
newCategoryInput.addEventListener('keypress',e=>{ if(e.key==='Enter') addCategoryBtn.click(); });
resetBtn.addEventListener('click',()=>{ if(confirm('Criar nova lista?')){ shoppingList={}; saveList(); renderCategories(); }});
themeToggleBtn.addEventListener('click',toggleTheme);
if(localStorage.getItem('darkMode')==='enabled') document.body.classList.add('dark-mode');
logoutBtn.addEventListener('click',()=>{ auth.signOut().then(()=>{ window.location.href='index.html'; }); });
updateThemeButton();

auth.onAuthStateChanged(user=>{ if(!user){ window.location.href='index.html'; return; } currentUser=user; loadList(); renderCategories(); });
