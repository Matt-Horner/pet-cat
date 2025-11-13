(function(){
  const stage = document.getElementById('stage');
  const cat = document.getElementById('cat');
  const tail = document.getElementById('tail');
  const confettiBox = document.getElementById('confetti');
  const crown = document.getElementById('crown');
  const countEl = document.getElementById('count');
  const bestEl = document.getElementById('best');
  const msgEl = document.getElementById('msg');
  const resetBtn = document.getElementById('reset');
  const toastEl = document.getElementById('toast');
  const progressEl = document.getElementById('progress');

  // магазин
  const shopToggleBtn = document.getElementById('shopToggle');
  const shopEl = document.getElementById('shop');
  const balanceEl = document.getElementById('balance');
  const shopItems = shopEl ? shopEl.querySelectorAll('.shop-item') : [];

  let petCount = 0; // текущий счётчик и валютный баланс
  let best = Number(localStorage.getItem('petBest') || 0);
  bestEl.textContent = best;
  let last = null;
  let distAccum = 0;
  let lastPetAt = 0;
  let combo = 0;

  const PET_THRESHOLD = 300;    // сколько пикселей провести, чтобы засчиталось «поглаживание»
  const COMBO_WINDOW = 520;    // мс между поглаживаниями для комбо

  const messages = [
    "Спасибо, мне так приятно 😺",
    "Ты делаешь этот мир мягче 💞",
    "Ещё чуть-чуть — и я замурчу громче 💚",
    "Ты справляешься лучше, чем думаешь.",
    "Пусть сегодня будет немного легче 💫",
    "Глубокий вдох… и выдох. Уже лучше."
  ];

  // вехи и спец-эффекты
  const milestones = {
    3:  { text:"Котик урчит довольнее… продолжай 🥰", effect: aura },
    5:  { text:"Супер темп! ✨", effect: bounce },
    10: { text:"Вау! Котик абсолютно счастлив! 🌈", effect: confettiBurst },
    15: { text:"Праздничное мурчание включено 🎶", effect: party },
    20: { text:"Королевский уровень! 👑", effect: crownShow },
    30: { text:"Невероятно! Сердечная метель 💖", effect: megaBurst }
  };

  function rnd(min,max){ return Math.random()*(max-min)+min; }

  function spawnHeart(x,y){
    const h = document.createElement('div');
    h.className = 'heart';
    h.textContent = Math.random()<0.6 ? '💗' : (Math.random()<0.5 ? '💖' : '💞');
    h.style.left = x+'px';
    h.style.top = y+'px';
    h.style.fontSize = (16 + rnd(0,10))+'px';
    stage.appendChild(h);
    h.addEventListener('animationend',()=>h.remove());
  }

  function purr(){
    const ring = document.createElement('div');
    ring.className='purr';
    stage.appendChild(ring);
    setTimeout(()=>ring.remove(),950);
    if (navigator.vibrate) navigator.vibrate(10);
    // лёгкое «виляние» хвостом
    tail.animate(
      [{transform:'rotate(0deg)'},{transform:'rotate(12deg)'},{transform:'rotate(0deg)'}],
      {duration:350, easing:'ease-out'}
    );
  }

  function setMessage(text){ msgEl.textContent = text; }

  function showToast(text){
    toastEl.textContent = text;
    toastEl.classList.add('show');
    setTimeout(()=>toastEl.classList.remove('show'), 1500);
  }

  function aura(){ stage.classList.add('aura'); setTimeout(()=>stage.classList.remove('aura'),1400); }
  function bounce(){ cat.classList.add('bounce'); setTimeout(()=>cat.classList.remove('bounce'),450); }
  function party(){
    stage.classList.add('party');
    setTimeout(()=>stage.classList.remove('party'),3200);
    if (navigator.vibrate) navigator.vibrate([20,60,20]);
  }
  function crownShow(){
    crown.classList.add('show');
    setTimeout(()=>crown.classList.remove('show'),1800);
  }

  function confettiBurst(amount=26){
    for(let i=0;i<amount;i++){
      const p = document.createElement('i');
      const hue = Math.round(rnd(330, 420)) % 360; // тёплые-розовые
      p.style.background = `hsl(${hue}, 85%, 70%)`;
      p.style.left = rnd(5,95)+'%';
      p.style.top = rnd(-10,10)+'%';
      p.style.width = rnd(6,10)+'px';
      p.style.height = rnd(10,16)+'px';
      p.style.animationDelay = rnd(0,120)+'ms';
      confettiBox.appendChild(p);
      p.addEventListener('animationend',()=>p.remove());
    }
  }
  function megaBurst(){
    confettiBurst(50);
    // дополнительно — 12 сердец из центра
    const rect = stage.getBoundingClientRect();
    for(let i=0;i<12;i++){
      spawnHeart(rect.width/2, rect.height/2);
    }
    if (navigator.vibrate) navigator.vibrate([30,80,30,80,30]);
  }

  function updateProgress(){
    // до следующей заметной вехи: 3,5,10,15,20,30, затем каждые +10
    const steps = [3,5,10,15,20,30];
    let next = steps.find(s=>s>petCount) ?? (Math.floor(petCount/10)*10 + 10);
    let prev = 0;
    for (const s of steps) { if (s<=petCount) prev = s; }
    if (petCount>=30){ prev = Math.floor(petCount/10)*10; }
    const w = next === prev ? 100 : Math.min(100, Math.round((petCount - prev) / (next - prev) * 100));
    progressEl.style.width = w + '%';
    progressEl.title = `До следующей радости: ${Math.max(0, next - petCount)}`;
  }

  function comboPop(n){
    if (n<2) return;
    const el = document.createElement('div');
    el.className = 'combo';
    el.textContent = `×${n} комбо!`;
    stage.appendChild(el);
    setTimeout(()=>el.remove(),600);
  }

  function updateBalanceUI(){
    if (balanceEl) balanceEl.textContent = petCount;
    shopItems.forEach(item => {
      const price = Number(item.dataset.price || 0);
      if (price > petCount) item.classList.add('too-expensive');
      else item.classList.remove('too-expensive');
    });
  }

  function addPet(now = performance.now()){
    // комбо
    if (now - lastPetAt <= COMBO_WINDOW) combo++;
    else combo = 1;
    lastPetAt = now;

    petCount += 1;
    countEl.textContent = petCount;
    updateBalanceUI();

    stage.classList.remove('pet-shine'); void stage.offsetWidth; stage.classList.add('pet-shine');
    cat.classList.remove('bounce');

    // сообщения
    if (milestones[petCount]) {
      setMessage(milestones[petCount].text);
      milestones[petCount].effect?.();
      showToast(milestones[petCount].text);
    } else {
      setMessage(messages[Math.floor(Math.random()*messages.length)]);
    }

    // визуалки и тактильность
    purr();
    bounce();
    comboPop(combo);

    // прогресс и рекорд
    updateProgress();
    if (petCount > best){
      best = petCount;
      bestEl.textContent = best;
      localStorage.setItem('petBest', String(best));
    }
  }

  function handleDown(clientX, clientY){
    last = {x:clientX, y:clientY};
    distAccum = 0;
    const rect = stage.getBoundingClientRect();
    spawnHeart(clientX - rect.left, clientY - rect.top);
  }

  function handleMove(clientX, clientY){
    if(!last) return;
    const dx = clientX - last.x;
    const dy = clientY - last.y;
    const step = Math.hypot(dx,dy);
    distAccum += step;
    last = {x:clientX, y:clientY};

    if (distAccum >= PET_THRESHOLD){
      distAccum = 0;
      addPet();
      const rect = stage.getBoundingClientRect();
      spawnHeart(clientX - rect.left, clientY - rect.top);
      // небольшое «виляние» всей сцены при частых движениях
      stage.animate([{filter:'brightness(1)'},{filter:'brightness(1.08)'},{filter:'brightness(1)'}],{duration:250});
    }
  }

  function handleUp(){
    last = null;
    distAccum = 0;
  }

  // покупка предметов в магазине
  function handleBuy(item){
    const price = Number(item.dataset.price || 0);
    const type = item.dataset.item || '';

    if (petCount < price){
      showToast('Не хватает поглаживаний 🙀');
      // лёгкое «потряхивание» карты
      stage.animate(
        [{transform:'translateX(0)'},{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],
        {duration:220, easing:'ease-out'}
      );
      return;
    }

    petCount -= price;
    countEl.textContent = petCount;
    updateBalanceUI();
    updateProgress();

    const rect = stage.getBoundingClientRect();

    switch(type){
      case 'treat':
        setMessage('Котик хрумкает вкусняшку 😋');
        showToast('Котик получил маленькую вкусняшку!');
        for(let i=0;i<6;i++){
          spawnHeart(rect.width/2 + rnd(-20,20), rect.height*0.45 + rnd(-10,10));
        }
        purr();
        break;
      case 'fish':
        setMessage('Целая рыбка — это праздник 🐟');
        showToast('Большая рыбка для котика!');
        confettiBurst(40);
        break;
      case 'toy':
        setMessage('Котик играет с мышкой! 🐭');
        showToast('Игрушечная мышка куплена!');
        tail.animate(
          [{transform:'rotate(0deg)'},{transform:'rotate(18deg)'},{transform:'rotate(-12deg)'},{transform:'rotate(0deg)'}],
          {duration:600, easing:'ease-out'}
        );
        bounce();
        break;
      default:
        showToast('Котик доволен покупкой 💖');
    }
  }

  // жесты
  stage.addEventListener('touchstart', e=>{
    const t = e.changedTouches[0];
    handleDown(t.clientX, t.clientY);
  }, {passive:true});
  stage.addEventListener('touchmove', e=>{
    const t = e.changedTouches[0];
    handleMove(t.clientX, t.clientY);
  }, {passive:true});
  stage.addEventListener('touchend', handleUp);
  stage.addEventListener('touchcancel', handleUp);

  let mouseDown=false;
  stage.addEventListener('mousedown', e=>{ mouseDown=true; handleDown(e.clientX,e.clientY); });
  window.addEventListener('mousemove', e=>{ if(mouseDown) handleMove(e.clientX,e.clientY); });
  window.addEventListener('mouseup', ()=>{ mouseDown=false; handleUp(); });

  // кнопки
  resetBtn.addEventListener('click', ()=>{
    petCount = 0;
    countEl.textContent = '0';
    setMessage("Сначала — мягкое касание 🐈");
    updateBalanceUI();
    updateProgress();
    crown.classList.remove('show');
  });

  if (shopToggleBtn && shopEl){
    shopToggleBtn.addEventListener('click', ()=>{
      const hidden = shopEl.hasAttribute('hidden');
      if (hidden){
        shopEl.removeAttribute('hidden');
        shopToggleBtn.setAttribute('aria-expanded','true');
        shopToggleBtn.textContent = 'Скрыть магазин';
      } else {
        shopEl.setAttribute('hidden','hidden');
        shopToggleBtn.setAttribute('aria-expanded','false');
        shopToggleBtn.textContent = 'Магазин вкусняшек';
      }
    });
  }

  shopItems.forEach(item=>{
    item.addEventListener('click', ()=>handleBuy(item));
  });

  // подсказка и стартовые состояния
  setTimeout(()=>setMessage("Проведи пальцем по котику — он любит нежные движения 🫶"),400);
  updateProgress();
  updateBalanceUI();

  // клавиатура — для доступности (пробел/Enter)
  window.addEventListener('keydown', (e)=>{
    if (e.key === ' ' || e.key === 'Enter'){
      e.preventDefault();
      addPet();
    }
  });
})();
