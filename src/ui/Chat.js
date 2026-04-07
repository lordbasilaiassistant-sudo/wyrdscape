// =============================================================
// src/ui/Chat.js
// OSRS-style scrolling chat box.
//   createChatBox() -> { element, addMessage, clear, setActiveTab }
//
// Features
//  - 100-message cap
//  - [HH:MM] timestamps
//  - Color-coded message types
//  - Auto-scroll to bottom on new message
//  - Tab row across the bottom (All / Game / Public / Private / Friend)
//
// Owned by: ui-builder
// =============================================================

const MAX_MESSAGES = 100;

const TAB_TYPES = {
  all:     null,           // show everything
  game:    ['system', 'game', 'warning'],
  public:  ['public'],
  private: ['private'],
  friend:  ['friend'],
};

function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function fmtTime(d = new Date()) {
  return '[' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ']';
}

export function createChatBox() {
  const root = document.createElement('div');
  root.className = 'ws-chat-box';

  const messages = document.createElement('div');
  messages.className = 'ws-chat-messages';
  root.appendChild(messages);

  const tabsRow = document.createElement('div');
  tabsRow.className = 'ws-chat-tabs';
  root.appendChild(tabsRow);

  const store = []; // {ts, text, type, el}
  let activeTab = 'all';

  // Build tab buttons
  const tabDefs = [
    { id: 'all',     label: 'All' },
    { id: 'game',    label: 'Game' },
    { id: 'public',  label: 'Public' },
    { id: 'private', label: 'Private' },
    { id: 'friend',  label: 'Friends' },
  ];
  const tabBtns = {};
  for (const t of tabDefs) {
    const b = document.createElement('div');
    b.className = 'ws-chat-tab' + (t.id === activeTab ? ' active' : '');
    b.textContent = t.label;
    b.addEventListener('click', () => setActiveTab(t.id));
    tabsRow.appendChild(b);
    tabBtns[t.id] = b;
  }

  function applyFilter() {
    const allowed = TAB_TYPES[activeTab];
    for (const m of store) {
      if (!allowed || allowed.includes(m.type)) m.el.style.display = '';
      else m.el.style.display = 'none';
    }
    scrollToBottom();
  }

  function setActiveTab(id) {
    if (!tabBtns[id]) return;
    activeTab = id;
    for (const k in tabBtns) tabBtns[k].classList.toggle('active', k === id);
    applyFilter();
  }

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function addMessage(text, type = 'game') {
    const ts = fmtTime();
    const el = document.createElement('div');
    el.className = 'ws-chat-msg ' + type;
    const tsEl = document.createElement('span');
    tsEl.className = 'ts';
    tsEl.textContent = ts;
    el.appendChild(tsEl);
    el.appendChild(document.createTextNode(' ' + String(text)));
    messages.appendChild(el);

    const entry = { ts, text, type, el };
    store.push(entry);

    // Cap
    while (store.length > MAX_MESSAGES) {
      const removed = store.shift();
      if (removed.el.parentNode) removed.el.parentNode.removeChild(removed.el);
    }

    // Honor active filter
    const allowed = TAB_TYPES[activeTab];
    if (allowed && !allowed.includes(type)) el.style.display = 'none';

    scrollToBottom();
  }

  function clear() {
    store.length = 0;
    messages.innerHTML = '';
  }

  return {
    element: root,
    addMessage,
    clear,
    setActiveTab,
  };
}
